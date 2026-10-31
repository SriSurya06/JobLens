class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.success    = statusCode < 400;
    this.statusCode = statusCode;
    this.message    = message;
    this.data       = data;
  }
}
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors     = errors;
    this.success    = false;
    Error.captureStackTrace(this, this.constructor);
  }
}
module.exports = { ApiResponse, ApiError };