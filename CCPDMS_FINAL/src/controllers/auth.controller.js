const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const { ApiResponse, ApiError } = require('../utils/ApiResponse');
const { sendOTPEmail } = require('../services/email.service');
const asyncHandler = require('../utils/asyncHandler');

// ── Sign JWT 
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
// POST /api/auth/login
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new ApiError(400, 'Email and password are required'));
  // password field is select:false
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(password)))
    return next(new ApiError(401, 'Invalid email or password'));
  if (!user.isActive)
    return next(new ApiError(403, 'Account is deactivated. Contact the placement coordinator.'));
  // Update last login timestamp
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });
  const token = signToken(user._id);
  // Attach student profile for student role
  let profile = null;
  if (user.role === 'student') {
    profile = await Student.findOne({ user: user._id });
  }
  res.status(200).json(
    new ApiResponse(200, {
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isFirstLogin: user.isFirstLogin,
      },
      profile,
    }, 'Login successful')
  );
});
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword)
    return next(new ApiError(400, 'Both currentPassword and newPassword are required'));
  if (newPassword.length < 8)
    return next(new ApiError(400, 'New password must be at least 8 characters'));
  if (currentPassword === newPassword)
    return next(new ApiError(400, 'New password must be different from the current password'));

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword)))
    return next(new ApiError(401, 'Current password is incorrect'));

  user.password = newPassword; // pre-save hook will hash it
  user.isFirstLogin = false;
  await user.save();

  res.status(200).json(new ApiResponse(200, null, 'Password changed successfully. Please log in again.'));
});
// POST /api/auth/forgot-password
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new ApiError(400, 'Email is required'));
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  // Respond generically to prevent email enumeration attacks
  if (!user) {
    return res.status(200).json(
      new ApiResponse(200, null, 'If that email exists in our system, an OTP has been sent')
    );
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  user.passwordResetOTP = otp;
  user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save({ validateBeforeSave: false });
  await sendOTPEmail(user.email, otp);
  res.status(200).json(
    new ApiResponse(200, null, 'OTP sent to your registered email address. Valid for 10 minutes.')
  );
});
// POST /api/auth/reset-password
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword)
    return next(new ApiError(400, 'email, otp, and newPassword are all required'));
  if (newPassword.length < 8)
    return next(new ApiError(400, 'Password must be at least 8 characters'));
  // Find user whose OTP has not expired
  const user = await User.findOne({
    email: email.toLowerCase().trim(),
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetOTP +passwordResetExpires');
  if (!user || user.passwordResetOTP !== otp)
    return next(new ApiError(400, 'OTP is invalid or has expired. Please request a new one.'));
  user.password = newPassword; // pre-save hook hashes it
  user.isFirstLogin = false;
  user.passwordResetOTP = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.status(200).json(
    new ApiResponse(200, null, 'Password reset successful. Please log in with your new password.')
  );
});
// GET /api/auth/me  (protected)
exports.getMe = asyncHandler(async (req, res) => {
  let profile = null;
  if (req.user.role === 'student') {
    profile = await Student.findOne({ user: req.user._id });
  }
  res.status(200).json(
    new ApiResponse(200, {
      user: {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role,
        isFirstLogin: req.user.isFirstLogin,
        lastLogin: req.user.lastLogin,
        isActive: req.user.isActive,
      },
      profile,
    })
  );
});
