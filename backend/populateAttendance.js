const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Student = require('./models/Student');
const Teacher = require('./models/Teacher');
const Subject = require('./models/Subject');
const TeacherSubject = require('./models/TeacherSubject');
const AttendanceSession = require('./models/AttendanceSession');
const AttendanceRecord = require('./models/AttendanceRecord');
const TimetableSlot = require('./models/TimetableSlot');
const Class = require('./models/Class');

dotenv.config();

mongoose.connect(process.env.MONGO_URI);

async function populateAttendance() {
    try {
        console.log('Finding student and teachers...');
        
        // Find Reniyas Nadar
        const student = await Student.findOne({ full_name: /reniyas.*nadar/i }).populate('class_id');
        if (!student) {
            console.log('Student not found!');
            return;
        }
        console.log(`Found student: ${student.full_name}, ID: ${student._id}`);
        console.log(`Class: ${student.class_id ? student.class_id.name : 'No class'}`);

        // Find teachers
        const babilaTeacher = await Teacher.findOne({ full_name: /babila.*nadar/i });
        const arshdeepTeacher = await Teacher.findOne({ full_name: /arsh/i });
        const shravyaTeacher = await Teacher.findOne({ full_name: /shravya/i });

        console.log('\nTeachers found:');
        console.log('Babila:', babilaTeacher ? babilaTeacher.full_name : 'Not found');
        console.log('Arshdeep:', arshdeepTeacher ? arshdeepTeacher.full_name : 'Not found');
        console.log('Shravya:', shravyaTeacher ? shravyaTeacher.full_name : 'Not found');

        // Find subjects
        const subjects = await Subject.find({});
        console.log('\nAll subjects:');
        subjects.forEach(s => console.log(`- ${s.name} (${s.code})`));

        const dsSubject = await Subject.findOne({ name: /data.*struct/i });
        const aimlSubject = await Subject.findOne({ name: /artificial.*intelligence/i });

        console.log('\nTarget subjects:');
        console.log('Data Structures:', dsSubject ? dsSubject.name : 'Not found');
        console.log('AI/ML:', aimlSubject ? aimlSubject.name : 'Not found');

        // Find teacher-subject mappings
        const teacherSubjects = await TeacherSubject.find({
            class_id: student.class_id._id
        }).populate(['teacher_id', 'subject_id']);

        console.log('\nTeacher-Subject mappings for student class:');
        teacherSubjects.forEach(ts => {
            console.log(`- ${ts.teacher_id.full_name} teaches ${ts.subject_id.name}`);
        });

        // Target percentages:
        // Data Structures (Shravya): 80%
        // Babila's subject: 70%
        // AI (Arshdeep): 55%

        const dataStructuresTS = teacherSubjects.find(ts => 
            shravyaTeacher && ts.teacher_id._id.equals(shravyaTeacher._id) && 
            dsSubject && ts.subject_id._id.equals(dsSubject._id)
        );

        const aimlTS = teacherSubjects.find(ts => 
            arshdeepTeacher && ts.teacher_id._id.equals(arshdeepTeacher._id) && 
            aimlSubject && ts.subject_id._id.equals(aimlSubject._id)
        );

        const babilaTS = teacherSubjects.find(ts => 
            babilaTeacher && ts.teacher_id._id.equals(babilaTeacher._id)
        );

        console.log('\nTarget Teacher-Subjects found:');
        console.log('DS by Shravya:', dataStructuresTS ? 'Yes' : 'No');
        console.log('AIML by Arshdeep:', aimlTS ? 'Yes' : 'No');
        console.log('Babila Subject:', babilaTS ? babilaTS.subject_id.name : 'No');

        // Create attendance records
        // From Jan 10 to Jan 17 = 8 days
        const startDate = new Date('2026-01-10');
        const endDate = new Date('2026-01-17');

        // For Data Structures: 80% - Let's say 10 lectures, attend 8
        if (dataStructuresTS) {
            console.log('\n=== Creating Data Structures records (80%) ===');
            await createAttendanceForSubject(student, dataStructuresTS, 10, 8, startDate);
        }

        // For Babila's subject: 70% - Let's say 10 lectures, attend 7
        if (babilaTS) {
            console.log('\n=== Creating Babila subject records (70%) ===');
            await createAttendanceForSubject(student, babilaTS, 10, 7, startDate);
        }

        // For AIML: 55% - Let's say 11 lectures, attend 6
        if (aimlTS) {
            console.log('\n=== Creating AIML records (55%) ===');
            await createAttendanceForSubject(student, aimlTS, 11, 6, startDate);
        }

        console.log('\n✅ Attendance records created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

async function createAttendanceForSubject(student, teacherSubject, totalLectures, presentCount, startDate) {
    const slot = await TimetableSlot.findOne();
    
    for (let i = 0; i < totalLectures; i++) {
        const lectureDate = new Date(startDate);
        lectureDate.setDate(lectureDate.getDate() + i);
        lectureDate.setHours(10, 0, 0, 0);

        const endTime = new Date(lectureDate);
        endTime.setHours(11, 0, 0, 0);

        // Create session
        let session = await AttendanceSession.findOne({
            teacher_subject_id: teacherSubject._id,
            starts_at: { $gte: lectureDate, $lt: endTime }
        });

        if (!session) {
            session = await AttendanceSession.create({
                teacher_subject_id: teacherSubject._id,
                session_type: 'LECTURE',
                starts_at: lectureDate,
                ends_at: endTime,
                is_active: false,
                created_at: lectureDate
            });
        }

        // Check if record already exists
        const existingRecord = await AttendanceRecord.findOne({
            session_id: session._id,
            student_id: student._id
        });

        if (!existingRecord) {
            // First presentCount lectures will be PRESENT, rest ABSENT
            const status = i < presentCount ? 'PRESENT' : 'ABSENT';
            
            await AttendanceRecord.create({
                session_id: session._id,
                student_id: student._id,
                status: status,
                marked_at: lectureDate,
                verification_level: 'HIGH',
                trust_score: 0.95
            });

            console.log(`Created ${status} record for ${teacherSubject.subject_id.name} on ${lectureDate.toDateString()}`);
        } else {
            console.log(`Record already exists for ${teacherSubject.subject_id.name} on ${lectureDate.toDateString()}`);
        }
    }
}

populateAttendance();
