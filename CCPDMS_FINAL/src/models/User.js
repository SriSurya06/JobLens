const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'coordinator'],
      required: true,
    },
    isFirstLogin: { type: Boolean, default: true },
    isActive:     { type: Boolean, default: true },
    passwordResetOTP:     { type: String, select: false },
    passwordResetExpires: { type: Date,   select: false },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};
module.exports = mongoose.model('User', userSchema);