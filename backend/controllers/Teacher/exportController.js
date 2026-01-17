const AttendanceRecord = require('../../models/AttendanceRecord');
const AttendanceSession = require('../../models/AttendanceSession');
const Student = require('../../models/Student');
const TeacherSubject = require('../../models/TeacherSubject');

// Export students with low attendance to CSV
exports.exportLowAttendanceStudents = async (req, res) => {
    try {
        const { threshold = 75, teacher_id } = req.query; // Default threshold 75%
        const teacherId = req.user?.teacher_id || teacher_id; // From auth middleware or query

        console.log('📊 Export Request:', { threshold, teacher_id, teacherId });

        if (!teacherId) {
            return res.status(401).json({
                success: false,
                message: 'Teacher ID not found. Please provide teacher_id in query params.'
            });
        }

        // Get all teacher subjects
        const teacherSubjects = await TeacherSubject.find({ teacher_id: teacherId })
            .populate('subject_id', 'name')
            .populate('class_id', 'name');

        console.log('📚 Teacher Subjects:', teacherSubjects.length);

        if (teacherSubjects.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No subjects assigned to this teacher'
            });
        }

        const teacherSubjectIds = teacherSubjects.map(ts => ts._id);

        // Get all sessions for these subjects
        const sessions = await AttendanceSession.find({
            teacher_subject_id: { $in: teacherSubjectIds }
        });

        console.log('🎓 Sessions found:', sessions.length);

        const sessionIds = sessions.map(s => s._id);

        // Get all attendance records for these sessions
        const attendanceRecords = await AttendanceRecord.find({
            session_id: { $in: sessionIds }
        });

        console.log('📝 Attendance Records:', attendanceRecords.length);

        // Calculate attendance percentage for each student
        const studentAttendanceMap = {};

        attendanceRecords.forEach(record => {
            const studentId = record.student_id.toString();
            if (!studentAttendanceMap[studentId]) {
                studentAttendanceMap[studentId] = {
                    total: 0,
                    present: 0
                };
            }
            studentAttendanceMap[studentId].total++;
            if (['PRESENT', 'EXCUSED'].includes(record.status)) {
                studentAttendanceMap[studentId].present++;
            }
        });

        console.log('👥 Unique Students:', Object.keys(studentAttendanceMap).length);

        // Debug: Show all student percentages
        Object.keys(studentAttendanceMap).forEach(studentId => {
            const stats = studentAttendanceMap[studentId];
            const percentage = (stats.present / stats.total) * 100;
            console.log(`  Student ${studentId}: ${percentage.toFixed(2)}% (${stats.present}/${stats.total})`);
        });

        // Filter students below threshold
        const lowAttendanceStudentIds = Object.keys(studentAttendanceMap)
            .filter(studentId => {
                const stats = studentAttendanceMap[studentId];
                const percentage = (stats.present / stats.total) * 100;
                return percentage < parseFloat(threshold);
            });

        console.log('⚠️ Low Attendance Students (below', threshold, '%):', lowAttendanceStudentIds.length);

        if (lowAttendanceStudentIds.length === 0) {
            // Return CSV with message in first row
            const emptyCSV = 'Roll Number,Full Name,Email,Phone,Class,Total Sessions,Attended,Attendance %,Status\n' +
                            'No students found below ' + threshold + '% attendance threshold,,,,,,,,\n';
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=low-attendance-students-${Date.now()}.csv`);
            return res.status(200).send(emptyCSV);
        }

        console.log('🔍 Fetching student details for:', lowAttendanceStudentIds);

        // Get student details with user info
        const students = await Student.find({
            _id: { $in: lowAttendanceStudentIds }
        })
        .populate('class_id', 'name')
        .populate('user_id', 'email');

        console.log('✅ Students fetched:', students.length);
        if (students.length > 0) {
            students.forEach((student, idx) => {
                console.log(`  Student ${idx + 1}:`, {
                    id: student._id,
                    roll_no: student.roll_no,
                    full_name: student.full_name,
                    email: student.user_id?.email,
                    phone: student.phone
                });
            });
        }

        if (students.length === 0) {
            // Return CSV with message
            const emptyCSV = 'Roll Number,Full Name,Email,Phone,Class,Total Sessions,Attended,Attendance %,Status\n' +
                            'Error: Student data not found in database,,,,,,,,\n';
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=low-attendance-students-${Date.now()}.csv`);
            return res.status(200).send(emptyCSV);
        }

        // Prepare CSV data
        const csvData = students.map(student => {
            const studentId = student._id.toString();
            const stats = studentAttendanceMap[studentId];
            
            if (!stats) {
                console.log('⚠️ No stats found for student:', studentId);
                return null;
            }
            
            const percentage = ((stats.present / stats.total) * 100).toFixed(2);

            return {
                'Roll Number': student.roll_no || 'N/A',
                'Full Name': student.full_name || 'N/A',
                'Email': student.user_id?.email || 'N/A',
                'Phone': student.phone || 'N/A',
                'Class': student.class_id?.name || 'N/A',
                'Total Sessions': stats.total,
                'Attended': stats.present,
                'Attendance %': percentage,
                'Status': percentage < 75 ? 'Critical' : percentage < 80 ? 'Warning' : 'Normal'
            };
        }).filter(row => row !== null); // Remove null entries

        console.log('📊 CSV Data prepared:', csvData.length, 'rows');

        // Sort by attendance percentage (lowest first)
        csvData.sort((a, b) => parseFloat(a['Attendance %']) - parseFloat(b['Attendance %']));

        // Convert to CSV string
        if (csvData.length === 0) {
            // Return empty CSV with headers only
            const emptyCSV = 'Roll Number,Full Name,Email,Phone,Class,Total Sessions,Attended,Attendance %,Status\n';
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=low-attendance-students-${Date.now()}.csv`);
            return res.status(200).send(emptyCSV);
        }

        const headers = Object.keys(csvData[0]).join(',');
        const rows = csvData.map(row => 
            Object.values(row).map(val => 
                typeof val === 'string' && val.includes(',') ? `"${val}"` : val
            ).join(',')
        );
        const csvString = [headers, ...rows].join('\n');

        console.log('✅ CSV Generated with', csvData.length, 'rows');

        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=low-attendance-students-${Date.now()}.csv`);
        
        res.status(200).send(csvString);

    } catch (error) {
        console.error('Error exporting low attendance students:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export data',
            error: error.message
        });
    }
};

