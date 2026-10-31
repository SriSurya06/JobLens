const { ApiError } = require('../utils/ApiResponse');
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;
  // Mongoose bad ObjectId (e.g. invalid _id format)
  if (err.name === 'CastError')
    error = new ApiError(400, `Invalid ID format: "${err.value}"`);
  // MongoDB duplicate key (unique index violation)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue?.[field] || '';
    error = new ApiError(409, `Duplicate value "${value}" for field "${field}". Use a different value.`);
  }
  // Mongoose schema validation error
  if (err.name === 'ValidationError') {
    const msgs = Object.values(err.errors).map((e) => e.message);
    error = new ApiError(400, 'Validation failed', msgs);
  }
  const statusCode = error.statusCode || 500;
  const message    = error.message    || 'Internal Server Error';
  return res.status(statusCode).json({
    success:    false,
    statusCode,
    message,
    errors:     error.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
module.exports = { errorHandler };
