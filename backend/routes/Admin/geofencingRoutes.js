const express = require('express');
const router = express.Router();
const geofencingController = require('../../controllers/Student/geofencingController');

// Admin: Update class location
router.put('/:class_id/location', geofencingController.updateClassLocation);

module.exports = router;
