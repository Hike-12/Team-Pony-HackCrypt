const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
  full_name: { type: String, required: true },
  department: { type: String },
  created_at: { type: Date, default: Date.now }
});



module.exports = mongoose.model('Teacher', teacherSchema);