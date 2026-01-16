const mongoose = require('mongoose');

const systemPolicySchema = new mongoose.Schema({
  require_face: { type: Boolean, default: false },
  require_liveness: { type: Boolean, default: false },
  require_qr: { type: Boolean, default: false },
  require_biometric: { type: Boolean, default: false },
  qr_validity_seconds: { type: Number },
  attendance_window_minutes: { type: Number },
  max_failed_attempts: { type: Number },
  lockout_minutes: { type: Number },
  geofence_enabled: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SystemPolicy', systemPolicySchema);