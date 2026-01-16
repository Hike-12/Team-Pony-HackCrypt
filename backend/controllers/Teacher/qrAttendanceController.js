const crypto = require('crypto');
const QRCode = require('qrcode');
const AttendanceSession = require('../../models/AttendanceSession');
const SessionQRToken = require('../../models/SessionQRToken');
const AttendanceRecord = require('../../models/AttendanceRecord');
const Student = require('../../models/Student');
const TimetableEntry = require('../../models/TimetableEntry');
const TimetableSlot = require('../../models/TimetableSlot');
const TeacherSubject = require('../../models/TeacherSubject');

// Store active QR sessions in memory
const activeQRSessions = new Map();

/**
 * Start QR attendance session
 * Creates an attendance session and starts generating rotating QR codes
 */
exports.startQRAttendance = async (req, res) => {
    try {
        const teacherId = req.user.teacher_id;

        if (!teacherId) {
            return res.status(401).json({ 
                success: false,
                message: 'Teacher not authenticated' 
            });
        }

        // Get current day and time
        const now = new Date();
        const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
        const currentTime = now.toTimeString().substring(0, 5);

        // Find current slot
        const currentSlot = await TimetableSlot.findOne({
            start_time: { $lte: currentTime },
            end_time: { $gte: currentTime }
        });

        if (!currentSlot) {
            return res.status(400).json({ 
                success: false,
                message: 'No active lecture slot at this time' 
            });
        }

        // Find teacher's subjects
        const teacherSubjects = await TeacherSubject.find({ 
            teacher_id: teacherId 
        }).populate('subject_id');

        if (!teacherSubjects.length) {
            return res.status(400).json({ 
                success: false,
                message: 'No subjects assigned to this teacher' 
            });
        }

        // Find timetable entry for current slot
        const timetableEntry = await TimetableEntry.findOne({
            day_of_week: dayOfWeek,
            slot_id: currentSlot._id,
            teacher_subject_id: { $in: teacherSubjects.map(ts => ts._id) },
            valid_from: { $lte: now },
            valid_to: { $gte: now }
        }).populate([
            { path: 'teacher_subject_id', populate: ['subject_id', 'teacher_id'] },
            { path: 'class_id' }
        ]);

        if (!timetableEntry) {
            return res.status(400).json({ 
                success: false,
                message: 'No scheduled lecture at this time' 
            });
        }

        // Check if session already exists for this teacher_subject and is active
        let attendanceSession = await AttendanceSession.findOne({
            teacher_subject_id: timetableEntry.teacher_subject_id._id,
            is_active: true,
            starts_at: { $lte: now },
            ends_at: { $gte: now }
        });

        // Create new session if doesn't exist
        if (!attendanceSession) {
            attendanceSession = await AttendanceSession.create({
                teacher_subject_id: timetableEntry.teacher_subject_id._id,
                session_type: timetableEntry.session_type || 'LECTURE',
                starts_at: new Date(`${now.toDateString()} ${currentSlot.start_time}`),
                ends_at: new Date(`${now.toDateString()} ${currentSlot.end_time}`),
                room_label: timetableEntry.room_label,
                is_active: true
            });
        }

        // Generate first QR token
        const token = crypto.randomBytes(32).toString('hex');
        const validFrom = new Date();
        const validUntil = new Date(validFrom.getTime() + 120000); // 2 minutes for testing

        const qrToken = await SessionQRToken.create({
            session_id: attendanceSession._id,
            token,
            valid_from: validFrom,
            valid_until: validUntil
        });

        // Generate QR code data URL
        const qrData = JSON.stringify({
            token,
            sessionId: attendanceSession._id.toString(),
            timestamp: validFrom.getTime()
        });

        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        // Store session info for tracking
        activeQRSessions.set(attendanceSession._id.toString(), {
            teacherId: teacherId.toString(),
            sessionId: attendanceSession._id.toString(),
            timetableEntry: timetableEntry,
            startedAt: now
        });

        res.status(200).json({
            success: true,
            message: 'QR attendance session started',
            data: {
                sessionId: attendanceSession._id,
                qrCode: qrCodeDataURL,
                token,
                validUntil: validUntil.getTime(),
                lecture: {
                    subject: timetableEntry.teacher_subject_id.subject_id.name,
                    class: timetableEntry.class_id.name,
                    session_type: timetableEntry.session_type,
                    room: timetableEntry.room_label,
                    slot: {
                        name: currentSlot.slot_name,
                        start_time: currentSlot.start_time,
                        end_time: currentSlot.end_time
                    }
                }
            }
        });

    } catch (error) {
        console.error("Start QR Attendance Error:", error);
        res.status(500).json({ 
            success: false,
            message: 'Server Error',
            error: error.message 
        });
    }
};

