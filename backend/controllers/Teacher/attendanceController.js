const Student = require('../../models/Student');
const TimetableEntry = require('../../models/TimetableEntry');
const TimetableSlot = require('../../models/TimetableSlot');
const TeacherSubject = require('../../models/TeacherSubject');
const Teacher = require('../../models/Teacher');

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
