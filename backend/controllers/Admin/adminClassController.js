const Class = require('../../models/Class');

exports.getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find().sort({ batch_year: -1, name: 1, division: 1 });
    res.json({ success: true, data: classes });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createClass = async (req, res) => {
  try {
    const { name, batch_year, division } = req.body;

    // Validate required fields
    if (!name || !batch_year || !division) {
      return res.status(400).json({ error: 'Name, batch year, and division are required' });
    }

    // Check if class with same name, batch_year, and division exists
    const existingClass = await Class.findOne({ name, batch_year, division });
    if (existingClass) {
      return res.status(400).json({ error: 'A class with this name, batch year, and division already exists' });
    }

    const newClass = new Class({
      name,
      batch_year,
      division
    });
    await newClass.save();

    res.status(201).json(newClass);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getClassById = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) return res.status(404).json({ error: 'Class not found' });
    res.json(classData);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateClass = async (req, res) => {
  try {
    const { name, batch_year, division } = req.body;
    
    const classData = await Class.findById(req.params.id);
    if (!classData) return res.status(404).json({ error: 'Class not found' });

    // Update fields
    if (name) classData.name = name;
    if (batch_year) classData.batch_year = batch_year;
    if (division) classData.division = division;

    await classData.save();
    res.json(classData);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteClass = async (req, res) => {
  try {
    const classData = await Class.findByIdAndDelete(req.params.id);
    if (!classData) return res.status(404).json({ error: 'Class not found' });
    res.json({ message: 'Class deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
