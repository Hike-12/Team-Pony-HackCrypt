const User = require('../../models/User');
const Student = require('../../models/Student');
const Class = require('../../models/Class');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { roll_no, password } = req.body;

        if (!roll_no || !password) {
            return res.status(400).json({ message: 'Please provide roll number and password' });
        }

        // 1. Find Student by roll_no
        const student = await Student.findOne({ roll_no });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // 2. Find User by student.user_id
        const user = await User.findById(student.user_id);
        if (!user) {
            return res.status(404).json({ message: 'User account not found' });
        }

        // 3. Verify Password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // 4. Generate Token
        const token = jwt.sign(
            { id: user._id, role: user.role, student_id: student._id },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
        );

        // Populate class information
        const studentWithClass = await Student.findById(student._id).populate('class_id');

        res.json({ 
            token, 
            user: { 
                id: user._id,
                student_id : student._id,
                role: user.role, 
                name: student.full_name, 
                roll_no: student.roll_no,
                class_id: student.class_id,
                class_name: studentWithClass.class_id?.name || 'Not assigned',
                phone: student.phone,
                gender: student.gender,
                image_url: student.image_url,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Student Login Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const { studentId } = req.params;

        // Find student with populated class information
        const student = await Student.findById(studentId).populate('class_id');
        
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Find user information
        const user = await User.findById(student.user_id);
        
        const profileData = {
            full_name: student.full_name,
            roll_no: student.roll_no,
            phone: student.phone,
            gender: student.gender,
            class_name: student.class_id?.name || 'Not assigned',
            image_url: student.image_url,
            email: user?.email || 'N/A',
            created_at: student.created_at
        };

        res.json({ 
            success: true, 
            data: profileData 
        });

    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
