const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  userEmail: { type: String },
  eventType: { type: String, required: true }, // e.g., 'tab_switch', 'camera_off', 'termination', 'join', 'leave'
  timestamp: { type: Date, default: Date.now },
  details: { type: String }
});

module.exports = mongoose.model('Log', logSchema);
