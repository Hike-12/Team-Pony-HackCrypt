const express = require('express');
const router = express.Router();
const leaveController = require('../../controllers/leaveController');
const upload = require('../../middleware/uploadMiddleware');

// Apply for leave (with optional file upload)
router.post('/apply', upload.single('document'), leaveController.createLeaveApplication);

// Get my leave applications
router.get('/my-applications/:studentId', leaveController.getMyLeaveApplications);

// Get leave statistics
router.get('/stats/:studentId', leaveController.getLeaveStats);

// Cancel leave application
router.delete('/:leaveId', leaveController.cancelLeaveApplication);

module.exports = router;
