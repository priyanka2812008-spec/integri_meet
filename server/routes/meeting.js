const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Session = require('../models/Session');
const Log = require('../models/Log');
const MemoryStore = require('../services/memoryStore');

// Helper to check if DB is connected
const isDbConnected = () => mongoose.connection.readyState === 1;

// Create or join a meeting room
router.post('/create', async (req, res) => {
  try {
    const { roomId, hostEmail, role, participantName, participantEmail } = req.body;

    let session;
    if (isDbConnected()) {
      session = await Session.findOne({ roomId });
    } else {
      session = MemoryStore.findSession(roomId);
    }

    if (role === 'host') {
      if (session) {
        return res.status(400).json({ error: 'Room already exists' });
      }
      
      const sessionData = {
        roomId,
        hostEmail,
        participants: []
      };

      if (isDbConnected()) {
        session = new Session(sessionData);
        await session.save();
      } else {
        session = MemoryStore.createSession(sessionData);
      }
      
      return res.status(201).json({ message: 'Room created', session });
    } else {
      if (!session) {
        return res.status(404).json({ error: 'Room not found' });
      }
      
      // Check if participant already terminated
      const existingParticipant = session.participants.find(p => p.email === participantEmail);
      if (existingParticipant && existingParticipant.status === 'terminated') {
        return res.status(403).json({ error: 'You have been restricted from joining this meeting' });
      }

      if (!existingParticipant) {
         if (isDbConnected()) {
           session.participants.push({
             email: participantEmail,
             name: participantName,
             status: 'live'
           });
           await session.save();
         } else {
           MemoryStore.updateSession(roomId, (s) => {
             s.participants.push({
               email: participantEmail,
               name: participantName,
               status: 'live',
               joinedAt: new Date()
             });
           });
           session = MemoryStore.findSession(roomId);
         }
      }

      return res.status(200).json({ message: 'Joined room successfully', session });
    }
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// Get session info
router.get('/:roomId', async (req, res) => {
  try {
    let session;
    if (isDbConnected()) {
      session = await Session.findOne({ roomId: req.params.roomId });
    } else {
      session = MemoryStore.findSession(req.params.roomId);
    }
    
    if (!session) return res.status(404).json({ error: 'Room not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get logs for a session
router.get('/:roomId/logs', async (req, res) => {
  try {
    let logs;
    if (isDbConnected()) {
      logs = await Log.find({ roomId: req.params.roomId }).sort({ timestamp: -1 });
    } else {
      logs = MemoryStore.getLogs(req.params.roomId);
    }
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
