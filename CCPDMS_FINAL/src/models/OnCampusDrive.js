const mongoose = require('mongoose');
const onCampusDriveSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    role:        { type: String, required: true, trim: true },
    eligibleBatches:  { type: [Number], required: true },
    eligibleBranches: { type: [String], required: true },
    cgpaCutOff:       { type: Number, required: true, min: 0, max: 10 },
    backlogsAllowed:  { type: Number, required: true, default: 0 },
    description:         { type: String },
    minPackage:          { type: Number },   // LPA
    maxPackage:          { type: Number },   // LPA
    documentUrl: { type: String },

// Optional coordinator-provided eligibility student list
eligibilityListUrl: { type: String },
eligibleStudentRollNumbers: {
  type: [String],
  default: [],
},
registrationDeadline:{ type: Date },
    registrationLink:    { type: String },
    status: {
      type: String,
      enum: ['active', 'completed', 'frozen'],
      default: 'active',
    },
    eligibleStudentsCount: { type: Number, default: 0 },
    selectedStudentsCount: { type: Number, default: 0 },
    selectionRatio:        { type: String },
    isFrozen:              { type: Boolean, default: false },
    rounds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Round' }],
    createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    publishedAt:   { type: Date, default: Date.now },
  },
  { timestamps: true }
);
onCampusDriveSchema.index({ eligibleBatches: 1 });
onCampusDriveSchema.index({ eligibleBranches: 1 });
onCampusDriveSchema.index({ companyName: 1 });
onCampusDriveSchema.index({ status: 1 });
onCampusDriveSchema.index({ createdAt: -1 });
module.exports = mongoose.model('OnCampusDrive', onCampusDriveSchema);