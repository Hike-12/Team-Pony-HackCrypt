const User = require('../../models/User');
const Teacher = require('../../models/Teacher');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
       }

        // 1. Find User by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'TEACHER') {
            return res.status(403).json({ message: 'Access denied. Not a teacher.' });
        }

        // 2. Verify Password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // 3. Find Teacher details
        const teacher = await Teacher.findOne({ user_id: user._id });

        // 4. Generate Token
        const token = jwt.sign(
            { id: user._id, role: user.role, teacher_id: teacher ? teacher._id : null },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
        );

        res.json({ 
            token, 
            user: { 
                id: user._id, 
                role: user.role, 
                name: teacher ? teacher.full_name : 'Teacher',
                email: user.email,
                department: teacher ? teacher.department : null
            } 
        });

    } catch (error) {
        console.error("Teacher Login Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};
