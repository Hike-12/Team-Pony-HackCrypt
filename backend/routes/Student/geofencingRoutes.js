const express = require('express');
const router = express.Router();
const geofencingController = require('../../controllers/Student/geofencingController');

// Student: Verify location for attendance
router.post('/verify', geofencingController.verifyLocation);

// Student: Get class location info
router.get('/class/:class_id', geofencingController.getClassLocation);

module.exports = router;
