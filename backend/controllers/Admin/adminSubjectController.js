const Subject = require('../../models/Subject');

exports.getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ code: 1 });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createSubject = async (req, res) => {
  try {
    const { code, name } = req.body;

    // Validate required fields
    if (!code || !name) {
      return res.status(400).json({ error: 'Subject code and name are required' });
    }

    // Check if subject with same code exists
    const existingSubject = await Subject.findOne({ code });
    if (existingSubject) {
      return res.status(400).json({ error: 'A subject with this code already exists' });
    }

    const subject = new Subject({
      code: code.toUpperCase(),
      name
    });
    await subject.save();

    res.status(201).json(subject);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    res.json(subject);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    const { code, name } = req.body;
    
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    // Update fields
    if (code) subject.code = code.toUpperCase();
    if (name) subject.name = name;

    await subject.save();
    res.json(subject);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    res.json({ message: 'Subject deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
