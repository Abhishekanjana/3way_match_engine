const catchAsync = require('../utils/catchAsync');
const authService = require('../services/auth.service');

const login = catchAsync(async (_req, res) => {
  const result = await authService.login();
  res.json(result);
});

module.exports = { login };
