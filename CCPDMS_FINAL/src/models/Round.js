const mongoose = require('mongoose');
const listSchema = new mongoose.Schema({
  fileUrl:     String,
  rollNumbers: [String],
  uploadedAt:  Date,
}, { _id: false });
const roundSchema = new mongoose.Schema(
  {
    drive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OnCampusDrive',
      required: true,
    },
    roundNumber: { type: Number, required: true },
    roundName:   { type: String, required: true },

mode: {
  type: String,
  enum: ['online', 'offline'],
  default: 'online',
},

venue: {
  type: String,
  required: function () {
    return this.mode === 'offline';
  },
},
    date:        { type: Date },
    description: { type: String },
    eligibleList:  listSchema,
    attendedList:  listSchema,
    qualifiedList: listSchema,
    isFinalRound:     { type: Boolean, default: false },
    eligibleEmailSent:{ type: Boolean, default: false },
    resultEmailSent:  { type: Boolean, default: false },
  },
  { timestamps: true }
);
roundSchema.index({ drive: 1, roundNumber: 1 }, { unique: true });
module.exports = mongoose.model('Round', roundSchema);