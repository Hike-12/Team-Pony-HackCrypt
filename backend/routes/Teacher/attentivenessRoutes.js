/**
 * Attentiveness Monitoring Routes
 * 
 * API routes for the AI attentiveness monitoring system.
 */

const express = require('express');
const router = express.Router();
const attentivenessController = require('../../controllers/Teacher/attentivenessController');

// Frame analysis endpoint
router.post('/analyze', attentivenessController.analyzeFrame);

// Get enrolled students with face data
router.get('/enrolled-students', attentivenessController.getEnrolledStudents);

// Get students by class
router.get('/class/:classId/students', attentivenessController.getClassStudents);

// Session management
router.post('/session/start', attentivenessController.startSession);
router.post('/session/end', attentivenessController.endSession);
router.get('/session/:sessionId/status', attentivenessController.getSessionStatus);

// Get all embeddings for client-side matching
router.get('/embeddings', attentivenessController.getAllEmbeddings);

module.exports = router;