/**
 * Generate new QR token for active session
 * Called every 15 seconds to refresh the QR code
 */
exports.refreshQRToken = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const teacherId = req.user.teacher_id;

        // Verify session exists and is active
        const session = await AttendanceSession.findById(sessionId);
        
        if (!session || !session.is_active) {
            return res.status(404).json({ 
                success: false,
                message: 'Session not found or inactive' 
            });
        }

        // Verify this session belongs to the teacher
        const teacherSubject = await TeacherSubject.findOne({
            _id: session.teacher_subject_id,
            teacher_id: teacherId
        });

        if (!teacherSubject) {
            return res.status(403).json({ 
                success: false,
                message: 'Unauthorized access to this session' 
            });
        }

        // Generate new token
        const token = crypto.randomBytes(32).toString('hex');
        const validFrom = new Date();
        const validUntil = new Date(validFrom.getTime() + 120000); // 2 minutes for testing

        const qrToken = await SessionQRToken.create({
            session_id: session._id,
            token,
            valid_from: validFrom,
            valid_until: validUntil
        });

        // Generate QR code data URL
        const qrData = JSON.stringify({
            token,
            sessionId: session._id.toString(),
            timestamp: validFrom.getTime()
        });

        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        res.status(200).json({
            success: true,
            data: {
                qrCode: qrCodeDataURL,
                token,
                validUntil: validUntil.getTime()
            }
        });

    } catch (error) {
        console.error("Refresh QR Token Error:", error);
        res.status(500).json({ 
            success: false,
            message: 'Server Error',
            error: error.message 
        });
    }
};

/**
 * Stop QR attendance session
 */
exports.stopQRAttendance = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const teacherId = req.user.teacher_id;

        // Verify session exists
        const session = await AttendanceSession.findById(sessionId);
        
        if (!session) {
            return res.status(404).json({ 
                success: false,
                message: 'Session not found' 
            });
        }

        // Verify this session belongs to the teacher
        const teacherSubject = await TeacherSubject.findOne({
            _id: session.teacher_subject_id,
            teacher_id: teacherId
        });

        if (!teacherSubject) {
            return res.status(403).json({ 
                success: false,
                message: 'Unauthorized access to this session' 
            });
        }

        // Mark session as inactive
        session.is_active = false;
        await session.save();

        // Remove from active sessions
        activeQRSessions.delete(sessionId);

        res.status(200).json({
            success: true,
            message: 'QR attendance session stopped'
        });

    } catch (error) {
        console.error("Stop QR Attendance Error:", error);
        res.status(500).json({ 
            success: false,
            message: 'Server Error',
            error: error.message 
        });
    }
};

/**
 * Student scans QR code to mark attendance
 */
