const mongoose = require('mongoose');

const attendanceFlagSchema = new mongoose.Schema({
  session_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  attempt_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  flag_type: {
    type: String,
    enum: [
      'FACE_MISMATCH',
      'LIVENESS_FAILED',
      'QR_EXPIRED',
      'DEVICE_MISMATCH',
      'LOCATION_MISMATCH',
      'TOO_MANY_ATTEMPTS',
      'DUPLICATE_FACE',
      'MULTI_SESSION_CONFLICT'
    ],
    required: true
  },
  severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: true },
  description: { type: String },
  resolved: { type: Boolean, default: false },
  resolved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolved_action: { type: String, enum: ['APPROVED', 'REJECTED', 'IGNORED'] },
  resolved_at: { type: Date },
  created_at: { type: Date, default: Date.now }
});

attendanceFlagSchema.index({ session_id: 1, student_id: 1 });
attendanceFlagSchema.index({ resolved: 1 });

module.exports = mongoose.model('AttendanceFlag', attendanceFlagSchema);