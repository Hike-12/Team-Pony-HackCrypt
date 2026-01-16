const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
  roll_no: { type: String, required: true },
  full_name: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female'], required: true },
  phone: { type: String },
  class_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  device_id_hash: { type: String },
  image_url: { type: String },
  id_qr_url: { type: String },
  created_at: { type: Date, default: Date.now }
});


studentSchema.index({ class_id: 1 });

module.exports = mongoose.model('Student', studentSchema);
