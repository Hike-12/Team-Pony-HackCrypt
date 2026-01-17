/**
 * Pose Detection Service (MoveNet)
 * 
 * Handles pose detection using TensorFlow.js MoveNet model.
 * Extracts keypoints for posture analysis.
 */

/**
 * MoveNet keypoint indices for reference:
 * 0: nose, 1: left_eye, 2: right_eye, 3: left_ear, 4: right_ear
 * 5: left_shoulder, 6: right_shoulder, 7: left_elbow, 8: right_elbow
 * 9: left_wrist, 10: right_wrist, 11: left_hip, 12: right_hip
 * 13: left_knee, 14: right_knee, 15: left_ankle, 16: right_ankle
 */

const KEYPOINT_NAMES = [
    'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
    'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
    'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
    'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
];

const KEYPOINT_INDICES = {
    nose: 0,
    left_eye: 1,
    right_eye: 2,
    left_ear: 3,
    right_ear: 4,
    left_shoulder: 5,
    right_shoulder: 6,
    left_elbow: 7,
    right_elbow: 8,
    left_wrist: 9,
    right_wrist: 10,
    left_hip: 11,
    right_hip: 12,
    left_knee: 13,
    right_knee: 14,
    left_ankle: 15,
    right_ankle: 16
};

/**
 * Extract bounding box from pose keypoints
 * @param {Array} keypoints - Array of keypoint objects with x, y, score
 * @param {number} confidenceThreshold - Minimum confidence for keypoint
 * @returns {Object|null} - { x, y, width, height } or null
 */
function getPoseBoundingBox(keypoints, confidenceThreshold = 0.3) {
    const validKeypoints = keypoints.filter(kp => kp.score >= confidenceThreshold);
    
    if (validKeypoints.length < 3) return null;

    const xCoords = validKeypoints.map(kp => kp.x);
    const yCoords = validKeypoints.map(kp => kp.y);

    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const minY = Math.min(...yCoords);
    const maxY = Math.max(...yCoords);

    // Add padding
    const padding = 20;
    
    return {
        x: Math.max(0, minX - padding),
        y: Math.max(0, minY - padding),
        width: (maxX - minX) + padding * 2,
        height: (maxY - minY) + padding * 2
    };
}

/**
 * Get keypoint by name from keypoints array
 * @param {Array} keypoints - Array of keypoint objects
 * @param {string} name - Keypoint name
 * @returns {Object|null} - Keypoint object or null
 */
function getKeypoint(keypoints, name) {
    const index = KEYPOINT_INDICES[name];
    if (index === undefined) return null;
    return keypoints[index] || null;
}

/**
 * Check if a keypoint is visible (above confidence threshold)
 * @param {Object} keypoint - Keypoint object with score
 * @param {number} threshold - Confidence threshold
 * @returns {boolean}
 */
function isKeypointVisible(keypoint, threshold = 0.3) {
    return keypoint && keypoint.score >= threshold;
}

/**
 * Calculate angle between three points
 * @param {Object} p1 - First point { x, y }
 * @param {Object} p2 - Vertex point { x, y }
 * @param {Object} p3 - Third point { x, y }
 * @returns {number} - Angle in degrees
 */
function calculateAngle(p1, p2, p3) {
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
    
    const dot = v1.x * v2.x + v1.y * v2.y;
    const cross = v1.x * v2.y - v1.y * v2.x;
    
    let angle = Math.atan2(cross, dot) * (180 / Math.PI);
    return Math.abs(angle);
}

/**
 * Analyze pose for head position
 * @param {Array} keypoints - Pose keypoints
 * @returns {Object} - { isHeadDown, headTilt, noseVisible }
 */
function analyzeHeadPosition(keypoints) {
    const nose = getKeypoint(keypoints, 'nose');
    const leftEye = getKeypoint(keypoints, 'left_eye');
    const rightEye = getKeypoint(keypoints, 'right_eye');
    const leftShoulder = getKeypoint(keypoints, 'left_shoulder');
    const rightShoulder = getKeypoint(keypoints, 'right_shoulder');

    const result = {
        isHeadDown: false,
        headTilt: 0,
        noseVisible: isKeypointVisible(nose),
        eyesVisible: isKeypointVisible(leftEye) || isKeypointVisible(rightEye)
    };

    // Check if head is down (nose below eye level significantly)
    if (isKeypointVisible(nose) && (isKeypointVisible(leftEye) || isKeypointVisible(rightEye))) {
        const eyeY = isKeypointVisible(leftEye) && isKeypointVisible(rightEye) 
            ? (leftEye.y + rightEye.y) / 2 
            : (isKeypointVisible(leftEye) ? leftEye.y : rightEye.y);
        
        const noseDrop = nose.y - eyeY;
        // If nose is significantly below eyes, head is tilted down
        result.isHeadDown = noseDrop > 30;
    }

    // Check shoulder alignment for head tilt
    if (isKeypointVisible(leftShoulder) && isKeypointVisible(rightShoulder)) {
        const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
        if (isKeypointVisible(nose)) {
            // Large gap between nose and shoulder line indicates looking down
            const verticalGap = shoulderMidY - nose.y;
            if (verticalGap < 20) {
                result.isHeadDown = true;
            }
        }
    }

    return result;
}

/**
 * Analyze shoulder posture for slouching
 * @param {Array} keypoints - Pose keypoints
 * @returns {Object} - { isSlouching, shoulderDrop }
 */
function analyzeShoulderPosture(keypoints) {
    const leftShoulder = getKeypoint(keypoints, 'left_shoulder');
    const rightShoulder = getKeypoint(keypoints, 'right_shoulder');
    const nose = getKeypoint(keypoints, 'nose');

    const result = {
        isSlouching: false,
        shoulderDrop: 0,
        shouldersVisible: isKeypointVisible(leftShoulder) && isKeypointVisible(rightShoulder)
    };

    if (!result.shouldersVisible) return result;

    // Check shoulder level difference (uneven shoulders can indicate slouching)
    result.shoulderDrop = Math.abs(leftShoulder.y - rightShoulder.y);
    
    // If nose is too close to shoulder line, person is slouching forward
    if (isKeypointVisible(nose)) {
        const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
        const noseToShoulderDistance = shoulderMidY - nose.y;
        
        // Normal upright posture has nose well above shoulders
        result.isSlouching = noseToShoulderDistance < 50;
    }

    return result;
}

/**
 * Check if person's face is visible in frame
 * @param {Array} keypoints - Pose keypoints
 * @returns {boolean}
 */
function isFaceVisible(keypoints) {
    const nose = getKeypoint(keypoints, 'nose');
    const leftEye = getKeypoint(keypoints, 'left_eye');
    const rightEye = getKeypoint(keypoints, 'right_eye');

    const noseVisible = isKeypointVisible(nose, 0.4);
    const eyesVisible = isKeypointVisible(leftEye, 0.4) || isKeypointVisible(rightEye, 0.4);

    return noseVisible && eyesVisible;
}

/**
 * Get overall pose quality score
 * @param {Array} keypoints - Pose keypoints
 * @returns {number} - Quality score 0-100
 */
function getPoseQuality(keypoints) {
    const visibleCount = keypoints.filter(kp => isKeypointVisible(kp, 0.3)).length;
    return Math.round((visibleCount / keypoints.length) * 100);
}

module.exports = {
    KEYPOINT_NAMES,
    KEYPOINT_INDICES,
    getPoseBoundingBox,
    getKeypoint,
    isKeypointVisible,
    calculateAngle,
    analyzeHeadPosition,
    analyzeShoulderPosture,
    isFaceVisible,
    getPoseQuality
};
