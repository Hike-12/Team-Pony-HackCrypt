/**
 * Multi-Person Tracking Service
 * 
 * Handles tracking of multiple people across video frames using
 * bounding box matching (IoU and centroid distance).
 */

/**
 * Calculate Intersection over Union (IoU) between two bounding boxes
 * @param {Object} box1 - { x, y, width, height }
 * @param {Object} box2 - { x, y, width, height }
 * @returns {number} - IoU score (0-1)
 */
function calculateIoU(box1, box2) {
    if (!box1 || !box2) return 0;

    const x1 = Math.max(box1.x, box2.x);
    const y1 = Math.max(box1.y, box2.y);
    const x2 = Math.min(box1.x + box1.width, box2.x + box2.width);
    const y2 = Math.min(box1.y + box1.height, box2.y + box2.height);

    const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    const area1 = box1.width * box1.height;
    const area2 = box2.width * box2.height;
    const union = area1 + area2 - intersection;

    return union > 0 ? intersection / union : 0;
}

/**
 * Calculate centroid distance between two bounding boxes
 * @param {Object} box1 - { x, y, width, height }
 * @param {Object} box2 - { x, y, width, height }
 * @returns {number} - Distance in pixels
 */
function calculateCentroidDistance(box1, box2) {
    if (!box1 || !box2) return Infinity;

    const center1 = {
        x: box1.x + box1.width / 2,
        y: box1.y + box1.height / 2
    };
    const center2 = {
        x: box2.x + box2.width / 2,
        y: box2.y + box2.height / 2
    };

    return Math.sqrt(
        Math.pow(center1.x - center2.x, 2) + 
        Math.pow(center1.y - center2.y, 2)
    );
}

/**
 * Match poses to identified faces using bounding box proximity
 * @param {Array} identifiedFaces - Array of { boundingBox, student }
 * @param {Array} detectedPoses - Array of pose objects with keypoints
 * @param {number} maxDistance - Maximum centroid distance for matching
 * @returns {Array} - Matched pairs of { face, pose, student }
 */
function matchPosesToFaces(identifiedFaces, detectedPoses, maxDistance = 150) {
    const matches = [];
    const usedPoses = new Set();
    const usedFaces = new Set();

    // Create pose bounding boxes
    const poseBoxes = detectedPoses.map((pose, index) => {
        const keypoints = pose.keypoints || pose;
        const validKeypoints = keypoints.filter(kp => kp.score >= 0.3);
        
        if (validKeypoints.length < 3) return null;

        const xCoords = validKeypoints.map(kp => kp.x);
        const yCoords = validKeypoints.map(kp => kp.y);

        return {
            index,
            pose,
            box: {
                x: Math.min(...xCoords),
                y: Math.min(...yCoords),
                width: Math.max(...xCoords) - Math.min(...xCoords),
                height: Math.max(...yCoords) - Math.min(...yCoords)
            }
        };
    }).filter(p => p !== null);

    // Match each face to closest pose
    for (let i = 0; i < identifiedFaces.length; i++) {
        const face = identifiedFaces[i];
        if (!face.boundingBox) continue;

        let bestMatch = null;
        let bestScore = Infinity;

        for (const poseData of poseBoxes) {
            if (usedPoses.has(poseData.index)) continue;

            // Use centroid distance for upper body matching
            // Focus on face area which should be near nose/eyes keypoints
            const distance = calculateCentroidDistance(face.boundingBox, poseData.box);
            const iou = calculateIoU(face.boundingBox, poseData.box);

            // Combined score: lower is better
            const score = distance - (iou * 100);

            if (score < bestScore && distance < maxDistance) {
                bestScore = score;
                bestMatch = poseData;
            }
        }

        if (bestMatch) {
            usedPoses.add(bestMatch.index);
            usedFaces.add(i);
            matches.push({
                face: face,
                pose: bestMatch.pose,
                poseBoundingBox: bestMatch.box,
                student: face.student,
                matchConfidence: Math.max(0, 100 - bestScore)
            });
        }
    }

    // Add unmatched poses (unknown persons)
    for (const poseData of poseBoxes) {
        if (!usedPoses.has(poseData.index)) {
            matches.push({
                face: null,
                pose: poseData.pose,
                poseBoundingBox: poseData.box,
                student: null,
                matchConfidence: 0,
                unknownPerson: true
            });
        }
    }

    return matches;
}

/**
 * Simple tracker state management
 */
class PersonTracker {
    constructor(maxMissingFrames = 10) {
        this.tracks = new Map(); // trackId -> { student, lastSeen, history }
        this.nextTrackId = 1;
        this.maxMissingFrames = maxMissingFrames;
    }

    /**
     * Update tracks with new frame detections
     * @param {Array} detections - Array of { student, boundingBox, pose }
     * @returns {Array} - Updated tracks with track IDs
     */
    update(detections) {
        const results = [];
        const usedTracks = new Set();

        // Match detections to existing tracks
        for (const detection of detections) {
            if (!detection.student) continue;

            const studentId = detection.student.student_id;
            let matchedTrackId = null;

            // Find existing track for this student
            for (const [trackId, track] of this.tracks) {
                if (track.studentId === studentId) {
                    matchedTrackId = trackId;
                    break;
                }
            }

            if (matchedTrackId) {
                // Update existing track
                const track = this.tracks.get(matchedTrackId);
                track.lastSeen = Date.now();
                track.missingFrames = 0;
                track.lastBoundingBox = detection.boundingBox;
                track.history.push({
                    timestamp: Date.now(),
                    pose: detection.pose,
                    boundingBox: detection.boundingBox
                });

                // Keep only last 30 frames of history
                if (track.history.length > 30) {
                    track.history.shift();
                }

                usedTracks.add(matchedTrackId);
                results.push({ ...detection, trackId: matchedTrackId });
            } else {
                // Create new track
                const trackId = this.nextTrackId++;
                this.tracks.set(trackId, {
                    studentId: studentId,
                    student: detection.student,
                    lastSeen: Date.now(),
                    missingFrames: 0,
                    lastBoundingBox: detection.boundingBox,
                    history: [{
                        timestamp: Date.now(),
                        pose: detection.pose,
                        boundingBox: detection.boundingBox
                    }]
                });
                usedTracks.add(trackId);
                results.push({ ...detection, trackId });
            }
        }

        // Update missing frame count for unmatched tracks
        for (const [trackId, track] of this.tracks) {
            if (!usedTracks.has(trackId)) {
                track.missingFrames++;
                if (track.missingFrames > this.maxMissingFrames) {
                    this.tracks.delete(trackId);
                }
            }
        }

        return results;
    }

    /**
     * Get track history for a student
     * @param {string} studentId - Student ID
     * @returns {Array|null} - History array or null
     */
    getHistory(studentId) {
        for (const [, track] of this.tracks) {
            if (track.studentId === studentId) {
                return track.history;
            }
        }
        return null;
    }

    /**
     * Get all active tracks
     * @returns {Array}
     */
    getActiveTracks() {
        return Array.from(this.tracks.entries()).map(([trackId, track]) => ({
            trackId,
            studentId: track.studentId,
            student: track.student,
            lastSeen: track.lastSeen,
            missingFrames: track.missingFrames
        }));
    }

    /**
     * Clear all tracks
     */
    clear() {
        this.tracks.clear();
        this.nextTrackId = 1;
    }
}

module.exports = {
    calculateIoU,
    calculateCentroidDistance,
    matchPosesToFaces,
    PersonTracker
};
