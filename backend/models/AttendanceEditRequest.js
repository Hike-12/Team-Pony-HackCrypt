const mongoose = require('mongoose');

const attendanceEditRequestSchema = new mongoose.Schema({
  session_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  requested_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requested_status: { type: String, enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'], required: true },
  reason: { type: String },
  approval_status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewed_at: { type: Date },
  created_at: { type: Date, default: Date.now }
});

attendanceEditRequestSchema.index({ session_id: 1, student_id: 1 });
attendanceEditRequestSchema.index({ approval_status: 1 });

module.exports = mongoose.model('AttendanceEditRequest', attendanceEditRequestSchema);