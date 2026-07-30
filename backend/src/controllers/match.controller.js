const catchAsync = require('../utils/catchAsync');
const matchService = require('../services/match.service');

const getByPoNumber = catchAsync(async (req, res) => {
  const result = await matchService.getMatchByPoNumber(req.params.poNumber);
  res.json(result);
});

module.exports = { getByPoNumber };
