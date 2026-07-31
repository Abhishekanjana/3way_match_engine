import MatchAudit from '../models/MatchAudit.js';

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

export { getAuditByPoNumber };
