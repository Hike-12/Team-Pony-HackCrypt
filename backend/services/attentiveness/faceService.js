/**
 * Face Detection & Recognition Service
 * 
 * Handles face detection and embedding comparison for student identification.
 * Uses stored face embeddings from MongoDB (StudentBiometric schema).
 */

const StudentBiometric = require('../../models/StudentBiometric');
const Student = require('../../models/Student');

/**
 * Calculate Euclidean distance between two embedding vectors
 * @param {Array} embedding1 - First embedding vector
 * @param {Array} embedding2 - Second embedding vector
 * @returns {number} - Euclidean distance
 */
function euclideanDistance(embedding1, embedding2) {
    if (!embedding1 || !embedding2) return Infinity;
    
    // Handle different embedding formats (array or object with descriptor)
    const vec1 = Array.isArray(embedding1) ? embedding1 : embedding1.descriptor || [];
    const vec2 = Array.isArray(embedding2) ? embedding2 : embedding2.descriptor || [];
    
    if (vec1.length !== vec2.length || vec1.length === 0) return Infinity;
    
    let sum = 0;
    for (let i = 0; i < vec1.length; i++) {
        sum += Math.pow(vec1[i] - vec2[i], 2);
    }
    return Math.sqrt(sum);
}

/**
 * Get all enrolled student embeddings from the database
 * @returns {Promise<Array>} - Array of { student_id, full_name, embedding, image_url }
 */
async function getAllEnrolledStudents() {
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

        return biometrics.map(b => ({
            student_id: b.student_id.toString(),
            full_name: studentMap[b.student_id.toString()]?.full_name || 'Unknown',
            roll_no: studentMap[b.student_id.toString()]?.roll_no || 'N/A',
            image_url: studentMap[b.student_id.toString()]?.image_url || null,
            embedding: b.face_embedding
        }));
    } catch (error) {
        console.error('Error fetching enrolled students:', error);
        return [];
    }
}

/**
 * Match a detected face embedding against all enrolled students
 * @param {Array} detectedEmbedding - The embedding from detected face
 * @param {Array} enrolledStudents - Array of enrolled student data with embeddings
 * @param {number} threshold - Distance threshold for matching (default: 0.6)
 * @returns {Object|null} - Matched student info or null
 */
function matchFaceToStudent(detectedEmbedding, enrolledStudents, threshold = 0.6) {
    let bestMatch = null;
    let bestDistance = Infinity;

    for (const student of enrolledStudents) {
        const distance = euclideanDistance(detectedEmbedding, student.embedding);
        
        if (distance < bestDistance && distance < threshold) {
            bestDistance = distance;
            bestMatch = {
                student_id: student.student_id,
                full_name: student.full_name,
                roll_no: student.roll_no,
                image_url: student.image_url,
                confidence: Math.max(0, 1 - distance) * 100
            };
        }
    }

    return bestMatch;
}

/**
 * Process multiple detected faces and identify students
 * @param {Array} detectedFaces - Array of { embedding, boundingBox }
 * @returns {Promise<Array>} - Array of identified students with bounding boxes
 */
async function identifyMultipleFaces(detectedFaces) {
    const enrolledStudents = await getAllEnrolledStudents();
    const identifiedStudents = [];

    for (const face of detectedFaces) {
        const match = matchFaceToStudent(face.embedding, enrolledStudents);
        
        identifiedStudents.push({
            boundingBox: face.boundingBox,
            faceDetected: true,
            identified: match !== null,
            student: match,
            unknownPerson: match === null
        });
    }

    return identifiedStudents;
}

/**
 * Calculate bounding box center point
 * @param {Object} box - { x, y, width, height }
 * @returns {Object} - { x, y } center point
 */
function getBoundingBoxCenter(box) {
    return {
        x: box.x + box.width / 2,
        y: box.y + box.height / 2
    };
}

module.exports = {
    euclideanDistance,
    getAllEnrolledStudents,
    matchFaceToStudent,
    identifyMultipleFaces,
    getBoundingBoxCenter
};
