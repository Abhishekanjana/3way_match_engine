const MatchAudit = require('../models/MatchAudit');

async function getAuditByPoNumber(poNumber) {
  const audit = await MatchAudit.findOne({ poNumber }).lean();

  if (!audit) {
    return { poNumber, steps: [] };
  }

  return {
    poNumber,
    steps: audit.steps ?? [],
  };
}

module.exports = { getAuditByPoNumber };
