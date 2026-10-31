const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
    },

    // Notification category
    type: {
      type: String,
      enum: [
        'ANNOUNCEMENT',
        'DRIVE_POSTED',
        'ROUND_ELIGIBLE',
        'ROUND_RESULT',
        'ROUND_ATTENDANCE',
        'FINAL_RESULT',
        'DEADLINE_REMINDER',
      ],
      default: 'ANNOUNCEMENT',
    },

    // Related drive, when notification is drive-specific
    drive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OnCampusDrive',
      default: null,
    },

    // Related round, when notification is round-specific
    round: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Round',
      default: null,
    },

    // Specific students who should receive this notification
    recipientStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],

    // Existing audience filters — kept for general announcements
    // null/undefined means "all"
    batch: {
      type: Number,
      default: null,
    },

    branch: {
      type: String,
      default: null,
      enum: [
        'CSE',
        'ECE',
        'EEE',
        'MECH',
        'CIVIL',
        'IT',
        'AIDS',
        'AIML',
        'DS',
        null,
      ],
    },

    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Students who have marked this notification as read
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],

    // Whether an email was intended/sent for this notification
    emailSent: {
      type: Boolean,
      default: false,
    },

    // Number of students who received the notification
    recipientCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ createdAt: -1 });

notificationSchema.index({
  recipientStudents: 1,
  createdAt: -1,
});

notificationSchema.index({
  drive: 1,
  round: 1,
});

module.exports = mongoose.model('Notification', notificationSchema);