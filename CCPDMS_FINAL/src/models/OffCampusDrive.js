const mongoose = require('mongoose');
const offCampusDriveSchema = new mongoose.Schema(
  {
    companyName:  { type: String, required: true, trim: true },
    // role:        { type: String, required: true, trim: true },
    driveName:    { type: String, required: true },
    driveCategory:{
      type: String,
      enum: ['internship', 'hackathon', 'job', 'other'],
      required: true,
    },
    eligibleBatches:  { type: [Number], required: true },
    eligibleBranches: { type: [String], required: true },
    description:     { type: String },
    applyLink:       { type: String, required: true },
    lastDateToApply: { type: Date },
    appliedCount:  { type: Number, default: 0 },
    selectedCount: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: true },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
offCampusDriveSchema.index({ eligibleBatches: 1 });
offCampusDriveSchema.index({ eligibleBranches: 1 });
offCampusDriveSchema.index({ driveCategory: 1 });
offCampusDriveSchema.index({ publishedAt: -1 });
module.exports = mongoose.model('OffCampusDrive', offCampusDriveSchema);