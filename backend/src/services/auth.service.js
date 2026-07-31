import config from '../config/config.js';

async function login(_credentials) {
  return { token: config.authToken };
}

export { login };
