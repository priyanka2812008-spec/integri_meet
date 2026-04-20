require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Models & Services
const Session = require('./models/Session');
const Log = require('./models/Log');
const { sendTerminationEmail } = require('./services/emailService');
const MemoryStore = require('./services/memoryStore');

// Routes
const meetingRoutes = require('./routes/meeting');
const aiRoutes = require('./routes/ai');

const app = express();
const server = http.createServer(app);

// Helper to check if DB is connected
const isDbConnected = () => mongoose.connection.readyState === 1;

// Connect to Database
connectDB();

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Main Routes
app.use('/api/meeting', meetingRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
  res.send('IntegriMeet Backend is running');
});

// Socket.IO logic
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join-room', async ({ roomId, email, role }) => {
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.email = email;
    socket.data.role = role;

    const logData = {
      roomId,
      userEmail: email,
      eventType: 'join',
      details: `${role} joined the room`
    };

    if (isDbConnected()) {
      await Log.create(logData);
      const session = await Session.findOne({ roomId });
      if (session) {
        const pIndex = session.participants.findIndex(p => p.email === email);
        if (pIndex !== -1) {
          session.participants[pIndex].socketId = socket.id;
          session.participants[pIndex].status = 'live';
          await session.save();
        }
      }
    } else {
      MemoryStore.addLog(logData);
      MemoryStore.updateSession(roomId, (s) => {
        const p = s.participants.find(part => part.email === email);
        if (p) {
          p.socketId = socket.id;
          p.status = 'live';
        }
      });
    }

    // Notify others in room with the specific socket ID of the new user
    socket.to(roomId).emit('user-joined', { email, socketId: socket.id, role });
    // Notify the host dashboard to refresh participants
    io.to(roomId).emit('refresh-dashboard');
  });

  // WebRTC Signaling - Directed to specific target
  socket.on('offer', ({ target, offer, from }) => {
    io.to(target).emit('offer', { offer, from });
  });

  socket.on('answer', ({ target, answer, from }) => {
    io.to(target).emit('answer', { answer, from });
  });

  socket.on('ice-candidate', ({ target, candidate, from }) => {
    io.to(target).emit('ice-candidate', { candidate, from });
  });

  socket.on('tab-switch', async ({ roomId, userEmail, customReason }) => {
    console.log(`SECURITY VIOLATION: ${userEmail} - ${customReason || 'Tab switch'}`);
    const reason = customReason || 'Tab switch detected';
    const logData = { roomId, userEmail, eventType: 'security_violation', details: reason };
    
    let hostEmail = '';

    if (isDbConnected()) {
      await Log.create(logData);
      const session = await Session.findOne({ roomId });
      if (session) {
        hostEmail = session.hostEmail;
        const p = session.participants.find(part => part.email === userEmail);
        if (p) { p.status = 'terminated'; p.reason = reason; await session.save(); }
      }
    } else {
      MemoryStore.addLog(logData);
      const session = MemoryStore.findSession(roomId);
      if (session) {
        hostEmail = session.hostEmail;
        const p = session.participants.find(part => part.email === userEmail);
        if (p) { p.status = 'terminated'; p.reason = reason; }
      }
    }

    if (hostEmail) sendTerminationEmail(hostEmail, userEmail, reason);
    
    io.to(roomId).emit('alert', { type: 'violation', message: `ALERT: User ${userEmail} - ${reason}`, userEmail });
    io.to(roomId).emit('refresh-dashboard');
    socket.emit('user-terminated', { reason: `You have been removed due to suspicious activity: ${reason}` });
  });

  socket.on('camera-status', async ({ roomId, userEmail, status }) => {
    io.to(roomId).emit('participant-camera-status', { userEmail, status });
    if (isDbConnected()) {
      const session = await Session.findOne({ roomId });
      if (session) {
        const p = session.participants.find(part => part.email === userEmail);
        if (p && p.status !== 'terminated') { p.status = status ? 'live' : 'camera_disabled'; await session.save(); }
      }
    } else {
      MemoryStore.updateSession(roomId, (s) => {
        const p = s.participants.find(part => part.email === userEmail);
        if (p && p.status !== 'terminated') p.status = status ? 'live' : 'camera_disabled';
      });
    }
    io.to(roomId).emit('refresh-dashboard');
  });
  
  // Collaborative Code Update
  socket.on('code-update', async ({ roomId, code }) => {
    socket.to(roomId).emit('code-update', { code });
    
    // Persist to DB or Memory
    if (isDbConnected()) {
      await Session.findOneAndUpdate({ roomId }, { currentCode: code });
    } else {
      MemoryStore.updateSession(roomId, (s) => s.currentCode = code);
    }
  });

  // Additional Security Alerts (e.g., Copy-Paste)
  socket.on('security-alert', async ({ roomId, userEmail, type, message }) => {
    console.log(`SECURITY ALERT: ${userEmail} - ${type}: ${message}`);
    const details = `${type}: ${message}`;
    const logData = { roomId, userEmail, eventType: 'security_alert', details };

    if (isDbConnected()) {
      await Log.create(logData);
    } else {
      MemoryStore.addLog(logData);
    }

    io.to(roomId).emit('alert', { type: 'security', message: `ALERT: ${userEmail} - ${details}`, userEmail });
    io.to(roomId).emit('refresh-dashboard');
  });

  socket.on('disconnect', async () => {
    const { roomId, email } = socket.data;
    if (roomId && email) {
      if (isDbConnected()) {
        await Log.create({ roomId, userEmail: email, eventType: 'leave', details: 'User disconnected' });
        const session = await Session.findOne({ roomId });
        if (session) {
          const p = session.participants.find(part => part.email === email);
          if (p && p.status !== 'terminated') { p.status = 'left'; p.leftAt = new Date(); await session.save(); }
        }
      } else {
        MemoryStore.addLog({ roomId, userEmail: email, eventType: 'leave', details: 'User disconnected' });
        MemoryStore.updateSession(roomId, (s) => {
          const p = s.participants.find(part => part.email === email);
          if (p && p.status !== 'terminated') { p.status = 'left'; p.leftAt = new Date(); }
        });
      }
      socket.to(roomId).emit('user-left', { socketId: socket.id, email });
      io.to(roomId).emit('refresh-dashboard');
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
