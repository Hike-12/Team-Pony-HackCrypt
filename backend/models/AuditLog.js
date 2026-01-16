const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actor_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  entity_type: { type: String, required: true },
  entity_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  details: { type: Object },
  created_at: { type: Date, default: Date.now }
});

auditLogSchema.index({ actor_user_id: 1 });
auditLogSchema.index({ entity_type: 1, entity_id: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);