const mongoose = require('mongoose');
/**
 * Stores each job-authenticity check made by a student.
 * Enables a "check history" view and usage analytics for coordinators.
 */
const jobVerificationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // ── Input ───────────
    companyName: { type: String, trim: true },
    jobLink: { type: String, trim: true },
    jobDescription: { type: String, trim: true },
    // ── Result ──────
    verdict: {
      type: String,
      enum: ['LIKELY LEGITIMATE', 'SUSPICIOUS', 'LIKELY SCAM', 'UNKNOWN'],
      default: 'UNKNOWN',
    },
    riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'UNKNOWN'], default: 'UNKNOWN' },
    overallScore: { type: Number, min: 0, max: 100 },
    redFlags: [{ type: String }],
    greenFlags: [{ type: String }],
    aiAnalysis: { type: String },
    scoreBreakdown: {
      heuristic: { type: Number },
      urlSafety: { type: Number },
      ai: { type: Number },
    },
    urlSafetyResult: {
      safe: { type: Boolean },
      domain: { type: String },
      threats: [{ type: String }],
    },
    // ── Meta ─────────────────────────────────────────────────────────────────
    checkedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
// Auto-expire old records after 90 days to save storage
jobVerificationSchema.index({ checkedAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });
module.exports = mongoose.model('JobVerification', jobVerificationSchema);