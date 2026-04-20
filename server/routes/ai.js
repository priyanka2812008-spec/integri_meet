const express = require('express');
const router = express.Router();
const axios = require('axios');
const Log = require('../models/Log');
const Session = require('../models/Session');
const { sendTerminationEmail } = require('../services/emailService');

// Proxy to Python AI detection
router.post('/detect', async (req, res) => {
  try {
    const { imageBase64, roomId, userEmail } = req.body;
    
    // In a real scenario, we'd send the image to Python.
    // Here we're using a mock endpoint, but let's wire it up just in case
    const aiResponse = await axios.post(`${process.env.AI_MODULE_URL}/detect`, {
      image: imageBase64
    }).catch(e => ({ data: { suspicious: false, confidence: 0 } })); // fallback if AI off

    if (aiResponse.data.suspicious) {
      // Log it
      await Log.create({
        roomId,
        userEmail,
        eventType: 'ai_suspicious_overlay',
        details: `Confidence: ${aiResponse.data.confidence}`
      });
      // Not instantly terminating for AI simulation to avoid too many arbitrary kicks,
      // but in real app we could kick or flag. We'll return the result.
    }

    res.json(aiResponse.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI processing failed' });
  }
});

module.exports = router;
