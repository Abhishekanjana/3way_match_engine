const mongoose = require('mongoose');

const auditStepSchema = new mongoose.Schema(
  {
    step: { type: String, required: true },
    status: { type: String, required: true },
    message: { type: String, default: '' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const matchAuditSchema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true, trim: true, index: true },
    steps: { type: [auditStepSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MatchAudit', matchAuditSchema);
