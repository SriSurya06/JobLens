const mongoose = require('mongoose');
const auditLogSchema = new mongoose.Schema(
  {
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action:   { type: String, required: true },
    entity:   { type: String },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    details:  { type: mongoose.Schema.Types.Mixed },
    ip:       { type: String },
  },
  { timestamps: true }
);
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });
module.exports = mongoose.model('AuditLog', auditLogSchema);