exports.scanQRAttendance = async (req, res) => {
    try {
        const { token, sessionId } = req.body;
        const userId = req.user.id; // Use the main user ID from JWT

        if (!token || !sessionId) {
            return res.status(400).json({ 
                success: false,
                message: 'Token and session ID are required' 
            });
        }

        // Find student by user_id
        const student = await Student.findOne({ user_id: userId }).populate('class_id');
        
        if (!student) {
            return res.status(404).json({ 
                success: false,
                message: 'Student not found' 
            });
        }

        // Verify QR token is valid and not expired
        const qrToken = await SessionQRToken.findOne({
            token,
            session_id: sessionId
        });

        if (!qrToken) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid QR code' 
            });
        }

        const now = new Date();
        if (now > qrToken.valid_until) {
            return res.status(400).json({ 
                success: false,
                message: 'QR code has expired' 
            });
        }

        // Verify session exists and is active
        const session = await AttendanceSession.findById(sessionId);
        
        if (!session || !session.is_active) {
            return res.status(400).json({ 
                success: false,
                message: 'Attendance session is not active' 
            });
        }

        // Check if student already marked attendance for this session
        const existingRecord = await AttendanceRecord.findOne({
            session_id: sessionId,
            student_id: student._id
        });

        if (existingRecord) {
            return res.status(400).json({ 
                success: false,
                message: 'Attendance already marked for this session' 
            });
        }

        // Get timetable entry for session details
        const teacherSubject = await TeacherSubject.findById(session.teacher_subject_id)
            .populate(['subject_id', 'teacher_id']);

        // Create attendance record
        const attendanceRecord = await AttendanceRecord.create({
            session_id: sessionId,
            student_id: student._id,
            marked_at: now,
            status: 'PRESENT',
            marked_by_teacher_id: teacherSubject.teacher_id._id,
            verification_method: 'QR_SCAN'
        });

        // Get IO instance and emit to teacher's room
        const io = req.app.get('io');
        console.log('IO instance:', io ? 'Found' : 'Not found');
        console.log('Emitting to room:', `session-${sessionId}`);
        console.log('Student data:', {
            name: student.full_name,
            roll_no: student.roll_no,
            class: student.class_id ? student.class_id.name : 'Unknown'
        });
        
        if (io) {
            io.to(`session-${sessionId}`).emit('studentAttendance', {
                student: {
                    id: student._id,
                    name: student.full_name,
                    roll_no: student.roll_no,
                    class: student.class_id ? student.class_id.name : 'Unknown'
                },
                timestamp: now,
                sessionId: sessionId
            });
            console.log('Socket event emitted successfully');
        } else {
            console.error('IO instance not found!');
        }

        res.status(200).json({
            success: true,
            message: 'Attendance marked successfully',
            data: {
                student: {
                    name: student.full_name,
                    roll_no: student.roll_no,
                    class: student.class_id ? student.class_id.name : 'Unknown'
                },
                subject: teacherSubject.subject_id.name,
                timestamp: now
            }
        });

    } catch (error) {
        console.error("Scan QR Attendance Error:", error);
        res.status(500).json({ 
            success: false,
            message: 'Server Error',
            error: error.message 
        });
    }
};

/**
 * Get attendance records for a session
 */
exports.getSessionAttendance = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const teacherId = req.user.teacher_id;

        // Verify session exists
        const session = await AttendanceSession.findById(sessionId);
        
        if (!session) {
            return res.status(404).json({ 
                success: false,
                message: 'Session not found' 
            });
        }

        // Verify this session belongs to the teacher
        const teacherSubject = await TeacherSubject.findOne({
            _id: session.teacher_subject_id,
            teacher_id: teacherId
        });

        if (!teacherSubject) {
            return res.status(403).json({ 
                success: false,
                message: 'Unauthorized access to this session' 
            });
        }

        // Get all attendance records for this session
        const records = await AttendanceRecord.find({ session_id: sessionId })
            .populate({
                path: 'student_id',
                populate: { path: 'class_id' }
            })
            .sort({ marked_at: -1 });

        res.status(200).json({
            success: true,
            data: {
                sessionId,
                totalPresent: records.length,
                records: records.map(r => ({
                    student: {
                        id: r.student_id._id,
                        name: r.student_id.full_name,
                        roll_no: r.student_id.roll_no,
                        class: r.student_id.class_id.name
                    },
                    markedAt: r.marked_at,
                    status: r.status,
                    verificationMethod: r.verification_method
                }))
            }
        });

    } catch (error) {
        console.error("Get Session Attendance Error:", error);
        res.status(500).json({ 
            success: false,
            message: 'Server Error',
            error: error.message 
        });
    }
};

module.exports.activeQRSessions = activeQRSessions;
