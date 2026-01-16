const mongoose = require('mongoose');

const studentBiometricSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', unique: true, required: true },
  face_enrolled: { type: Boolean, default: false },
  face_embedding: { type: Object },
  face_updated_at: { type: Date },
  consent_given: { type: Boolean, default: false },
  consent_at: { type: Date },
  deleted_at: { type: Date }
});

studentBiometricSchema.index({ student_id: 1 }, { unique: true });

module.exports = mongoose.model('StudentBiometric', studentBiometricSchema);