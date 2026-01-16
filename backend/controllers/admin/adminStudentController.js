const Student = require('../../models/Student');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const cloudinary = require('../../config/cloudinary');
const QRCode = require('qrcode');

// Configure multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
}).single('image');

exports.getAllStudents = async (req, res) => {
  try {
    // Populate user details and class name
    const students = await Student.find()
      .populate('user_id', 'email is_active')
      .populate('class_id', 'name division batch_year');
    
    // Transform to include email in response
    const studentsWithDetails = students.map(s => ({
      _id: s._id,
      user_id: s.user_id?._id,
      roll_no: s.roll_no,
      full_name: s.full_name,
      gender: s.gender,
      phone: s.phone,
      class_id: s.class_id?._id,
      class_name: s.class_id ? `${s.class_id.name} ${s.class_id.division}` : 'N/A',
      email: s.user_id?.email,
      image_url: s.image_url,
      id_qr_url: s.id_qr_url,
      is_active: s.user_id?.is_active,
      created_at: s.created_at
    }));
    res.json(studentsWithDetails);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createStudent = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { email, password, roll_no, full_name, gender, phone, class_id } = req.body;

      // Validate required fields
      if (!email || !password || !roll_no || !full_name || !gender || !class_id) {
        return res.status(400).json({ error: 'Email, password, roll number, full name, gender, and class are required' });
      }

      // Check if image is provided (mandatory)
      if (!req.file) {
        return res.status(400).json({ error: 'Student image is required' });
      }

      // Check if user with this email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'A user with this email already exists' });
      }

      // Check if roll number already exists
      const existingStudent = await Student.findOne({ roll_no });
      if (existingStudent) {
        return res.status(400).json({ error: 'A student with this roll number already exists' });
      }

      // Upload image to Cloudinary
      const uploadPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'students',
            resource_type: 'image'
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      const uploadResult = await uploadPromise;

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // Create the User first
      const user = new User({
        email,
        password_hash,
        role: 'STUDENT',
        is_active: true
      });
      await user.save();

      // Generate QR code data with student information
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

      // Create the Student linked to the User
      const student = new Student({
        user_id: user._id,
        roll_no,
        full_name,
        gender,
        phone,
        class_id,
        image_url: uploadResult.secure_url,
        id_qr_url: qrUploadResult.secure_url
      });
      await student.save();

      // Populate class info for response
      await student.populate('class_id', 'name division batch_year');

      // Return student with email
      res.status(201).json({
        _id: student._id,
        user_id: user._id,
        roll_no: student.roll_no,
        full_name: student.full_name,
        gender: student.gender,
        phone: student.phone,
        class_id: student.class_id?._id,
        class_name: student.class_id ? `${student.class_id.name} ${student.class_id.division}` : 'N/A',
        email: user.email,
        image_url: student.image_url,
        id_qr_url: student.id_qr_url,
        is_active: user.is_active,
        created_at: student.created_at
      });
    } catch (error) {
      console.error('Create student error:', error);
      res.status(400).json({ error: error.message });
    }
  });
};

exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user_id', 'email is_active')
      .populate('class_id', 'name division batch_year');
    
    if (!student) return res.status(404).json({ error: 'Student not found' });
    
    res.json({
      _id: student._id,
      user_id: student.user_id?._id,
      roll_no: student.roll_no,
      full_name: student.full_name,
      gender: student.gender,
      phone: student.phone,
      class_id: student.class_id?._id,
      class_name: student.class_id ? `${student.class_id.name} ${student.class_id.division}` : 'N/A',
      email: student.user_id?.email,
      image_url: student.image_url,
      id_qr_url: student.id_qr_url,
      is_active: student.user_id?.is_active,
      created_at: student.created_at
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateStudent = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { email, password, roll_no, full_name, gender, phone, class_id } = req.body;
      
      const student = await Student.findById(req.params.id);
      if (!student) return res.status(404).json({ error: 'Student not found' });

      // Update Student fields
      if (roll_no) student.roll_no = roll_no;
      if (full_name) student.full_name = full_name;
      if (gender) student.gender = gender;
      if (phone !== undefined) student.phone = phone;
      if (class_id) student.class_id = class_id;

      // Handle image update if new image is provided
      if (req.file) {
        const uploadPromise = new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'students',
              resource_type: 'image'
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(req.file.buffer);
        });

        const uploadResult = await uploadPromise;
        student.image_url = uploadResult.secure_url;
      }

      await student.save();

      // Update User fields if provided
      if (student.user_id) {
        const userUpdate = {};
        if (email) userUpdate.email = email;
        if (password) {
          const salt = await bcrypt.genSalt(10);
          userUpdate.password_hash = await bcrypt.hash(password, salt);
        }
        if (Object.keys(userUpdate).length > 0) {
          await User.findByIdAndUpdate(student.user_id, userUpdate);
        }
      }

      // Return updated student with email and class info
      const updatedStudent = await Student.findById(req.params.id)
        .populate('user_id', 'email is_active')
        .populate('class_id', 'name division batch_year');
      
      res.json({
        _id: updatedStudent._id,
        user_id: updatedStudent.user_id?._id,
        roll_no: updatedStudent.roll_no,
        full_name: updatedStudent.full_name,
        gender: updatedStudent.gender,
        phone: updatedStudent.phone,
        class_id: updatedStudent.class_id?._id,
        class_name: updatedStudent.class_id ? `${updatedStudent.class_id.name} ${updatedStudent.class_id.division}` : 'N/A',
        email: updatedStudent.user_id?.email,
        image_url: updatedStudent.image_url,
        id_qr_url: updatedStudent.id_qr_url,
        is_active: updatedStudent.user_id?.is_active,
        created_at: updatedStudent.created_at
      });
    } catch (error) {
      console.error('Update student error:', error);
      res.status(400).json({ error: error.message });
    }
  });
};

exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Delete the associated User
    if (student.user_id) {
      await User.findByIdAndDelete(student.user_id);
    }

    // Delete the Student
    await Student.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Student and associated user deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};