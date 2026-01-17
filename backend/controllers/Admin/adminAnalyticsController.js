const AttendanceRecord = require('../../models/AttendanceRecord');
const AttendanceSession = require('../../models/AttendanceSession');
const TeacherSubject = require('../../models/TeacherSubject');
const Student = require('../../models/Student');
const Class = require('../../models/Class');
const Teacher = require('../../models/Teacher');

/**
 * Get comprehensive analytics overview for admin
 */
exports.getAnalyticsOverview = async (req, res) => {
  try {
    // Get all students with their classes
    const students = await Student.find().populate('class_id');
    const teachers = await Teacher.find();
    const classes = await Class.find();

    // Get all attendance records
    const attendanceRecords = await AttendanceRecord.find()
      .populate({
        path: 'session_id',
        populate: {
          path: 'teacher_subject_id',
          populate: ['teacher_id', 'subject_id', 'class_id']
        }
      })
      .populate({
        path: 'student_id',
        populate: 'class_id'
      });

    // Calculate attendance by department (class)
    const departmentStats = {};
    const teacherByDepartment = [];
    const studentAttendance = {};

    // Initialize student attendance
    students.forEach(student => {
      const studentId = student._id.toString();
      studentAttendance[studentId] = {
        name: student.full_name,
        className: student.class_id?.name || 'Unknown',
        total: 0,
        present: 0,
        attendance: 0
      };
    });

    // Process attendance records
    attendanceRecords.forEach(record => {
      if (!record.student_id || !record.session_id?.teacher_subject_id) return;

      const studentId = record.student_id._id.toString();
      const classInfo = record.student_id.class_id;
      const className = classInfo?.name || 'Unknown';
      const classId = classInfo?._id.toString() || 'unknown';
      const teacherSubject = record.session_id.teacher_subject_id;
      const teacher = teacherSubject?.teacher_id;
      const teacherName = teacher?.full_name || 'Unknown';

      // Initialize department stats
      if (!departmentStats[classId]) {
        departmentStats[classId] = {
          classId,
          className,
          total: 0,
          present: 0,
          teachers: new Set(),
          students: new Set(),
          attendance: 0
        };
      }

      // Update department stats
      departmentStats[classId].total++;
      if (record.status === 'PRESENT') {
        departmentStats[classId].present++;
      }
      departmentStats[classId].teachers.add(teacherName);
      departmentStats[classId].students.add(studentId);

      // Update student attendance
      if (studentAttendance[studentId]) {
        studentAttendance[studentId].total++;
        if (record.status === 'PRESENT') {
          studentAttendance[studentId].present++;
        }
      }

      // Track teacher performance
      if (teacher) {
        teacherByDepartment.push({
          classId,
          className,
          teacherId: teacher._id.toString(),
          teacherName,
          studentCount: 1, // Will aggregate later
          attendance: record.status === 'PRESENT' ? 1 : 0,
          total: 1
        });
      }
    });

    // Calculate attendance percentages
    Object.keys(departmentStats).forEach(classId => {
      const stats = departmentStats[classId];
      stats.attendance = stats.total > 0 ? (stats.present / stats.total) * 100 : 0;
      stats.teacherCount = stats.teachers.size;
      stats.totalStudents = stats.students.size;
    });

    // Calculate student attendance percentages
    Object.keys(studentAttendance).forEach(studentId => {
      const stats = studentAttendance[studentId];
      stats.attendance = stats.total > 0 ? (stats.present / stats.total) * 100 : 0;
    });

    // Aggregate teacher performance
    const teacherAggregated = {};
    teacherByDepartment.forEach(item => {
      const key = `${item.classId}-${item.teacherId}`;
      if (!teacherAggregated[key]) {
        teacherAggregated[key] = {
          classId: item.classId,
          className: item.className,
          teacherId: item.teacherId,
          teacherName: item.teacherName,
          total: 0,
          present: 0,
          studentCount: new Set()
        };
      }
      teacherAggregated[key].total++;
      teacherAggregated[key].present += item.attendance;
      teacherAggregated[key].studentCount.add(item.studentId);
    });

    // Convert aggregated teacher data
    const finalTeacherByDepartment = Object.values(teacherAggregated).map(item => ({
      ...item,
      studentCount: item.studentCount.size,
      attendanceRate: item.total > 0 ? (item.present / item.total) * 100 : 0,
      studentCount: item.studentCount.size
    }));

    // Sort and get top/bottom departments
    const sortedDepartments = Object.values(departmentStats).sort(
      (a, b) => b.attendance - a.attendance
    );
    const bestDepartments = sortedDepartments.slice(0, 3).map(dept => ({
      classId: dept.classId,
      className: dept.className,
      attendanceRate: dept.attendance,
      teacherCount: dept.teacherCount,
      totalStudents: dept.totalStudents
    }));
    const worstDepartments = sortedDepartments.slice(-3).reverse().map(dept => ({
      classId: dept.classId,
      className: dept.className,
      attendanceRate: dept.attendance,
      teacherCount: dept.teacherCount,
      totalStudents: dept.totalStudents
    }));

    // Create department attendance chart data
    const departmentAttendance = sortedDepartments.map(dept => ({
      name: dept.className,
      rate: parseFloat(dept.attendance.toFixed(1)),
      students: dept.totalStudents,
      classId: dept.classId
    }));

    // Identify high and low performers
    const highPerformers = Object.values(studentAttendance).filter(s => s.attendance >= 90);
    const lowPerformers = Object.values(studentAttendance).filter(s => s.attendance < 20);

    const studentDistribution = [
      { name: 'High Performers (90%+)', value: highPerformers.length },
      { name: 'Average (60-89%)', value: Object.values(studentAttendance).filter(s => s.attendance >= 60 && s.attendance < 90).length },
      { name: 'Low Performers (<60%)', value: Object.values(studentAttendance).filter(s => s.attendance < 60).length }
    ];

    // Generate trend data (last 30 days, grouped by date)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const trendMap = {};
    attendanceRecords.forEach(record => {
      if (!record.marked_at || record.marked_at < thirtyDaysAgo) return;

      const dateStr = new Date(record.marked_at).toISOString().split('T')[0];
      if (!trendMap[dateStr]) {
        trendMap[dateStr] = { date: dateStr, total: 0, present: 0 };
      }

      trendMap[dateStr].total++;
      if (record.status === 'PRESENT') {
        trendMap[dateStr].present++;
      }
    });

    const trendData = Object.values(trendMap)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(item => ({
        ...item,
        overall: parseFloat(((item.present / item.total) * 100).toFixed(1))
      }));

    // Weekly summary
    const weeklySummary = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(today.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(today.getTime() - i * 7 * 24 * 60 * 60 * 1000);

      let weekTotal = 0;
      let weekPresent = 0;

      attendanceRecords.forEach(record => {
        const recordDate = new Date(record.marked_at);
        if (recordDate >= weekStart && recordDate <= weekEnd) {
          weekTotal++;
          if (record.status === 'PRESENT') {
            weekPresent++;
          }
        }
      });

      weeklySummary.push({
        week: `Week ${i + 1}`,
        total: weekTotal,
        present: weekPresent,
        rate: weekTotal > 0 ? (weekPresent / weekTotal) * 100 : 0
      });
    }

    // Verification methods analysis
    const verificationStats = {
      geofencing: { count: 0, success: 0 },
      face: { count: 0, success: 0 },
      biometric: { count: 0, success: 0 },
      qr: { count: 0, success: 0 }
    };

    const verificationByDept = {};

    attendanceRecords.forEach(record => {
      if (!record.session_id) return;

      const session = record.session_id;
      const classId = session.teacher_subject_id?.class_id?._id?.toString();
      const className = session.teacher_subject_id?.class_id?.name || 'Unknown';

      if (!verificationByDept[classId]) {
        verificationByDept[classId] = {
          classId,
          name: className,
          geofencing: 0,
          face: 0,
          biometric: 0,
          qr: 0,
          geoTotal: 0,
          faceTotal: 0,
          bioTotal: 0,
          qrTotal: 0
        };
      }

      // Count verification methods based on session verification flags
      if (session.geofencing_verified) {
        verificationStats.geofencing.count++;
        verificationByDept[classId].geoTotal++;
        if (record.status === 'PRESENT') {
          verificationStats.geofencing.success++;
          verificationByDept[classId].geofencing++;
        }
      }
      if (session.face_verified) {
        verificationStats.face.count++;
        verificationByDept[classId].faceTotal++;
        if (record.status === 'PRESENT') {
          verificationStats.face.success++;
          verificationByDept[classId].face++;
        }
      }
      if (session.biometric_verified) {
        verificationStats.biometric.count++;
        verificationByDept[classId].bioTotal++;
        if (record.status === 'PRESENT') {
          verificationStats.biometric.success++;
          verificationByDept[classId].biometric++;
        }
      }
      if (session.qr_verified) {
        verificationStats.qr.count++;
        verificationByDept[classId].qrTotal++;
        if (record.status === 'PRESENT') {
          verificationStats.qr.success++;
          verificationByDept[classId].qr++;
        }
      }
    });

    const verificationMethods = [
      {
        name: 'Geofencing',
        count: verificationStats.geofencing.count,
        failed: verificationStats.geofencing.count - verificationStats.geofencing.success,
        successRate: verificationStats.geofencing.count > 0
          ? (verificationStats.geofencing.success / verificationStats.geofencing.count) * 100
          : 0
      },
      {
        name: 'Face Recognition',
        count: verificationStats.face.count,
        failed: verificationStats.face.count - verificationStats.face.success,
        successRate: verificationStats.face.count > 0
          ? (verificationStats.face.success / verificationStats.face.count) * 100
          : 0
      },
      {
        name: 'Biometric',
        count: verificationStats.biometric.count,
        failed: verificationStats.biometric.count - verificationStats.biometric.success,
        successRate: verificationStats.biometric.count > 0
          ? (verificationStats.biometric.success / verificationStats.biometric.count) * 100
          : 0
      },
      {
        name: 'QR Code',
        count: verificationStats.qr.count,
        failed: verificationStats.qr.count - verificationStats.qr.success,
        successRate: verificationStats.qr.count > 0
          ? (verificationStats.qr.success / verificationStats.qr.count) * 100
          : 0
      }
    ];

    const verificationByDepartment = Object.values(verificationByDept).map(item => ({
      ...item,
      geofencing: item.geoTotal > 0 ? (item.geofencing / item.geoTotal) * 100 : 0,
      face: item.faceTotal > 0 ? (item.face / item.faceTotal) * 100 : 0,
      biometric: item.bioTotal > 0 ? (item.biometric / item.bioTotal) * 100 : 0,
      qr: item.qrTotal > 0 ? (item.qr / item.qrTotal) * 100 : 0
    }));

    return res.status(200).json({
      success: true,
      data: {
        bestDepartments: bestDepartments.length > 0 ? bestDepartments : [],
        worstDepartments: worstDepartments.length > 0 ? worstDepartments : [],
        departmentAttendance: departmentAttendance.length > 0 ? departmentAttendance : [],
        teacherByDepartment: finalTeacherByDepartment.length > 0 ? finalTeacherByDepartment : [],
        highPerformers: {
          count: highPerformers.length,
          percentage: students.length > 0 ? (highPerformers.length / students.length) * 100 : 0
        },
        lowPerformers: {
          count: lowPerformers.length,
          percentage: students.length > 0 ? (lowPerformers.length / students.length) * 100 : 0
        },
        studentDistribution: studentDistribution.length > 0 ? studentDistribution : [],
        highPerformersList: highPerformers.sort((a, b) => b.attendance - a.attendance),
        lowPerformersList: lowPerformers.sort((a, b) => a.attendance - b.attendance),
        trendData: trendData.length > 0 ? trendData : [],
        weeklySummary: weeklySummary.reverse(),
        verificationMethods: verificationMethods.length > 0 ? verificationMethods : [],
        verificationByDepartment: verificationByDepartment.length > 0 ? verificationByDepartment : []
      }
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data',
      error: error.message
    });
  }
};
