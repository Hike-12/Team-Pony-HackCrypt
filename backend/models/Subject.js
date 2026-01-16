const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

subjectSchema.index({ code: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);