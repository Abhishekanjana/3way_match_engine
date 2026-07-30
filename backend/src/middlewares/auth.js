const ApiError = require('../utils/ApiError');
const config = require('../config/config');

function auth(req, _res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'UNAUTHORIZED', 'Missing or invalid authorization header'));
  }

  const token = header.slice('Bearer '.length);

  if (token !== config.authToken) {
    return next(new ApiError(401, 'UNAUTHORIZED', 'Invalid token'));
  }

  return next();
}

module.exports = auth;
