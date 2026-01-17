const AttendanceRecord = require('../../models/AttendanceRecord');
const AttendanceSession = require('../../models/AttendanceSession');
const TeacherSubject = require('../../models/TeacherSubject');
const TimetableEntry = require('../../models/TimetableEntry');
const Student = require('../../models/Student');

/**
 * Get comprehensive attendance analytics for a student
 */
exports.getStudentAttendanceAnalytics = async (req, res) => {
    try {
        const studentId = req.params.studentId || req.user.student_id;

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: 'Student ID is required'
            });
        }

        // Get student with class info
        const student = await Student.findById(studentId).populate('class_id');
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Get all attendance records for this student
        const attendanceRecords = await AttendanceRecord.find({
            student_id: studentId
        }).populate({
            path: 'session_id',
            populate: {
                path: 'teacher_subject_id',
                populate: ['subject_id', 'class_id']
            }
        }).sort({ marked_at: -1 });

        // Calculate overall attendance stats
        const totalRecords = attendanceRecords.length;
        const presentRecords = attendanceRecords.filter(r => r.status === 'PRESENT').length;
        const overallAttendanceRate = totalRecords > 0 ? ((presentRecords / totalRecords) * 100).toFixed(1) : 0;

        // Group by subject
        const subjectStats = {};
        const subjectTimeline = {};

        attendanceRecords.forEach(record => {
            if (!record.session_id || !record.session_id.teacher_subject_id) return;

            const subject = record.session_id.teacher_subject_id.subject_id;
            if (!subject) return;

            const subjectId = subject._id.toString();
            const subjectName = subject.name;
            const subjectCode = subject.code;

            if (!subjectStats[subjectId]) {
                subjectStats[subjectId] = {
                    subjectId,
                    subjectName,
                    subjectCode,
                    total: 0,
                    present: 0,
                    absent: 0,
                    rate: 0
                };
                subjectTimeline[subjectId] = [];
            }

            subjectStats[subjectId].total++;
            if (record.status === 'PRESENT') {
                subjectStats[subjectId].present++;
            } else {
                subjectStats[subjectId].absent++;
            }

            // Add to timeline
            subjectTimeline[subjectId].push({
                date: record.marked_at,
                status: record.status,
                rate: ((subjectStats[subjectId].present / subjectStats[subjectId].total) * 100).toFixed(1)
            });
        });

        // Calculate rates and projections
        Object.keys(subjectStats).forEach(subjectId => {
            const stats = subjectStats[subjectId];
            stats.rate = stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0;

            // Calculate projection for 75% threshold until April 30, 2026
            const semesterEndDate = new Date('2026-04-30');
            const today = new Date();
            const daysRemaining = Math.max(0, Math.ceil((semesterEndDate - today) / (1000 * 60 * 60 * 24)));
            
            // Estimate remaining lectures (assuming roughly 0.5 lectures per day as average)
            const estimatedRemainingLectures = Math.ceil(daysRemaining * 0.5);
            const totalProjectedLectures = stats.total + estimatedRemainingLectures;
            
            // Calculate how many more lectures needed to maintain 75%
            const requiredPresent = Math.ceil(totalProjectedLectures * 0.75);
            const canMiss = Math.max(0, stats.present - (requiredPresent - estimatedRemainingLectures));
            const needToAttend = Math.max(0, requiredPresent - stats.present);

            stats.projection = {
                semesterEndDate: semesterEndDate.toISOString().split('T')[0],
                daysRemaining,
                estimatedRemainingLectures,
                totalProjectedLectures,
                requiredForMinimum: requiredPresent,
                canAffordToMiss: canMiss,
                mustAttend: Math.min(needToAttend, estimatedRemainingLectures),
                currentlyAbove75: parseFloat(stats.rate) >= 75,
                status: parseFloat(stats.rate) >= 75 ? 'safe' : 'critical'
            };
        });

        // Get timeline data for charts (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentRecords = attendanceRecords.filter(r => 
            r.marked_at >= thirtyDaysAgo
        );

        // Group by date for overall timeline
        const dailyStats = {};
        recentRecords.forEach(record => {
            const date = record.marked_at.toISOString().split('T')[0];
            if (!dailyStats[date]) {
                dailyStats[date] = { date, total: 0, present: 0 };
            }
            dailyStats[date].total++;
            if (record.status === 'PRESENT') {
                dailyStats[date].present++;
            }
        });

        const timelineData = Object.values(dailyStats).map(day => ({
            date: day.date,
            rate: day.total > 0 ? ((day.present / day.total) * 100).toFixed(1) : 0,
            present: day.present,
            total: day.total
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        // Count classes today
        const today = new Date();
        const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
        
        const todaysClasses = await TimetableEntry.countDocuments({
            class_id: student.class_id._id,
            day_of_week: dayOfWeek,
            valid_from: { $lte: today },
            valid_to: { $gte: today }
        });

        return res.status(200).json({
            success: true,
            data: {
                overview: {
                    studentName: student.full_name,
                    rollNo: student.roll_no,
                    className: student.class_id ? student.class_id.name : 'N/A',
                    overallAttendanceRate: parseFloat(overallAttendanceRate),
                    totalLectures: totalRecords,
                    lecturesAttended: presentRecords,
                    lecturesMissed: totalRecords - presentRecords,
                    classesToday: todaysClasses,
                    performanceScore: overallAttendanceRate >= 90 ? 'A+' : 
                                     overallAttendanceRate >= 80 ? 'A' :
                                     overallAttendanceRate >= 70 ? 'B+' :
                                     overallAttendanceRate >= 60 ? 'B' : 'C'
                },
                subjectWiseAnalytics: Object.values(subjectStats).sort((a, b) => 
                    parseFloat(b.rate) - parseFloat(a.rate)
                ),
                timelineData,
                subjectTimelines: subjectTimeline
            }
        });

    } catch (error) {
        console.error('Get Attendance Analytics Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

/**
 * Get subject-wise detailed statistics
 */
exports.getSubjectWiseStats = async (req, res) => {
    try {
        const studentId = req.params.studentId || req.user.student_id;
        const { subjectId } = req.query;

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: 'Student ID is required'
            });
        }

        let query = { student_id: studentId };
        
        // Get all sessions first
        const sessions = await AttendanceSession.find({
            teacher_subject_id: { $exists: true }
        }).populate({
            path: 'teacher_subject_id',
            populate: 'subject_id'
        });

        if (subjectId) {
            const relevantSessions = sessions.filter(s => 
                s.teacher_subject_id && 
                s.teacher_subject_id.subject_id && 
                s.teacher_subject_id.subject_id._id.toString() === subjectId
            );
            query.session_id = { $in: relevantSessions.map(s => s._id) };
        }

        const records = await AttendanceRecord.find(query)
            .populate({
                path: 'session_id',
                populate: {
                    path: 'teacher_subject_id',
                    populate: 'subject_id'
                }
            })
            .sort({ marked_at: -1 });

        return res.status(200).json({
            success: true,
            data: records
        });

    } catch (error) {
        console.error('Get Subject Stats Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};
