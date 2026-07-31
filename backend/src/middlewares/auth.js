import ApiError from '../utils/ApiError.js';
import config from '../config/config.js';

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

export default auth;
