const router = require('express').Router();
const { User } = require('../models');
const fileBasedService = require('../services/filebasedService');
const auth = require('../middleware/auth');

// routes/calls.js
router.post('/outbound', auth, async (req, res) => {
  const { destination } = req.body;
  const user = await User.findByPk(req.user.id);
  
  try {
    const callId = await fileBasedService.initiateCall(user.extension, destination);
    res.json({ callId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;