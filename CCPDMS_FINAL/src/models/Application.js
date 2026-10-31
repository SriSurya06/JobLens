const mongoose = require('mongoose');
const roundStatusSchema = new mongoose.Schema({
  round:       { type: mongoose.Schema.Types.ObjectId, ref: 'Round' },
  roundNumber: Number,
  roundName:   String,
  status: {
    type: String,
    enum: ['eligible', 'attended', 'qualified', 'not_attended', 'not_qualified'],
  },
}, { _id: false });
const applicationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    drive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OnCampusDrive',
      required: true,
    },
    overallStatus: {
      type: String,
      enum: ['registered', 'shortlisted', 'in_progress', 'selected', 'rejected', 'not_shortlisted'],
      default: 'registered',
    },
    roundStatuses:    [roundStatusSchema],
    eliminatedAtRound:{ type: Number },
    feedbackSubmitted:{ type: Boolean, default: false },
    appliedAt:        { type: Date, default: Date.now },
    resumeSnapshot:   { type: String },
  },
  { timestamps: true }
);
applicationSchema.index({ student: 1, drive: 1 }, { unique: true });
applicationSchema.index({ drive: 1, overallStatus: 1 });
applicationSchema.index({ student: 1, overallStatus: 1 });
module.exports = mongoose.model('Application', applicationSchema);
