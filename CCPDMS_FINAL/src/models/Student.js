const mongoose = require('mongoose');
const educationEntrySchema = new mongoose.Schema({
  institutionName:  { type: String },
  percentage:       { type: Number },
  cgpa:             { type: Number },
  yearOfCompletion: { type: Number },
}, { _id: false });
const projectSchema = new mongoose.Schema({
  title:       String,
  description: String,
  techStack:   [String],
  link:        String,
}, { _id: false });
const internshipSchema = new mongoose.Schema({
  company:     String,
  role:        String,
  duration:    String,
  description: String,
}, { _id: false });
const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    rollNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name:          { type: String, required: true },
    passedOutYear: { type: Number, required: true },
    branch: {
      type: String,
      required: true,
      enum: ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML', 'DS'],
    },
    collegeEmail:  { type: String, required: true },
    personalEmail: { type: String },
    contact:       { type: String },
    address:       { type: String },

    cgpa:           { type: Number, required: true, min: 0, max: 10 },
    activeBacklogs: { type: Number, default: 0 },
    totalBacklogs:  { type: Number, default: 0 },

    education: {
      btech:        educationEntrySchema,
      intermediate: educationEntrySchema,
      secondary:    educationEntrySchema,
    },
    skills:               [String],
    projects:             [projectSchema],
    internships:          [internshipSchema],
    certifications:       [String],
    academicAchievements: [String],
    codingProfiles: {
      github:    String,
      leetcode:  String,
      hackerrank:String,
      others:    [String],
    },
    profileSummary: { type: String },
    resume: {
      url:        String,
      uploadedAt: Date,
    },
    lastResumeReminderSent: Date,
    stats: {
      drivesApplied:  { type: Number, default: 0 },
      drivesSelected: { type: Number, default: 0 },
      drivesRejected: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);
studentSchema.index({ passedOutYear: 1, branch: 1 });
studentSchema.index({ cgpa: 1 });
module.exports = mongoose.model('Student', studentSchema);