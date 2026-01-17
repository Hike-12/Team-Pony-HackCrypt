const Student = require('../../models/Student');
const TimetableEntry = require('../../models/TimetableEntry');
const TimetableSlot = require('../../models/TimetableSlot');
const TeacherSubject = require('../../models/TeacherSubject');
const Teacher = require('../../models/Teacher');
const AttendanceSession = require('../../models/AttendanceSession');
const AttendanceAttempt = require('../../models/AttendanceAttempt'); // Ensure this is imported

exports.getStudentAttemptsForSession = async (req, res) => {
    try {
        const { sessionId, studentId } = req.params;
        
        const attempts = await AttendanceAttempt.find({
            session_id: sessionId,
            student_id: studentId
        }).sort({ created_at: -1 });

        res.json({ success: true, attempts });
    } catch (error) {
        console.error("Get Student Attempts Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * Get active attendance sessions for teacher
 */
exports.getActiveSessions = async (req, res) => {
    try {
        const teacherId = req.user.teacher_id;

        if (!teacherId) {
            return res.status(401).json({ 
                success: false,
                message: 'Teacher not authenticated' 
            });
        }

        // Find teacher's subjects
        const teacherSubjects = await TeacherSubject.find({ 
            teacher_id: teacherId 
        });

        const subjectIds = teacherSubjects.map(ts => ts._id);

        // Find active sessions
        const sessions = await AttendanceSession.find({
            teacher_subject_id: { $in: subjectIds },
            is_active: true
        }).populate([
            { 
                path: 'teacher_subject_id', 
                populate: [
                    { path: 'subject_id' },
                    { path: 'class_id' }
                ] 
            }
        ]).sort({ starts_at: -1 });

        return res.status(200).json({ 
            success: true,
            sessions
        });

    } catch (error) {
        console.error("Get Active Sessions Error:", error);
        res.status(500).json({ 
            success: false,
            message: 'Server Error',
            error: error.message 
        });
    }
};

/**
 * Convert User ID to Student ID
 */
exports.getUserStudentId = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ 
                success: false,
                message: 'User ID is required' 
            });
        }

        // Find student by user_id
        const student = await Student.findOne({ user_id: userId });

        if (!student) {
            return res.status(404).json({ 
                success: false,
                message: 'Student not found for this user' 
            });
        }

        return res.status(200).json({ 
            success: true,
            data: {
                studentId: student._id,
                userId: userId
            }
        });

    } catch (error) {
        console.error("Get User Student ID Error:", error);
        res.status(500).json({ 
            success: false,
            message: 'Server Error',
            error: error.message 
        });
    }
};

/**
 * Verify if a student can be marked present based on:
 * 1. Student exists and belongs to a class
 * 2. There's an active timetable entry for that class at current time
 * 3. The timetable entry belongs to the logged-in teacher
 */
exports.verifyStudentAttendance = async (req, res) => {
    try {
        const { studentId } = req.body;
        const teacherId = req.user.teacher_id; // From JWT token

        if (!studentId) {
            return res.status(400).json({ 
                success: false,
                message: 'Student ID is required' 
            });
        }

        if (!teacherId) {
            return res.status(401).json({ 
                success: false,
                message: 'Teacher not authenticated' 
            });
        }

        // 1. Find the student and populate class details
        const student = await Student.findById(studentId).populate('class_id');
        
        if (!student) {
            return res.status(404).json({ 
                success: false,
                message: 'Student not found' 
            });
        }

        if (!student.class_id) {
            return res.status(400).json({ 
                success: false,
                message: 'Student is not assigned to any class' 
            });
        }

        // 2. Get current day and time
        const now = new Date();
        const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // Convert Sunday from 0 to 7
        const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
        
        console.log('DEBUG - Current time info:', {
            now: now.toISOString(),
            dayOfWeek,
            currentTime,
            dateInfo: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
        });

        // 3. Find all slots that match current time
        const allSlots = await TimetableSlot.find({});
        console.log('DEBUG - All available slots:', allSlots);
        
        const currentSlot = await TimetableSlot.findOne({
            start_time: { $lte: currentTime },
            end_time: { $gte: currentTime }
        });

        if (!currentSlot) {
            console.log(`DEBUG - No slot found for time ${currentTime}`);
            return res.status(400).json({ 
                success: false,
                message: `No active lecture slot at this time (${currentTime}). Available slots: ${allSlots.map(s => `${s.slot_name} (${s.start_time}-${s.end_time})`).join(', ')}` 
            });
        }

        console.log('DEBUG - Current slot found:', currentSlot);

        // 4. Find timetable entry for this class, day, and slot
        const allEntries = await TimetableEntry.find({ class_id: student.class_id._id });
        console.log('DEBUG - All entries for this class:', allEntries.map(e => ({ day_of_week: e.day_of_week, slot_id: e.slot_id, valid_from: e.valid_from, valid_to: e.valid_to })));

        const timetableEntry = await TimetableEntry.findOne({
            class_id: student.class_id._id,
            day_of_week: dayOfWeek,
            slot_id: currentSlot._id,
            valid_from: { $lte: now },
            valid_to: { $gte: now }
        }).populate({
            path: 'teacher_subject_id',
            populate: [
                { path: 'teacher_id' },
                { path: 'subject_id' }
            ]
        });

        if (!timetableEntry) {
            console.log(`DEBUG - No timetable entry found for day ${dayOfWeek}, slot ${currentSlot._id}, class ${student.class_id._id}`);
            return res.status(400).json({ 
                success: false,
                message: `No scheduled lecture for ${student.class_id.name} on this day (${dayOfWeek}) at this time (${currentTime}). Please create a timetable entry for day_of_week: ${dayOfWeek}, slot: ${currentSlot.slot_name}` 
            });
        }

        // 5. Verify that the timetable entry belongs to the current teacher
        if (timetableEntry.teacher_subject_id.teacher_id._id.toString() !== teacherId.toString()) {
            return res.status(403).json({ 
                success: false,
                message: 'This lecture is not assigned to you' 
            });
        }

        // 6. All validations passed - student can be marked present
        return res.status(200).json({ 
            success: true,
            message: `${student.full_name} is present`,
            data: {
                student: {
                    id: student._id,
                    name: student.full_name,
                    roll_no: student.roll_no,
                    class: student.class_id.name
                },
                lecture: {
                    subject: timetableEntry.teacher_subject_id.subject_id.name,
                    session_type: timetableEntry.session_type,
                    room: timetableEntry.room_label,
                    slot: {
                        name: currentSlot.slot_name,
                        start_time: currentSlot.start_time,
                        end_time: currentSlot.end_time
                    }
                },
                timestamp: now
            }
        });

    } catch (error) {
        console.error("Verify Student Attendance Error:", error);
        res.status(500).json({ 
            success: false,
            message: 'Server Error',
            error: error.message 
        });
    }
};

