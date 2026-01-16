const express = require('express');
const router = express.Router();
const Class = require('../models/Class');

// Get all classes
router.get('/', async (req, res) => {
  try {
    const classes = await Class.find().sort({ batch_year: -1, division: 1 });
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
