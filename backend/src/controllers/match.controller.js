import catchAsync from '../utils/catchAsync.js';
import * as matchService from '../services/match.service.js';
import * as auditService from '../services/audit.service.js';

const getByPoNumber = catchAsync(async (req, res) => {
  const result = await matchService.getMatchByPoNumber(req.params.poNumber);
  res.json(result);
});

const getAuditByPoNumber = catchAsync(async (req, res) => {
  const result = await auditService.getAuditByPoNumber(req.params.poNumber);
  res.json(result);
});

export { getByPoNumber, getAuditByPoNumber };
