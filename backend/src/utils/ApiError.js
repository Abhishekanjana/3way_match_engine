class ApiError extends Error {
  constructor(statusCode, code, message, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
  }
}

module.exports = ApiError;