// Get low attendance statistics (for displaying before export)
exports.getLowAttendanceStats = async (req, res) => {
    try {
        const { threshold = 75, teacher_id } = req.query;
        const teacherId = req.user?.teacher_id || teacher_id;

        if (!teacherId) {
            return res.status(401).json({
                success: false,
                message: 'Teacher ID not found. Please provide teacher_id in query params.'
            });
        }

        const teacherSubjects = await TeacherSubject.find({ teacher_id: teacherId });
        const teacherSubjectIds = teacherSubjects.map(ts => ts._id);

        const sessions = await AttendanceSession.find({
            teacher_subject_id: { $in: teacherSubjectIds }
        });

        const sessionIds = sessions.map(s => s._id);

        const attendanceRecords = await AttendanceRecord.find({
            session_id: { $in: sessionIds }
        });

        const studentAttendanceMap = {};

        attendanceRecords.forEach(record => {
            const studentId = record.student_id.toString();
            if (!studentAttendanceMap[studentId]) {
                studentAttendanceMap[studentId] = { total: 0, present: 0 };
            }
            studentAttendanceMap[studentId].total++;
            if (['PRESENT', 'EXCUSED'].includes(record.status)) {
                studentAttendanceMap[studentId].present++;
            }
        });

        const lowAttendanceCount = Object.keys(studentAttendanceMap)
            .filter(studentId => {
                const stats = studentAttendanceMap[studentId];
                const percentage = (stats.present / stats.total) * 100;
                return percentage < parseFloat(threshold);
            }).length;

        res.status(200).json({
            success: true,
            data: {
                total_students: Object.keys(studentAttendanceMap).length,
                low_attendance_count: lowAttendanceCount,
                threshold: parseFloat(threshold)
            }
        });

    } catch (error) {
        console.error('Error fetching low attendance stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics',
            error: error.message
        });
    }
};
