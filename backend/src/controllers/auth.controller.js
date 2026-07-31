import catchAsync from '../utils/catchAsync.js';
import * as authService from '../services/auth.service.js';

const login = catchAsync(async (_req, res) => {
  const result = await authService.login();
  res.json(result);
});

export { login };
