const Teacher = require('../../models/Teacher');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');

exports.getAllTeachers = async (req, res) => {
  try {
    // Populate user details to get email
    const teachers = await Teacher.find().populate('user_id', 'email is_active');
    // Transform to include email in response
    const teachersWithEmail = teachers.map(t => ({
      _id: t._id,
      user_id: t.user_id?._id,
      full_name: t.full_name,
      department: t.department,
      email: t.user_id?.email,
      is_active: t.user_id?.is_active,
      created_at: t.created_at
    }));
    res.json({ success: true, data: teachersWithEmail });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createTeacher = async (req, res) => {
  try {
    const { email, password, full_name, department } = req.body;

    // Validate required fields
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create the User first
    const user = new User({
      email,
      password_hash,
      role: 'TEACHER',
      is_active: true
    });
    await user.save();

    // Create the Teacher linked to the User
    const teacher = new Teacher({
      user_id: user._id,
      full_name,
      department
    });
    await teacher.save();

    // Return teacher with email
    res.status(201).json({
      _id: teacher._id,
      user_id: user._id,
      full_name: teacher.full_name,
      department: teacher.department,
      email: user.email,
      is_active: user.is_active,
      created_at: teacher.created_at
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate('user_id', 'email is_active');
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    res.json({
      _id: teacher._id,
      user_id: teacher.user_id?._id,
      full_name: teacher.full_name,
      department: teacher.department,
      email: teacher.user_id?.email,
      is_active: teacher.user_id?.is_active,
      created_at: teacher.created_at
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateTeacher = async (req, res) => {
  try {
    const { email, password, full_name, department } = req.body;
    
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    // Update Teacher fields
    if (full_name) teacher.full_name = full_name;
    if (department !== undefined) teacher.department = department;
    await teacher.save();

    // Update User fields if provided
    if (teacher.user_id) {
      const userUpdate = {};
      if (email) userUpdate.email = email;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        userUpdate.password_hash = await bcrypt.hash(password, salt);
      }
      if (Object.keys(userUpdate).length > 0) {
        await User.findByIdAndUpdate(teacher.user_id, userUpdate);
      }
    }

    // Return updated teacher with email
    const updatedTeacher = await Teacher.findById(req.params.id).populate('user_id', 'email is_active');
    res.json({
      _id: updatedTeacher._id,
      user_id: updatedTeacher.user_id?._id,
      full_name: updatedTeacher.full_name,
      department: updatedTeacher.department,
      email: updatedTeacher.user_id?.email,
      is_active: updatedTeacher.user_id?.is_active,
      created_at: updatedTeacher.created_at
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    // Delete the associated User
    if (teacher.user_id) {
      await User.findByIdAndDelete(teacher.user_id);
    }

    // Delete the Teacher
    await Teacher.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Teacher and associated user deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};