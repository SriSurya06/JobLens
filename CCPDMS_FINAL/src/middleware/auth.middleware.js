const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const { ApiError } = require('../utils/ApiResponse');
const protect = async (req, res, next) => {
  try {
    // 1. Extract token from Authorization header
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token)
      return next(new ApiError(401, 'Not authenticated. Please log in.'));
    // 2. Verify signature + expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // 3. Ensure account still exists and is active
    const user = await User.findById(decoded.id);
    if (!user)       return next(new ApiError(401, 'User account no longer exists.'));
    if (!user.isActive) return next(new ApiError(403, 'Account is deactivated. Contact admin.'));
    // 4. Force password change on first login (skip only for change-password route)
    if (user.isFirstLogin && !req.originalUrl.includes('/change-password')) {
      return next(
        new ApiError(403, 'Please change your default password before continuing.', [
          { code: 'FIRST_LOGIN' },
        ])
      );
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError')
      return next(new ApiError(401, 'Invalid token. Please log in again.'));
    if (err.name === 'TokenExpiredError')
      return next(new ApiError(401, 'Session expired. Please log in again.'));
    next(err);
  }
};
module.exports = { protect };
