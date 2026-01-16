const TeacherSubject = require('../../models/TeacherSubject');
const Teacher = require('../../models/Teacher');
const Subject = require('../../models/Subject');
const Class = require('../../models/Class');

exports.getAllAssignments = async (req, res) => {
  try {
    const assignments = await TeacherSubject.find()
      .populate('teacher_id', 'full_name user_id')
      .populate('subject_id', 'code name')
      .populate('class_id', 'name division batch_year')
      .sort({ teacher_id: 1, subject_id: 1 });
    
    // Transform response to include readable details
    const formattedAssignments = assignments.map(assignment => ({
      _id: assignment._id,
      teacher_id: assignment.teacher_id?._id,
      teacher_name: assignment.teacher_id?.full_name,
      subject_id: assignment.subject_id?._id,
      subject_code: assignment.subject_id?.code,
      subject_name: assignment.subject_id?.name,
      class_id: assignment.class_id?._id,
      class_name: `${assignment.class_id?.name} ${assignment.class_id?.division} (${assignment.class_id?.batch_year})`
    }));
    
    res.json(formattedAssignments);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createAssignment = async (req, res) => {
  try {
    const { teacher_id, subject_id, class_id } = req.body;

    // Validate required fields
    if (!teacher_id || !subject_id || !class_id) {
      return res.status(400).json({ error: 'Teacher, subject, and class are required' });
    }

    // Verify teacher exists
    const teacher = await Teacher.findById(teacher_id);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Verify subject exists
    const subject = await Subject.findById(subject_id);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    // Verify class exists
    const classData = await Class.findById(class_id);
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Check if assignment already exists
    const existingAssignment = await TeacherSubject.findOne({
      teacher_id,
      subject_id,
      class_id
    });
    if (existingAssignment) {
      return res.status(400).json({ error: 'This teacher is already assigned to this subject in this class' });
    }

    const assignment = new TeacherSubject({
      teacher_id,
      subject_id,
      class_id
    });
    await assignment.save();

    // Populate and return
    await assignment.populate('teacher_id', 'full_name');
    await assignment.populate('subject_id', 'code name');
    await assignment.populate('class_id', 'name division batch_year');

    res.status(201).json({
      _id: assignment._id,
      teacher_id: assignment.teacher_id?._id,
      teacher_name: assignment.teacher_id?.full_name,
      subject_id: assignment.subject_id?._id,
      subject_code: assignment.subject_id?.code,
      subject_name: assignment.subject_id?.name,
      class_id: assignment.class_id?._id,
      class_name: `${assignment.class_id?.name} ${assignment.class_id?.division} (${assignment.class_id?.batch_year})`
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAssignmentById = async (req, res) => {
  try {
    const assignment = await TeacherSubject.findById(req.params.id)
      .populate('teacher_id', 'full_name')
      .populate('subject_id', 'code name')
      .populate('class_id', 'name division batch_year');
    
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    
    res.json({
      _id: assignment._id,
      teacher_id: assignment.teacher_id?._id,
      teacher_name: assignment.teacher_id?.full_name,
      subject_id: assignment.subject_id?._id,
      subject_code: assignment.subject_id?.code,
      subject_name: assignment.subject_id?.name,
      class_id: assignment.class_id?._id,
      class_name: `${assignment.class_id?.name} ${assignment.class_id?.division} (${assignment.class_id?.batch_year})`
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacher_id, subject_id, class_id } = req.body;

    // Validate required fields
    if (!teacher_id || !subject_id || !class_id) {
      return res.status(400).json({ error: 'Teacher, subject, and class are required' });
    }

    // Verify teacher exists
    const teacher = await Teacher.findById(teacher_id);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Verify subject exists
    const subject = await Subject.findById(subject_id);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    // Verify class exists
    const classData = await Class.findById(class_id);
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Check if another assignment already exists with the same combination
    const existingAssignment = await TeacherSubject.findOne({
      teacher_id,
      subject_id,
      class_id,
      _id: { $ne: id } // Exclude the current assignment
    });
    if (existingAssignment) {
      return res.status(400).json({ error: 'This teacher is already assigned to this subject in this class' });
    }

    const assignment = await TeacherSubject.findByIdAndUpdate(
      id,
      { teacher_id, subject_id, class_id },
      { new: true }
    )
      .populate('teacher_id', 'full_name')
      .populate('subject_id', 'code name')
      .populate('class_id', 'name division batch_year');

    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    res.json({
      _id: assignment._id,
      teacher_id: assignment.teacher_id?._id,
      teacher_name: assignment.teacher_id?.full_name,
      subject_id: assignment.subject_id?._id,
      subject_code: assignment.subject_id?.code,
      subject_name: assignment.subject_id?.name,
      class_id: assignment.class_id?._id,
      class_name: `${assignment.class_id?.name} ${assignment.class_id?.division} (${assignment.class_id?.batch_year})`
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await TeacherSubject.findByIdAndDelete(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    res.json({ message: 'Assignment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get assignments for a specific teacher
exports.getTeacherAssignments = async (req, res) => {
  try {
    const { teacher_id } = req.params;
    
    const assignments = await TeacherSubject.find({ teacher_id })
      .populate('subject_id', 'code name')
      .populate('class_id', 'name division batch_year');
    
    const formattedAssignments = assignments.map(assignment => ({
      _id: assignment._id,
      subject_code: assignment.subject_id?.code,
      subject_name: assignment.subject_id?.name,
      class_name: `${assignment.class_id?.name} ${assignment.class_id?.division} (${assignment.class_id?.batch_year})`
    }));
    
    res.json(formattedAssignments);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
