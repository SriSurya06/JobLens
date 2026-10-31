const Notification = require('../models/Notification');
const { sendBulkEmails } = require('./email.service');

/**
 * Send an in-app notification and email to specific students.
 *
 * @param {Object} options
 * @param {String} options.subject
 * @param {String} options.message
 * @param {String} options.type
 * @param {Array} options.students
 * @param {Object} options.drive
 * @param {Object} options.round
 * @param {ObjectId} options.sentBy
 */
const notifyStudents = async ({
  subject,
  message,
  type,
  students = [],
  drive = null,
  round = null,
  sentBy,
}) => {
  if (!students.length) {
    return null;
  }

  // ---------------------------------------------------------
  // Get student IDs
  // ---------------------------------------------------------
  const recipientStudents = students
    .map((student) => student?._id)
    .filter(Boolean);

  // ---------------------------------------------------------
  // Get valid college email addresses
  // ---------------------------------------------------------
  const emails = students
    .map((student) => student?.collegeEmail)
    .filter(
      (email) =>
        typeof email === 'string' &&
        email.trim().length > 0
    )
    .map((email) => email.trim());

  // ---------------------------------------------------------
  // Send emails
  // ---------------------------------------------------------
  let emailSent = false;

  if (emails.length > 0) {
    try {
      const emailResult = await sendBulkEmails({
        to: emails,
        subject,
        text: message,
      });

      emailSent = emailResult.sent > 0;

      console.log(
        `[Notification] Email delivery: ${emailResult.sent} sent, ${emailResult.failed} failed: ${subject}`
      );
    } catch (error) {
      console.error(
        `[Notification] Email dispatch failed: ${error.message}`
      );
    }
  }

  // ---------------------------------------------------------
  // Create in-app notification
  // ---------------------------------------------------------
  const notification = await Notification.create({
    subject,
    message,
    type,

    drive: drive?._id || drive || null,
    round: round?._id || round || null,

    recipientStudents,

    sentBy,

    emailSent,

    recipientCount: recipientStudents.length,
  });

  console.log(
    `[Notification] In-app notification created for ${recipientStudents.length} student(s)`
  );

  return notification;
};

module.exports = {
  notifyStudents,
};