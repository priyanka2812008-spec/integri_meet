// In-memory store fallback for demo purposes if MongoDB is not available
let sessions = {};
let logs = [];

const MemoryStore = {
  // Session operations
  findSession: (roomId) => sessions[roomId] || null,
  
  createSession: (data) => {
    sessions[data.roomId] = {
      ...data,
      participants: data.participants || [],
      createdAt: new Date(),
      status: 'active',
      currentCode: '// Start coding here...\n'
    };
    return sessions[data.roomId];
  },
  
  updateSession: (roomId, updateFn) => {
    if (sessions[roomId]) {
      updateFn(sessions[roomId]);
      return sessions[roomId];
    }
    return null;
  },

  // Log operations
  addLog: (logData) => {
    const newLog = { ...logData, _id: Date.now().toString(), timestamp: new Date() };
    logs.push(newLog);
    return newLog;
  },
  
  getLogs: (roomId) => {
    return logs.filter(l => l.roomId === roomId).sort((a, b) => b.timestamp - a.timestamp);
  }
};

module.exports = MemoryStore;
