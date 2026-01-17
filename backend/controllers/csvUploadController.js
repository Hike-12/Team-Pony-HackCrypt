const csv = require('csv-parser');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const TeacherSubject = require('../models/TeacherSubject');
const User = require('../models/User');
const Class = require('../models/Class');
const Student = require('../models/Student');
const cloudinary = require('../config/cloudinary');

/**
 * Upload and process subjects CSV
 */
exports.uploadSubjectsCSV = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const subjects = [];
        const errors = [];
        const filePath = req.file.path;

        // Parse CSV
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                subjects.push(row);
            })
            .on('end', async () => {
                try {
                    const results = {
                        added: [],
                        skipped: [],
                        errors: []
                    };

                    for (const subjectData of subjects) {
                        const { subject_name, subject_code } = subjectData;

                        if (!subject_name || !subject_code) {
                            results.errors.push({
                                data: subjectData,
                                error: 'Missing subject_name or subject_code'
                            });
                            continue;
                        }

                        // Check if subject already exists
                        const existingSubject = await Subject.findOne({
                            $or: [
                                { name: subject_name },
                                { code: subject_code }
                            ]
                        });

                        if (existingSubject) {
                            results.skipped.push({
                                subject_name,
                                subject_code,
                                reason: 'Already exists'
                            });
                            continue;
                        }

                        // Create new subject
                        const newSubject = await Subject.create({
                            name: subject_name,
                            code: subject_code,
                            department: subjectData.department || 'General'
                        });

                        results.added.push({
                            name: newSubject.name,
                            code: newSubject.code
                        });
                    }

                    // Delete uploaded file
                    fs.unlinkSync(filePath);

                    res.status(200).json({
                        success: true,
                        message: `Processed ${subjects.length} subjects`,
                        data: results
                    });

                } catch (error) {
                    console.error('Error processing subjects CSV:', error);
                    // Delete uploaded file
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                    res.status(500).json({
                        success: false,
                        message: 'Error processing subjects',
                        error: error.message
                    });
                }
            })
            .on('error', (error) => {
                console.error('CSV parsing error:', error);
                // Delete uploaded file
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                res.status(500).json({
                    success: false,
                    message: 'Error parsing CSV file',
                    error: error.message
                });
            });

    } catch (error) {
        console.error('Upload subjects CSV error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Upload and process teachers CSV
 */
exports.uploadTeachersCSV = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const teachers = [];
        const filePath = req.file.path;

        // Parse CSV
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                teachers.push(row);
            })
            .on('end', async () => {
                try {
                    const results = {
                        added: [],
                        skipped: [],
                        errors: []
                    };

                    for (const teacherData of teachers) {
                        const { fullname, department, subject_name, subject_code, email, password, class: className } = teacherData;

                        // Validate required fields
                        if (!fullname || !email || !password) {
                            results.errors.push({
                                data: teacherData,
                                error: 'Missing required fields (fullname, email, password)'
                            });
                            continue;
                        }

                        try {
                            // Check if user already exists
                            const existingUser = await User.findOne({ email });
                            if (existingUser) {
                                results.skipped.push({
                                    fullname,
                                    email,
                                    reason: 'Email already exists'
                                });
                                continue;
                            }

                            // Hash password
                            const hashedPassword = await bcrypt.hash(password, 10);

                            // Create User
                            const user = await User.create({
                                email,
                                password_hash: hashedPassword,
                                role: 'TEACHER'
                            });

                            // Create Teacher
                            const teacher = await Teacher.create({
                                user_id: user._id,
                                full_name: fullname,
                                department: department || 'General',
                                phone: teacherData.phone || null,
                                address: teacherData.address || null
                            });

                            // If subject information is provided, create TeacherSubject
                            let teacherSubjectCreated = false;
                            if (subject_name && subject_code) {
                                // Find or create subject
                                let subject = await Subject.findOne({ code: subject_code });
                                
                                if (!subject) {
                                    subject = await Subject.create({
                                        name: subject_name,
                                        code: subject_code,
                                        department: department || 'General'
                                    });
                                }

                                // Parse class name: format is "Name Division (Year)" e.g., "Computer Engineering A (2026)"
                                let classRecord = null;
                                if (className) {
                                    // Extract division and batch_year from className
                                    const classMatch = className.match(/^(.+?)\s([A-Z])\s\((\d{4})\)$/);
                                    
                                    if (classMatch) {
                                        const [, classNamePart, division, batchYear] = classMatch;
                                        
                                        // Try to find exact match
                                        classRecord = await Class.findOne({
                                            name: classNamePart.trim(),
                                            division: division,
                                            batch_year: parseInt(batchYear)
                                        });

                                        // If not found, create it
                                        if (!classRecord) {
                                            console.log(`Creating new class: ${classNamePart}, ${division}, ${batchYear}`);
                                            classRecord = await Class.create({
                                                name: classNamePart.trim(),
                                                division: division,
                                                batch_year: parseInt(batchYear)
                                            });
                                        }
                                    } else {
                                        results.errors.push({
                                            data: teacherData,
                                            error: `Invalid class name format: ${className}. Expected format: "Name Division (Year)"`
                                        });
                                    }

                                    if (classRecord) {
                                        // Create TeacherSubject with class_id
                                        await TeacherSubject.create({
                                            teacher_id: teacher._id,
                                            subject_id: subject._id,
                                            class_id: classRecord._id
                                        });

                                        teacherSubjectCreated = true;
                                    }
                                }
                            }

                            results.added.push({
                                fullname,
                                email,
                                department: department || 'General',
                                subject_assigned: teacherSubjectCreated
                            });

                        } catch (error) {
                            console.error(`Error creating teacher ${fullname}:`, error);
                            results.errors.push({
                                data: teacherData,
                                error: error.message
                            });
                        }
                    }

                    // Delete uploaded file
                    fs.unlinkSync(filePath);

                    res.status(200).json({
                        success: true,
                        message: `Processed ${teachers.length} teachers`,
                        data: results
                    });

                } catch (error) {
                    console.error('Error processing teachers CSV:', error);
                    // Delete uploaded file
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                    res.status(500).json({
                        success: false,
                        message: 'Error processing teachers',
                        error: error.message
                    });
                }
            })
            .on('error', (error) => {
                console.error('CSV parsing error:', error);
                // Delete uploaded file
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                res.status(500).json({
                    success: false,
                    message: 'Error parsing CSV file',
                    error: error.message
                });
            });

    } catch (error) {
        console.error('Upload teachers CSV error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Upload and process students CSV
 */
exports.uploadStudentsCSV = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const students = [];
        const filePath = req.file.path;

        // Parse CSV
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                students.push(row);
            })
            .on('end', async () => {
                try {
                    const results = {
                        added: [],
                        skipped: [],
                        errors: []
                    };

                    for (const studentData of students) {
                        const { email, password, rollno, fullname, gender, phone, class: className } = studentData;

                        // Validate required fields
                        if (!fullname || !email || !password || !rollno || !gender) {
                            results.errors.push({
                                data: studentData,
                                error: 'Missing required fields (fullname, email, password, rollno, gender)'
                            });
                            continue;
                        }

                        try {
                            // Check if user already exists
                            const existingUser = await User.findOne({ email });
                            if (existingUser) {
                                results.skipped.push({
                                    fullname,
                                    email,
                                    reason: 'Email already exists'
                                });
                                continue;
                            }

                            // Check if roll number already exists
                            const existingStudent = await Student.findOne({ roll_no: rollno });
                            if (existingStudent) {
                                results.skipped.push({
                                    fullname,
                                    rollno,
                                    reason: 'Roll number already exists'
                                });
                                continue;
                            }

                            // Hash password
                            const hashedPassword = await bcrypt.hash(password, 10);

                            // Create User
                            const user = await User.create({
                                email,
                                password_hash: hashedPassword,
                                role: 'STUDENT'
                            });

                            // Generate QR code with student information
                            const qrData = JSON.stringify({
                                user_id: user._id.toString(),
                                type: 'student'
                            });

                            // Generate QR code as buffer
                            const qrCodeBuffer = await QRCode.toBuffer(qrData, {
                                errorCorrectionLevel: 'H',
                                type: 'png',
                                width: 500,
                                margin: 2
                            });

                            // Upload QR code to Cloudinary
                            let qrUrl = null;
                            try {
                                const qrUploadPromise = new Promise((resolve, reject) => {
                                    const uploadStream = cloudinary.uploader.upload_stream(
                                        {
                                            folder: 'student_qr_codes',
                                            resource_type: 'image',
                                            public_id: `student_${user._id}_qr`
                                        },
                                        (error, result) => {
                                            if (error) reject(error);
                                            else resolve(result);
                                        }
                                    );
                                    uploadStream.end(qrCodeBuffer);
                                });

                                const qrUploadResult = await qrUploadPromise;
                                qrUrl = qrUploadResult.secure_url;
                            } catch (qrError) {
                                console.error('QR upload error:', qrError);
                                // Continue without QR if upload fails
                            }

                            // Parse class name: format is "Name Division (Year)" e.g., "Computer Engineering A (2026)"
                            let classRecord = null;
                            if (className) {
                                // Extract division and batch_year from className
                                const classMatch = className.match(/^(.+?)\s([A-Z])\s\((\d{4})\)$/);
                                
                                if (classMatch) {
                                    const [, classNamePart, division, batchYear] = classMatch;
                                    
                                    // Try to find exact match
                                    classRecord = await Class.findOne({
                                        name: classNamePart.trim(),
                                        division: division,
                                        batch_year: parseInt(batchYear)
                                    });

                                    // If not found, create it
                                    if (!classRecord) {
                                        console.log(`Creating new class: ${classNamePart}, ${division}, ${batchYear}`);
                                        classRecord = await Class.create({
                                            name: classNamePart.trim(),
                                            division: division,
                                            batch_year: parseInt(batchYear)
                                        });
                                    }
                                } else {
                                    results.errors.push({
                                        data: studentData,
                                        error: `Invalid class name format: ${className}. Expected format: "Name Division (Year)"`
                                    });
                                    continue;
                                }
                            }

                            if (!classRecord) {
                                results.errors.push({
                                    data: studentData,
                                    error: 'Class not found or could not be created'
                                });
                                continue;
                            }

                            // Create Student
                            const student = await Student.create({
                                user_id: user._id,
                                roll_no: rollno,
                                full_name: fullname,
                                gender: gender.toLowerCase(),
                                phone: phone || null,
                                class_id: classRecord._id,
                                id_qr_url: qrUrl
                            });

                            results.added.push({
                                fullname,
                                email,
                                rollno,
                                class: className,
                                qr_generated: qrUrl ? true : false
                            });

                        } catch (error) {
                            console.error(`Error creating student ${fullname}:`, error);
                            results.errors.push({
                                data: studentData,
                                error: error.message
                            });
                        }
                    }

                    // Delete uploaded file
                    fs.unlinkSync(filePath);

                    res.status(200).json({
                        success: true,
                        message: `Processed ${students.length} students`,
                        data: results
                    });

                } catch (error) {
                    console.error('Error processing students CSV:', error);
                    // Delete uploaded file
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                    res.status(500).json({
                        success: false,
                        message: 'Error processing students',
                        error: error.message
                    });
                }
            })
            .on('error', (error) => {
                console.error('CSV parsing error:', error);
                // Delete uploaded file
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                res.status(500).json({
                    success: false,
                    message: 'Error parsing CSV file',
                    error: error.message
                });
            });

    } catch (error) {
        console.error('Upload students CSV error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
