const { ApiError } = require('../utils/ApiResponse');
/**
 * Restrict a route to one or more roles.
 * Usage:  authorize('coordinator')
 *         authorize('student', 'coordinator')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(
      new ApiError(403, `Access denied. Required role: ${roles.join(' or ')}.`)
    );
  }
  next();
};
module.exports = { authorize };
