/**
 * Attentiveness Monitoring Controller
 * 
 * Handles API endpoints for the AI attentiveness monitoring system.
 */

const attentivenessModule = require('../../services/attentiveness');
const StudentBiometric = require('../../models/StudentBiometric');
const Student = require('../../models/Student');

/**
 * Process a video frame for attentiveness analysis
 * POST /api/teacher/attentiveness/analyze
 * 
 * Body: {
 *   session_id: string,
 *   detected_faces: [{ embedding: Array, boundingBox: { x, y, width, height } }],
 *   detected_poses: [{ keypoints: Array }]
 * }
 */
exports.analyzeFrame = async (req, res) => {
    try {
        const { session_id, detected_faces = [], detected_poses = [] } = req.body;

        if (!session_id) {
            return res.status(400).json({
                success: false,
                message: 'session_id is required'
            });
        }

        const result = await attentivenessModule.processFrame({
            sessionId: session_id,
            detectedFaces: detected_faces,
            detectedPoses: detected_poses
        });

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Attentiveness analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Error analyzing frame',
            error: error.message
        });
    }
};

/**
 * Get all enrolled students with face embeddings
 * GET /api/teacher/attentiveness/enrolled-students
 */
exports.getEnrolledStudents = async (req, res) => {
    try {
        const students = await attentivenessModule.getEnrolledStudents();

        res.json({
            success: true,
            data: students,
            count: students.length
        });

    } catch (error) {
        console.error('Error fetching enrolled students:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching enrolled students',
            error: error.message
        });
    }
};

/**
 * Get students by class for monitoring
 * GET /api/teacher/attentiveness/class/:classId/students
 */
exports.getClassStudents = async (req, res) => {
    try {
        const { classId } = req.params;

        // Get all students in the class
        const students = await Student.find({ class_id: classId }).lean();
        const studentIds = students.map(s => s._id);

        // Get biometric data for these students
        const biometrics = await StudentBiometric.find({
            student_id: { $in: studentIds },
            face_enrolled: true
        }).lean();

        const biometricMap = {};
        biometrics.forEach(b => {
            biometricMap[b.student_id.toString()] = b;
        });

        // Combine data
        const result = students.map(s => ({
            student_id: s._id.toString(),
            full_name: s.full_name,
            roll_no: s.roll_no,
            image_url: s.image_url,
            face_enrolled: !!biometricMap[s._id.toString()],
            has_embedding: !!biometricMap[s._id.toString()]?.face_embedding
        }));

        res.json({
            success: true,
            data: result,
            total: result.length,
            enrolled: result.filter(s => s.face_enrolled).length
        });

    } catch (error) {
        console.error('Error fetching class students:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching class students',
            error: error.message
        });
    }
};

/**
 * Start a monitoring session
 * POST /api/teacher/attentiveness/session/start
 */
exports.startSession = async (req, res) => {
    try {
        const { class_id, subject_id } = req.body;
        const session_id = `attn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Clear any existing session with same ID (shouldn't happen but safety)
        attentivenessModule.clearSession(session_id);

        res.json({
            success: true,
            data: {
                session_id,
                class_id,
                subject_id,
                started_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error starting session:', error);
        res.status(500).json({
            success: false,
            message: 'Error starting monitoring session',
            error: error.message
        });
    }
};

/**
 * End a monitoring session
 * POST /api/teacher/attentiveness/session/end
 */
exports.endSession = async (req, res) => {
    try {
        const { session_id } = req.body;

        if (!session_id) {
            return res.status(400).json({
                success: false,
                message: 'session_id is required'
            });
        }

        const status = attentivenessModule.getSessionStatus(session_id);
        attentivenessModule.clearSession(session_id);

        res.json({
            success: true,
            message: 'Session ended successfully',
            data: {
                session_id,
                ended_at: new Date().toISOString(),
                final_status: status
            }
        });

    } catch (error) {
        console.error('Error ending session:', error);
        res.status(500).json({
            success: false,
            message: 'Error ending session',
            error: error.message
        });
    }
};

/**
 * Get session status
 * GET /api/teacher/attentiveness/session/:sessionId/status
 */
exports.getSessionStatus = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const status = attentivenessModule.getSessionStatus(sessionId);

        res.json({
            success: true,
            data: status
        });

    } catch (error) {
        console.error('Error getting session status:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting session status',
            error: error.message
        });
    }
};

/**
 * Get all face embeddings for client-side matching
 * GET /api/teacher/attentiveness/embeddings
 * 
 * Note: In production, you might want to limit this or use a different approach
 */
exports.getAllEmbeddings = async (req, res) => {
    try {
        const biometrics = await StudentBiometric.find({
            face_enrolled: true,
            face_embedding: { $exists: true, $ne: null }
        }).lean();

        const studentIds = biometrics.map(b => b.student_id);
        const students = await Student.find({ _id: { $in: studentIds } }).lean();

        const studentMap = {};
        students.forEach(s => {
            studentMap[s._id.toString()] = s;
        });

        const result = biometrics.map(b => ({
            student_id: b.student_id.toString(),
            full_name: studentMap[b.student_id.toString()]?.full_name || 'Unknown',
            roll_no: studentMap[b.student_id.toString()]?.roll_no || 'N/A',
            image_url: studentMap[b.student_id.toString()]?.image_url || null,
            embedding: b.face_embedding
        }));

        res.json({
            success: true,
            data: result,
            count: result.length
        });

    } catch (error) {
        console.error('Error fetching embeddings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching embeddings',
            error: error.message
        });
    }
};
