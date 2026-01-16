const mongoose = require('mongoose');

const sessionQRTokenSchema = new mongoose.Schema({
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceSession', required: true },
  token: { type: String, unique: true, required: true },
  valid_from: { type: Date, required: true },
  valid_until: { type: Date, required: true },
  created_at: { type: Date, default: Date.now }
});

sessionQRTokenSchema.index({ token: 1 }, { unique: true });
sessionQRTokenSchema.index({ session_id: 1 });
sessionQRTokenSchema.index({ valid_until: 1 });

module.exports = mongoose.model('SessionQRToken', sessionQRTokenSchema);