/**
 * Get current active lecture for the teacher
 */
exports.getCurrentLecture = async (req, res) => {
    try {
        const teacherId = req.user.teacher_id;

        if (!teacherId) {
            return res.status(401).json({ 
                success: false,
                message: 'Teacher not authenticated' 
            });
        }

        const now = new Date();
        const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
        const currentTime = now.toTimeString().substring(0, 5);

        // Find current slot
        const currentSlot = await TimetableSlot.findOne({
            start_time: { $lte: currentTime },
            end_time: { $gte: currentTime }
        });

        if (!currentSlot) {
            return res.status(200).json({ 
                success: true,
                message: 'No active lecture at this time',
                data: null
            });
        }

        // Find teacher subjects
        const teacherSubjects = await TeacherSubject.find({ teacher_id: teacherId });
        const teacherSubjectIds = teacherSubjects.map(ts => ts._id);

        // Find active timetable entry
        const timetableEntry = await TimetableEntry.findOne({
            teacher_subject_id: { $in: teacherSubjectIds },
            day_of_week: dayOfWeek,
            slot_id: currentSlot._id,
            valid_from: { $lte: now },
            valid_to: { $gte: now }
        }).populate([
            {
                path: 'teacher_subject_id',
                populate: { path: 'subject_id' }
            },
            { path: 'class_id' },
            { path: 'slot_id' }
        ]);

        if (!timetableEntry) {
            return res.status(200).json({ 
                success: true,
                message: 'No active lecture at this time',
                data: null
            });
        }

        return res.status(200).json({ 
            success: true,
            message: 'Active lecture found',
            data: {
                id: timetableEntry._id,
                subject: timetableEntry.teacher_subject_id.subject_id.name,
                class: timetableEntry.class_id.name,
                session_type: timetableEntry.session_type,
                room: timetableEntry.room_label,
                slot: {
                    name: timetableEntry.slot_id.slot_name,
                    start_time: timetableEntry.slot_id.start_time,
                    end_time: timetableEntry.slot_id.end_time
                }
            }
        });

    } catch (error) {
        console.error("Get Current Lecture Error:", error);
        res.status(500).json({ 
            success: false,
            message: 'Server Error',
            error: error.message 
        });
    }
};


/**
 * Start attendance session for current lecture
 */
