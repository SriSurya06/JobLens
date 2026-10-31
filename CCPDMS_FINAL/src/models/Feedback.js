const mongoose = require('mongoose');
const roundExpSchema = new mongoose.Schema({
  roundName:   String,
  description: String,
  challenges:  String,
}, { _id: false });
const feedbackSchema = new mongoose.Schema(
  {
    driveRef: {
      driveId:   { type: mongoose.Schema.Types.ObjectId, required: true },
      driveType: { type: String, enum: ['on-campus', 'off-campus'], required: true },
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      select: false,   // NEVER returned via API
    },
    companyName:  { type: String, required: true },
    role:         { type: String },
    passedOutYear:{ type: Number },
    rounds:       [roundExpSchema],
    outcome: {
      type: String,
      enum: ['selected', 'rejected'],
    },
  },
  { timestamps: true }
);
feedbackSchema.index({ student: 1, 'driveRef.driveId': 1 }, { unique: true });
feedbackSchema.index({ 'driveRef.driveId': 1 });
feedbackSchema.index({ companyName: 1 });
module.exports = mongoose.model('Feedback', feedbackSchema);