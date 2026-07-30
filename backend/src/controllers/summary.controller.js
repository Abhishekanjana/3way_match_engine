const catchAsync = require('../utils/catchAsync');
const summaryService = require('../services/summary.service');

const getByPoNumber = catchAsync(async (req, res) => {
  const result = await summaryService.getSummaryByPoNumber(req.params.poNumber);
  res.json(result);
});

module.exports = { getByPoNumber };
