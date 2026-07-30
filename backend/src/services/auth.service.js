const config = require('../config/config');

async function login(_credentials) {
  return { token: config.authToken };
}

module.exports = { login };
