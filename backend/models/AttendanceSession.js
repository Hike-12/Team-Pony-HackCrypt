const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema({
  teacher_subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TeacherSubject', required: true },
  session_type: { type: String, enum: ['LECTURE', 'LAB', 'EXAM'], required: true },
  starts_at: { type: Date, required: true },
  ends_at: { type: Date, required: true },
  is_active: { type: Boolean, default: true },
  room_label: { type: String },
  expected_lat: { type: Number },
  expected_lng: { type: Number },
  allowed_radius_m: { type: Number },
  created_at: { type: Date, default: Date.now }
});

attendanceSessionSchema.index({ teacher_subject_id: 1 });
attendanceSessionSchema.index({ is_active: 1 });

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);