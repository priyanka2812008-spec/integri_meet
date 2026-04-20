const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  hostEmail: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'ended'], default: 'active' },
  participants: [{
    email: { type: String },
    name: { type: String },
    socketId: { type: String },
    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date },
    status: { type: String, enum: ['live', 'camera_disabled', 'terminated', 'left'], default: 'live' },
    reason: { type: String }
  }],
  currentCode: { type: String, default: '// Start coding here...\n' }
});

module.exports = mongoose.model('Session', sessionSchema);