exports.startAttendanceSession = async (req, res) => {
    try {
        const teacherId = req.user.teacher_id;
        const { enable_face, enable_biometric, enable_geofencing, enable_static_qr, enable_dynamic_qr } = req.body;

        if (!teacherId) {
            return res.status(401).json({ success: false, message: 'Teacher not authenticated' });
        }

        // Find current lecture (reuse getCurrentLecture logic)
        const now = new Date();
        const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
        const currentTime = now.toTimeString().substring(0, 5);

        const currentSlot = await TimetableSlot.findOne({
            start_time: { $lte: currentTime },
            end_time: { $gte: currentTime }
        });

        if (!currentSlot) {
            return res.status(400).json({ success: false, message: 'No active lecture slot at this time' });
        }

        const teacherSubjects = await TeacherSubject.find({ teacher_id: teacherId });
        const teacherSubjectIds = teacherSubjects.map(ts => ts._id);

        const timetableEntry = await TimetableEntry.findOne({
            teacher_subject_id: { $in: teacherSubjectIds },
            day_of_week: dayOfWeek,
            slot_id: currentSlot._id,
            valid_from: { $lte: now },
            valid_to: { $gte: now }
        });

        if (!timetableEntry) {
            return res.status(400).json({ success: false, message: 'No scheduled lecture at this time' });
        }

        // Check if session already exists and is active
        let session = await AttendanceSession.findOne({
            teacher_subject_id: timetableEntry.teacher_subject_id,
            is_active: true,
            starts_at: { $lte: now },
            ends_at: { $gte: now }
        });

        if (!session) {
            session = await AttendanceSession.create({
                teacher_subject_id: timetableEntry.teacher_subject_id,
                session_type: timetableEntry.session_type,
                starts_at: new Date(`${now.toDateString()} ${currentSlot.start_time}`),
                ends_at: new Date(`${now.toDateString()} ${currentSlot.end_time}`),
                room_label: timetableEntry.room_label,
                is_active: true,
                enable_face: !!enable_face,
                enable_biometric: !!enable_biometric,
                enable_geofencing: !!enable_geofencing,
                enable_static_qr: !!enable_static_qr,
                enable_dynamic_qr: !!enable_dynamic_qr
            });
        } else {
            // Optionally update toggles if session exists
            session.enable_face = !!enable_face;
            session.enable_biometric = !!enable_biometric;
            session.enable_geofencing = !!enable_geofencing;
            session.enable_static_qr = !!enable_static_qr;
            session.enable_dynamic_qr = !!enable_dynamic_qr;
            await session.save();
        }

        res.status(200).json({
            success: true,
            message: 'Attendance session started',
            data: session
        });

    } catch (error) {
        console.error("Start Attendance Session Error:", error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.getTodaysLectures = async (req, res) => {
  try {
    const teacherId = req.user.teacher_id;
    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();

    const teacherSubjects = await TeacherSubject.find({ teacher_id: teacherId });
    const teacherSubjectIds = teacherSubjects.map(ts => ts._id);

    const entries = await TimetableEntry.find({
      teacher_subject_id: { $in: teacherSubjectIds },
      day_of_week: dayOfWeek,
      valid_from: { $lte: now },
      valid_to: { $gte: now }
    }).populate([
      { path: 'teacher_subject_id', populate: { path: 'subject_id' } },
      { path: 'class_id' },
      { path: 'slot_id' }
    ]);

    res.json({ success: true, lectures: entries });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Teacher scans student ID QR code to mark attendance
 */
exports.scanStudentQR = async (req, res) => {
  try {
    const { user_id } = req.body;
    const teacherId = req.user.teacher_id;

    if (!teacherId) {
      return res.status(401).json({ success: false, message: 'Teacher not authenticated' });
    }

    if (!user_id) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    // Find student by user_id
    const Student = require('../../models/Student');
    const AttendanceRecord = require('../../models/AttendanceRecord');
    
    const student = await Student.findOne({ user_id }).populate('class_id');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Find active session for teacher
    const now = new Date();
    const teacherSubjects = await TeacherSubject.find({ teacher_id: teacherId });
    const teacherSubjectIds = teacherSubjects.map(ts => ts._id);

    const session = await AttendanceSession.findOne({
      teacher_subject_id: { $in: teacherSubjectIds },
      is_active: true,
      starts_at: { $lte: now },
      ends_at: { $gte: now }
    });

    if (!session) {
      return res.status(400).json({ success: false, message: 'No active attendance session found' });
    }

    // Check if already marked
    const existingRecord = await AttendanceRecord.findOne({
      session_id: session._id,
      student_id: student._id
    });

    if (existingRecord) {
      return res.status(200).json({ 
        success: true, 
        message: 'Attendance already marked for this session',
        alreadyMarked: true
      });
    }

    // Create attendance record
    await AttendanceRecord.create({
      session_id: session._id,
      student_id: student._id,
      status: 'PRESENT',
      marked_at: now,
      marked_by_teacher_id: teacherId,
      verification_method: 'STUDENT_ID_QR'
    });

    // Emit socket event to teacher
    const io = req.app.get('io');
    if (io) {
      io.to(`session-${session._id}`).emit('studentAttendance', {
        student: {
          id: student._id,
          name: student.full_name,
          roll_no: student.roll_no,
          class: student.class_id ? student.class_id.name : 'Unknown'
        },
        timestamp: now,
        sessionId: session._id.toString()
      });
    }

    res.json({ 
      success: true, 
      message: 'Attendance marked successfully',
      data: {
        student: student.full_name,
        roll_no: student.roll_no,
        session: session._id
      }
    });

  } catch (error) {
    console.error('Scan student QR error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};