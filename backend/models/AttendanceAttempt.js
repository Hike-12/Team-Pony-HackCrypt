const mongoose = require('mongoose');

const attendanceAttemptSchema = new mongoose.Schema({
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceSession', required: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  qr_token: { type: String },
  qr_valid: { type: Boolean },
  face_verified: { type: Boolean },
  face_score: { type: Number },
  liveness_verified: { type: Boolean },
  biometric_verified: { type: Boolean },
  biometric_type: { type: String, enum: ['FINGERPRINT', 'FACE_ID', 'DEVICE_CREDENTIAL', 'SIMULATED'] },
  device_id_hash: { type: String },
  client_ip: { type: String },
  student_lat: { type: Number },
  student_lng: { type: Number },
  location_verified: { type: Boolean },
  attempt_status: { type: String, enum: ['SUCCESS', 'FAILED', 'FLAGGED'], required: true },
  fail_reason: { type: String },
  created_at: { type: Date, default: Date.now }
});

attendanceAttemptSchema.index({ session_id: 1, student_id: 1 });
attendanceAttemptSchema.index({ attempt_status: 1 });
attendanceAttemptSchema.index({ created_at: 1 });

module.exports = mongoose.model('AttendanceAttempt', attendanceAttemptSchema);