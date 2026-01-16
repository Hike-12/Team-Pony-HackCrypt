const express = require('express');
const router = express.Router();
const leaveController = require('../../controllers/leaveController');
const { verifyDocument } = require('../../controllers/documentVerification');

// Get all pending leaves for review
router.get('/pending', leaveController.getPendingLeaves);

// Get all leaves with filters
router.get('/all', leaveController.getAllLeaves);

// Approve a leave
router.put('/:leaveId/approve', leaveController.approveLeave);

// Reject a leave
router.put('/:leaveId/reject', leaveController.rejectLeave);

// Verify document authenticity
router.post('/:leaveId/verify-document', verifyDocument);

// Get leave statistics
router.get('/stats', leaveController.getTeacherLeaveStats);

module.exports = router;
