const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});



module.exports = mongoose.model('Subject', subjectSchema);