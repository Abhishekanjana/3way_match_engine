import catchAsync from '../utils/catchAsync.js';
import * as summaryService from '../services/summary.service.js';

const getByPoNumber = catchAsync(async (req, res) => {
  const result = await summaryService.getSummaryByPoNumber(req.params.poNumber);
  res.json(result);
});

export { getByPoNumber };
