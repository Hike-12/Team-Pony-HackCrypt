/**
 * Attention Engine
 * 
 * Computes attentiveness scores using posture heuristics.
 * Analyzes pose data to determine if a student is paying attention.
 */

const poseService = require('./poseService');

// Attention status constants
const ATTENTION_STATUS = {
    ATTENTIVE: 'attentive',
    DISTRACTED: 'distracted',
    VERY_DISTRACTED: 'very_distracted',
    AWAY: 'away',
    UNKNOWN: 'unknown'
};

// Distraction reasons
const DISTRACTION_REASONS = {
    HEAD_DOWN: 'head down',
    SLOUCHING: 'slouching',
    FACE_NOT_VISIBLE: 'face not visible',
    LOOKING_AWAY: 'looking away',
    MISSING_FROM_FRAME: 'missing from frame',
    POOR_POSTURE: 'poor posture',
    EYES_CLOSED: 'eyes possibly closed'
};

/**
 * Calculate attention score from pose analysis
 * @param {Object} poseAnalysis - Results from pose analysis
 * @returns {Object} - { score, status, reasons }
 */
function calculateAttentionScore(poseAnalysis) {
    let score = 100;
    const reasons = [];

    // Deduct points for various issues
    if (poseAnalysis.headPosition.isHeadDown) {
        score -= 35;
        reasons.push(DISTRACTION_REASONS.HEAD_DOWN);
    }

    if (!poseAnalysis.headPosition.noseVisible) {
        score -= 25;
        reasons.push(DISTRACTION_REASONS.FACE_NOT_VISIBLE);
    }

    if (!poseAnalysis.headPosition.eyesVisible) {
        score -= 15;
        reasons.push(DISTRACTION_REASONS.EYES_CLOSED);
    }

    if (poseAnalysis.shoulderPosture.isSlouching) {
        score -= 20;
        reasons.push(DISTRACTION_REASONS.SLOUCHING);
    }

    if (poseAnalysis.shoulderPosture.shoulderDrop > 30) {
        score -= 10;
        reasons.push(DISTRACTION_REASONS.POOR_POSTURE);
    }

    if (!poseAnalysis.faceVisible) {
        score -= 30;
        if (!reasons.includes(DISTRACTION_REASONS.FACE_NOT_VISIBLE)) {
            reasons.push(DISTRACTION_REASONS.LOOKING_AWAY);
        }
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    // Determine status based on score
    let status;
    if (score >= 75) {
        status = ATTENTION_STATUS.ATTENTIVE;
    } else if (score >= 50) {
        status = ATTENTION_STATUS.DISTRACTED;
    } else if (score > 0) {
        status = ATTENTION_STATUS.VERY_DISTRACTED;
    } else {
        status = ATTENTION_STATUS.AWAY;
    }

    return {
        score: Math.round(score),
        status,
        reasons: reasons.length > 0 ? reasons : ['engaged']
    };
}

/**
 * Analyze a single person's attention from their pose
 * @param {Object} poseKeypoints - Array of MoveNet keypoints
 * @returns {Object} - Attention analysis result
 */
function analyzePersonAttention(poseKeypoints) {
    if (!poseKeypoints || poseKeypoints.length === 0) {
        return {
            score: 0,
            status: ATTENTION_STATUS.AWAY,
            reasons: [DISTRACTION_REASONS.MISSING_FROM_FRAME],
            poseQuality: 0
        };
    }

    const headPosition = poseService.analyzeHeadPosition(poseKeypoints);
    const shoulderPosture = poseService.analyzeShoulderPosture(poseKeypoints);
    const faceVisible = poseService.isFaceVisible(poseKeypoints);
    const poseQuality = poseService.getPoseQuality(poseKeypoints);

    const poseAnalysis = {
        headPosition,
        shoulderPosture,
        faceVisible,
        poseQuality
    };

    const attention = calculateAttentionScore(poseAnalysis);

    return {
        ...attention,
        poseQuality,
        analysis: poseAnalysis
    };
}

/**
 * Analyze attention for multiple tracked persons
 * @param {Array} trackedPersons - Array of { student, pose, trackId }
 * @returns {Array} - Array of attention results per person
 */
function analyzeMultiplePersonsAttention(trackedPersons) {
    return trackedPersons.map(person => {
        const keypoints = person.pose?.keypoints || person.pose || [];
        const attention = analyzePersonAttention(keypoints);

        return {
            student_id: person.student?.student_id || null,
            full_name: person.student?.full_name || 'Unknown',
            roll_no: person.student?.roll_no || 'N/A',
            image_url: person.student?.image_url || null,
            trackId: person.trackId,
            identified: !!person.student,
            attention_score: attention.score,
            status: attention.status,
            reasons: attention.reasons,
            pose_quality: attention.poseQuality
        };
    });
}

/**
 * Calculate temporal attention score using history
 * Smooths out momentary fluctuations
 * @param {Array} history - Array of { attention_score, timestamp }
 * @param {number} windowMs - Time window in milliseconds
 * @returns {number} - Smoothed attention score
 */
function calculateTemporalAttentionScore(history, windowMs = 5000) {
    if (!history || history.length === 0) return 0;

    const now = Date.now();
    const recentHistory = history.filter(h => now - h.timestamp < windowMs);

    if (recentHistory.length === 0) return history[history.length - 1]?.attention_score || 0;

    // Weighted average (more recent = higher weight)
    let weightedSum = 0;
    let weightTotal = 0;

    recentHistory.forEach((h, index) => {
        const weight = index + 1; // Later entries have higher weight
        weightedSum += h.attention_score * weight;
        weightTotal += weight;
    });

    return Math.round(weightedSum / weightTotal);
}

/**
 * Generate class-level attention summary
 * @param {Array} studentAttentions - Array of individual attention results
 * @returns {Object} - Summary statistics
 */
function generateClassSummary(studentAttentions) {
    const identified = studentAttentions.filter(s => s.identified);
    
    if (identified.length === 0) {
        return {
            total_detected: studentAttentions.length,
            identified_count: 0,
            average_attention: 0,
            attentive_count: 0,
            distracted_count: 0,
            away_count: 0,
            attention_distribution: {}
        };
    }

    const scores = identified.map(s => s.attention_score);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    const statusCounts = {
        [ATTENTION_STATUS.ATTENTIVE]: 0,
        [ATTENTION_STATUS.DISTRACTED]: 0,
        [ATTENTION_STATUS.VERY_DISTRACTED]: 0,
        [ATTENTION_STATUS.AWAY]: 0
    };

    identified.forEach(s => {
        statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
    });

    return {
        total_detected: studentAttentions.length,
        identified_count: identified.length,
        average_attention: avgScore,
        attentive_count: statusCounts[ATTENTION_STATUS.ATTENTIVE],
        distracted_count: statusCounts[ATTENTION_STATUS.DISTRACTED] + statusCounts[ATTENTION_STATUS.VERY_DISTRACTED],
        away_count: statusCounts[ATTENTION_STATUS.AWAY],
        attention_distribution: statusCounts
    };
}

module.exports = {
    ATTENTION_STATUS,
    DISTRACTION_REASONS,
    calculateAttentionScore,
    analyzePersonAttention,
    analyzeMultiplePersonsAttention,
    calculateTemporalAttentionScore,
    generateClassSummary
};
