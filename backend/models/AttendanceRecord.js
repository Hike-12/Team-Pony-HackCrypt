const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceSession', required: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  status: { type: String, enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'REJECTED'], required: true },
  marked_at: { type: Date, required: true },
  verification_level: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'] },
  trust_score: { type: Number },
  source_attempt_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceAttempt' }
});

attendanceRecordSchema.index({ session_id: 1, student_id: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);