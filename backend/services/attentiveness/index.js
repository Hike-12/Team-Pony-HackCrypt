/**
 * Attentiveness Module - Main Entry Point
 * 
 * Orchestrates face recognition, pose detection, tracking, and attention analysis.
 * This is the main interface for the attentiveness monitoring system.
 */

const faceService = require('./faceService');
const poseService = require('./poseService');
const trackingService = require('./trackingService');
const attentionEngine = require('./attentionEngine');

// Global tracker instance per session
const sessionTrackers = new Map();

/**
 * Get or create a tracker for a session
 * @param {string} sessionId - Unique session identifier
 * @returns {PersonTracker}
 */
function getTracker(sessionId) {
    if (!sessionTrackers.has(sessionId)) {
        sessionTrackers.set(sessionId, new trackingService.PersonTracker());
    }
    return sessionTrackers.get(sessionId);
}

/**
 * Process a frame for attentiveness analysis
 * 
 * @param {Object} params
 * @param {string} params.sessionId - Session identifier for tracking continuity
 * @param {Array} params.detectedFaces - Array of { embedding, boundingBox }
 * @param {Array} params.detectedPoses - Array of MoveNet pose results
 * @returns {Promise<Object>} - Analysis results
 */
async function processFrame({ sessionId, detectedFaces = [], detectedPoses = [] }) {
    const tracker = getTracker(sessionId);

    // Step 1: Identify faces from embeddings
    const identifiedFaces = await faceService.identifyMultipleFaces(detectedFaces);

    // Step 2: Match poses to identified faces
    const matched = trackingService.matchPosesToFaces(identifiedFaces, detectedPoses);

    // Step 3: Update tracker with matched detections
    const tracked = tracker.update(matched.map(m => ({
        student: m.student,
        boundingBox: m.face?.boundingBox || m.poseBoundingBox,
        pose: m.pose
    })));

    // Step 4: Analyze attention for each tracked person
    const attentionResults = attentionEngine.analyzeMultiplePersonsAttention(tracked);

    // Step 5: Generate class summary
    const summary = attentionEngine.generateClassSummary(attentionResults);

    return {
        timestamp: Date.now(),
        session_id: sessionId,
        students: attentionResults,
        summary,
        active_tracks: tracker.getActiveTracks().length
    };
}

/**
 * Get all enrolled students for display
 * @returns {Promise<Array>}
 */
async function getEnrolledStudents() {
    return await faceService.getAllEnrolledStudents();
}

/**
 * Clear session tracker
 * @param {string} sessionId
 */
function clearSession(sessionId) {
    if (sessionTrackers.has(sessionId)) {
        sessionTrackers.get(sessionId).clear();
        sessionTrackers.delete(sessionId);
    }
}

/**
 * Get session tracker status
 * @param {string} sessionId
 * @returns {Object}
 */
function getSessionStatus(sessionId) {
    const tracker = sessionTrackers.get(sessionId);
    if (!tracker) {
        return { active: false, tracks: 0 };
    }
    return {
        active: true,
        tracks: tracker.getActiveTracks().length,
        activeTracks: tracker.getActiveTracks()
    };
}

module.exports = {
    processFrame,
    getEnrolledStudents,
    clearSession,
    getSessionStatus,
    // Export sub-modules for direct access if needed
    faceService,
    poseService,
    trackingService,
    attentionEngine
};
