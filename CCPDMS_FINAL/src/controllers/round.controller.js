const path = require('path');
const Round = require('../models/Round');
const OnCampusDrive = require('../models/OnCampusDrive');
const Application = require('../models/Application');
const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');
const { parseRollNumbers } = require('../utils/excelParser');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const {
  notifyStudents,
} = require('../services/notification.service');
const {
  extractRoundResultRollNumbers,
} = require('../services/round-result.service');
const { sendBulkEmails } = require('../services/email.service');
const { ApiResponse, ApiError } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const normalizeRollNumber = (value) =>
  String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
    const getLogicalRoundNumber = async (driveId, roundId) => {
  const rounds = await Round.find({ drive: driveId })
    .sort({ roundNumber: 1 })
    .select('_id');

  const index = rounds.findIndex(
    (r) => String(r._id) === String(roundId)
  );

  return index >= 0 ? index + 1 : null;
};
// Helper — given a list of roll numbers, return a Map of roll → Student doc
const rollToStudentMap = async (rollNumbers) => {
  const students = await Student.find({ rollNumber: { $in: rollNumbers } })
    .select('_id rollNumber collegeEmail name');
  const map = new Map();
  students.forEach((s) => map.set(s.rollNumber, s));
  return map;
};
// POST /api/rounds  — Create a new round for an on-campus drive
exports.createRound = asyncHandler(async (req, res, next) => {
  const {
  driveId,
  roundName,
  mode,
  venue,
  date,
  description,
} = req.body;
 if (!['online', 'offline'].includes(mode || 'online')) {
    return next(
      new ApiError(400, 'Mode must be either online or offline')
    );
  }

  if ((mode || 'online') === 'offline' && !venue?.trim()) {
    return next(
      new ApiError(400, 'Venue is required for offline rounds')
    );
  }
  if (!driveId || !roundName)
    return next(new ApiError(400, 'driveId and roundName are required'));
  const drive = await OnCampusDrive.findById(driveId);
  if (!drive) return next(new ApiError(404, 'On-campus drive not found'));
const roundNumber = drive.rounds.length + 1;
  const round = await Round.create({
  drive: driveId,
  roundNumber,
  roundName,
  mode: mode || 'online',
  venue: mode === 'offline' ? venue : undefined,
  date,
  description,
});
  // Push round reference to drive
  drive.rounds.push(round._id);
  await drive.save();
  await AuditLog.create({
    user: req.user._id, action: 'ROUND_CREATED',
    entity: 'Round', entityId: round._id,
    details: { driveId, companyName: drive.companyName, roundNumber, roundName }, ip: req.ip,
  });
  res.status(201).json(
    new ApiResponse(201, round, `Round ${roundNumber} (${roundName}) created for ${drive.companyName}`)
  );
});
// PATCH /api/rounds/:id  — Update venue / date / description of a round
exports.updateRound = asyncHandler(async (req, res, next) => {
  const round = await Round.findById(req.params.id).populate(
    'drive',
    'isFrozen companyName'
  );

  if (!round) {
    return next(new ApiError(404, 'Round not found'));
  }

  const {
    roundName,
    mode,
    venue,
    date,
    description,
  } = req.body;

  const nextMode = mode || round.mode || 'online';

  if (!['online', 'offline'].includes(nextMode)) {
    return next(
      new ApiError(
        400,
        'Mode must be either online or offline'
      )
    );
  }

  if (nextMode === 'offline' && !venue?.trim()) {
    return next(
      new ApiError(
        400,
        'Venue is required for offline rounds'
      )
    );
  }

  if (roundName !== undefined) {
    if (!roundName.trim()) {
      return next(
        new ApiError(400, 'Round name is required')
      );
    }

    round.roundName = roundName.trim();
  }

  round.mode = nextMode;

  if (nextMode === 'offline') {
    round.venue = venue.trim();
  } else {
    round.venue = undefined;
  }

  if (date !== undefined) {
    round.date = date ? new Date(date) : undefined;
  }

  if (description !== undefined) {
    round.description = description;
  }

  await round.save();
  await Application.updateMany(
  {
    drive: round.drive._id,
    'roundStatuses.roundNumber': round.roundNumber,
  },
  {
    $set: {
      'roundStatuses.$.round': round._id,
      'roundStatuses.$.roundName': round.roundName,
      'roundStatuses.$.mode': round.mode,
      'roundStatuses.$.venue': round.venue,
      'roundStatuses.$.date': round.date,
      'roundStatuses.$.description': round.description,
    },
  }
);
await OnCampusDrive.findByIdAndUpdate(
  round.drive._id,
  {
    lastUpdatedBy: req.user._id
  }
);
  await AuditLog.create({
    user: req.user._id,
    action: 'ROUND_UPDATED',
    entity: 'Round',
    entityId: round._id,
    details: {
      roundName: round.roundName,
      mode: round.mode,
      venue: round.venue,
      date: round.date,
      description: round.description,
    },
    ip: req.ip,
  });

  res.status(200).json(
    new ApiResponse(
      200,
      round,
      'Round updated successfully'
    )
  );
});
// GET /api/rounds/drive/:driveId  — All rounds for a drive, ordered by roundNumber
exports.getRoundsByDrive = asyncHandler(async (req, res, next) => {
  const rounds = await Round.find({ drive: req.params.driveId }).sort({ roundNumber: 1 });
  res.status(200).json(new ApiResponse(200, rounds));
});
// PATCH /api/rounds/:id/eligible-list
// Upload Excel → parse roll numbers → update Application statuses → send emails
// Logic:
//  Round 1: registered → shortlisted (if in list) | not_shortlisted (if not in list)
//  Round N>1: in_progress students in list → add eligible roundStatus entry
// PATCH /api/rounds/:id/eligible-list
// Upload eligibility list → update application statuses
// → automatically notify eligible students
exports.uploadEligibleList = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(
      new ApiError(
        400,
        'Eligibility file (.xlsx, .xls, or .pdf) is required'
      )
    );
  }

  const round = await Round.findById(req.params.id).populate('drive');

  if (!round) {
    return next(new ApiError(404, 'Round not found'));
  }

  // Parse roll numbers from the uploaded file
  let rollNumbers;

  try {
    rollNumbers = await extractRoundResultRollNumbers({
      filePath: req.file.path,
    });
  } catch (err) {
    return next(
      new ApiError(
        400,
        `Eligibility list parsing failed: ${err.message}`
      )
    );
  }

  if (!rollNumbers.length) {
    return next(
      new ApiError(
        400,
        'No valid student roll numbers were found'
      )
    );
  }
rollNumbers = [
  ...new Set(
    rollNumbers
      .map(normalizeRollNumber)
      .filter(Boolean)
  )
];
  // Save eligible list
  round.eligibleList = {
    fileUrl: `/uploads/round-results/${req.file.filename}`,
    rollNumbers,
    uploadedAt: new Date(),
  };

  await round.save();

  // Fetch all applications for this drive
  const allApps = await Application.find({
    drive: round.drive._id,
  }).populate(
    'student',
    'rollNumber collegeEmail name _id'
  );

  const eligibleStudents = [];
  const bulkOps = [];

  for (const app of allApps) {
    const student = app.student;

    if (!student) continue;

    const inList = rollNumbers.includes(
  normalizeRollNumber(student.rollNumber)
);

    // =========================================================
// LOGICAL ROUND NUMBER
// =========================================================
const logicalRoundNumber = await getLogicalRoundNumber(
  round.drive._id,
  round._id
);

// =========================================================
// ROUND 1
// =========================================================
if (logicalRoundNumber === 1) {
      if (inList) {
        // Student is eligible for Round 1
        eligibleStudents.push(student);

        bulkOps.push({
          updateOne: {
            filter: {
              _id: app._id,
            },
            update: {
              $set: {
                overallStatus: 'shortlisted',
              },
              $unset: {
                eliminatedAtRound: '',
              },
              $push: {
                roundStatuses: {
                  round: round._id,
                  roundNumber: round.roundNumber,
                  roundName: round.roundName,
                  status: 'eligible',
                },
              },
            },
          },
        });
      } else {
        // Student is not eligible for Round 1
        bulkOps.push({
          updateOne: {
            filter: {
              _id: app._id,
            },
            update: {
              $set: {
                overallStatus: 'not_shortlisted',
                eliminatedAtRound: round.roundNumber,
              },
            },
          },
        });

        await Student.findByIdAndUpdate(
          student._id,
          {
            $inc: {
              'stats.drivesRejected': 1,
            },
          }
        );
      }

      continue;
    }

    // =========================================================
    // ROUND 2+
    // =========================================================

    // Only students who are still progressing
    // should be considered for the next round.
    if (app.overallStatus !== 'in_progress') {
      continue;
    }

 if (inList) {
  eligibleStudents.push(student);

  const existingRoundStatus = app.roundStatuses.find(
    (rs) => rs.roundNumber === round.roundNumber
  );

  if (existingRoundStatus) {
    bulkOps.push({
      updateOne: {
        filter: {
          _id: app._id,
          'roundStatuses.roundNumber': round.roundNumber,
        },
        update: {
          $set: {
            'roundStatuses.$.status': 'eligible',
            overallStatus: 'in_progress',
          },
          $unset: {
            eliminatedAtRound: '',
          },
        },
      },
    });
  } else {
    bulkOps.push({
      updateOne: {
        filter: {
          _id: app._id,
        },
        update: {
          $set: {
            overallStatus: 'in_progress',
          },
          $unset: {
            eliminatedAtRound: '',
          },
          $push: {
            roundStatuses: {
              round: round._id,
              roundNumber: round.roundNumber,
              roundName: round.roundName,
              status: 'eligible',
            },
          },
        },
      },
    });
  }
}
  }

  // Apply application status updates
  if (bulkOps.length) {
    await Application.bulkWrite(bulkOps);
  }

  // =========================================================
  // AUTOMATIC NOTIFICATION
  // =========================================================

  if (
    eligibleStudents.length > 0 &&
    !round.eligibleEmailSent
  ) {
    await notifyStudents({
      subject: `[${round.drive.companyName}] Eligible for ${round.roundName}`,
      message:
        `Dear Student,\n\n` +
        `Congratulations! You are eligible for ` +
        `${round.roundName} at ${round.drive.companyName}.\n\n` +
        `Round Details:\n` +
        `Venue: ${round.venue || 'To be announced'}\n` +
        `Date: ${
          round.date
            ? round.date.toDateString()
            : 'To be announced'
        }\n` +
        `Information: ${
          round.description ||
          'Check the placement portal for further updates.'
        }\n\n` +
        `Please check the placement portal regularly for updates.\n\n` +
        `Best of luck!\n` +
        `— Placement Cell`,
      type: 'ROUND_ELIGIBLE',
      students: eligibleStudents,
      drive: round.drive,
      round,
      sentBy: req.user._id,
    });

    round.eligibleEmailSent = true;
    await round.save();
  }

  // =========================================================
  // AUDIT LOG
  // =========================================================

  await AuditLog.create({
    user: req.user._id,
    action: 'ELIGIBLE_LIST_UPLOADED',
    entity: 'Round',
    entityId: round._id,
    details: {
      roundName: round.roundName,
      count: rollNumbers.length,
      eligibleCount: eligibleStudents.length,
      eliminatedCount:
        allApps.filter((app) => {
          if (!app.student) return false;

          const inList = rollNumbers.includes(
            String(app.student.rollNumber)
              .trim()
              .toUpperCase()
          );

          return !inList;
        }).length,
    },
    ip: req.ip,
  });

  // =========================================================
  // RESPONSE
  // =========================================================

  res.status(200).json(
    new ApiResponse(
      200,
      {
        parsedRollNumbers: rollNumbers,
        parsedCount: rollNumbers.length,
        eligibleCount: eligibleStudents.length,
        notificationSent: eligibleStudents.length > 0,
      },
      'Eligibility list uploaded and eligible students notified'
    )
  );
});
// PATCH /api/rounds/:id/attended-list
// Upload Excel → mark roundStatus as 'attended' | 'not_attended'
exports.uploadAttendedList = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new ApiError(400, 'Excel file is required'));

  const round = await Round.findById(req.params.id).populate('drive', 'isFrozen companyName _id');
  if (!round) return next(new ApiError(404, 'Round not found'));
  let rollNumbers;
try {
  rollNumbers = await extractRoundResultRollNumbers({
    filePath: req.file.path
  });
  } catch (err) {
    return next(new ApiError(400, `Excel parsing failed: ${err.message}`));
  }
  rollNumbers = [
  ...new Set(
    rollNumbers
      .map(normalizeRollNumber)
      .filter(Boolean)
  )
];
  round.attendedList = {
    fileUrl: `/uploads/round-results/${req.file.filename}`,
    rollNumbers,
    uploadedAt: new Date(),
  };
  await round.save();
  const bulkOps = [];
  const attendedStudents = [];
  const notAttendedStudents = [];
  // Mark 'attended' for students who are in the list
  for (const roll of rollNumbers) {
    const student = await Student.findOne({ rollNumber: roll })
      .select('_id rollNumber collegeEmail name');
    if (!student) continue;
    attendedStudents.push(student);
    bulkOps.push({
      updateOne: {
        filter: { student: student._id, drive: round.drive._id, 'roundStatuses.roundNumber': round.roundNumber },
        update: { $set: { 'roundStatuses.$.status': 'attended' } },
      },
    });
  }
  // Mark 'not_attended' for students who were eligible but absent
  const eligibleRolls = round.eligibleList?.rollNumbers || [];
  const notAttendedRolls = eligibleRolls.filter((r) => !rollNumbers.includes(r));
  for (const roll of notAttendedRolls) {
    const student = await Student.findOne({ rollNumber: roll })
      .select('_id rollNumber collegeEmail name');
    if (!student) continue;
    notAttendedStudents.push(student);
    bulkOps.push({
      updateOne: {
        filter: { student: student._id, drive: round.drive._id, 'roundStatuses.roundNumber': round.roundNumber },
        update: { $set: { 'roundStatuses.$.status': 'not_attended' } },
      },
    });
  }
  if (bulkOps.length) await Application.bulkWrite(bulkOps);

  if (attendedStudents.length > 0) {
    await notifyStudents({
      subject: `[${round.drive.companyName}] ${round.roundName} Attendance Recorded`,
      message:
        `Dear Student,\n\n` +
        `Your attendance for ${round.roundName} at ${round.drive.companyName} has been recorded.\n\n` +
        `Please check the placement portal for the next update.\n\n` +
        `Best wishes,\n— Placement Cell`,
      type: 'ROUND_ATTENDANCE',
      students: attendedStudents,
      drive: round.drive,
      round,
      sentBy: req.user._id,
    });
  }

  if (notAttendedStudents.length > 0) {
    await notifyStudents({
      subject: `[${round.drive.companyName}] ${round.roundName} Attendance Update`,
      message:
        `Dear Student,\n\n` +
        `Our records show that you were not marked present for ${round.roundName} at ${round.drive.companyName}.\n\n` +
        `Please check the placement portal for further updates.\n\n` +
        `Best wishes,\n— Placement Cell`,
      type: 'ROUND_ATTENDANCE',
      students: notAttendedStudents,
      drive: round.drive,
      round,
      sentBy: req.user._id,
    });
  }

  await AuditLog.create({
    user: req.user._id, action: 'ATTENDED_LIST_UPLOADED',
    entity: 'Round', entityId: round._id,
    details: { roundName: round.roundName, attendedCount: rollNumbers.length, notAttendedCount: notAttendedRolls.length },
    ip: req.ip,
  });

  res.status(200).json(
    new ApiResponse(200, {
      attendedCount: rollNumbers.length,
      notAttendedCount: notAttendedRolls.length,
    }, 'Attended list uploaded and statuses updated')
  );
});
// PATCH /api/rounds/:id/qualified-list
// Upload qualified Excel + isFinalRound flag.
// Logic per student:
//  • In list → qualified + (in_progress | selected if final)
//  • Not in list → not_qualified + rejected + eliminatedAtRound
// If isFinalRound=true → freeze drive, compute selectionRatio, send SELECTED emails
exports.uploadQualifiedList = asyncHandler(async (req, res, next) => {
  const isFinalRound =
    req.body.isFinalRound === 'true' ||
    req.body.isFinalRound === true;

  const round = await Round.findById(req.params.id).populate('drive');

  if (!round) {
    return next(new ApiError(404, 'Round not found'));
  }

  let rollNumbers;

  try {
    rollNumbers = await extractRoundResultRollNumbers({
      filePath: req.file?.path,
      text: req.body.rollNumbers,
    });
  } catch (err) {
    return next(
      new ApiError(
        400,
        `Result list parsing failed: ${err.message}`
      )
    );
  }

  if (!rollNumbers.length) {
    return next(
      new ApiError(
        400,
        'No valid student roll numbers were found'
      )
    );
  }
 round.qualifiedList = {
  fileUrl: req.file
    ? `/uploads/round-results/${req.file.filename}`
    : undefined,
  rollNumbers,
  uploadedAt: new Date(),
};
  round.isFinalRound = isFinalRound;
  await round.save();
  const driveRounds = await Round.find({ drive: round.drive._id })
    .sort({ roundNumber: 1 })
    .select('_id');
  const isFirstRound = String(driveRounds[0]?._id) === String(round._id);
  // Include progressing applications even when this round has no status entry
  // yet. Final-round uploads must create that status before publishing results.
const affectedApps = await Application.find({
  drive: round.drive._id,
  $or: [
    { 'roundStatuses.round': round._id },
    { overallStatus: 'in_progress' },
    ...(isFirstRound
      ? [{ overallStatus: { $in: ['registered', 'shortlisted'] } }]
      : []),
  ],
}).populate('student', 'rollNumber collegeEmail name _id');
  const selectedEmails = [];
  const rejectedEmails = [];
  const bulkOps = [];
  const qualifiedStudents = [];
const rejectedStudents = [];
 for (const app of affectedApps) {
  if (!app.student) continue;

  const qualified = rollNumbers.includes(
    normalizeRollNumber(app.student.rollNumber)
  );

  const existingRoundStatus = app.roundStatuses.find(
  (rs) => String(rs.round) === String(round._id)
);

  if (qualified) {
    qualifiedStudents.push(app.student);

    if (existingRoundStatus) {
      // Round status already exists → update it
      bulkOps.push({
        updateOne: {
          filter: {
            _id: app._id,
            'roundStatuses.round': round._id,
          },
          update: {
            $set: {
              'roundStatuses.$.status': 'qualified',
              'roundStatuses.$.round': round._id,
              'roundStatuses.$.roundName': round.roundName,
              overallStatus: isFinalRound
                ? 'selected'
                : 'in_progress',
            },
            $unset: {
              eliminatedAtRound: '',
            },
          },
        },
      });
    } else {
      // No status exists → create it
      bulkOps.push({
        updateOne: {
          filter: {
            _id: app._id,
          },
          update: {
            $set: {
              overallStatus: isFinalRound
                ? 'selected'
                : 'in_progress',
            },
            $unset: {
              eliminatedAtRound: '',
            },
            $push: {
              roundStatuses: {
                round: round._id,
                roundNumber: round.roundNumber,
                roundName: round.roundName,
                status: 'qualified',
              },
            },
          },
        },
      });
    }

    if (isFinalRound) {
      selectedEmails.push(app.student.collegeEmail);

      await Student.findByIdAndUpdate(
        app.student._id,
        {
          $inc: {
            'stats.drivesSelected': 1,
          },
        }
      );
    }
  } else {
    rejectedStudents.push(app.student);

    let roundStatusVal = 'not_qualified';

    if (existingRoundStatus?.status === 'not_attended') {
      roundStatusVal = 'not_attended';
    }

    if (existingRoundStatus) {
      // Existing status → update
      bulkOps.push({
        updateOne: {
          filter: {
            _id: app._id,
            'roundStatuses.round': round._id,
          },
          update: {
            $set: {
              'roundStatuses.$.status': roundStatusVal,
              overallStatus: 'rejected',
              eliminatedAtRound: round.roundNumber,
            },
          },
        },
      });
    } else {
      // No status → create one
      bulkOps.push({
        updateOne: {
          filter: {
            _id: app._id,
          },
          update: {
            $set: {
              overallStatus: 'rejected',
              eliminatedAtRound: round.roundNumber,
            },
            $push: {
              roundStatuses: {
                round: round._id,
                roundNumber: round.roundNumber,
                roundName: round.roundName,
                status: roundStatusVal,
              },
            },
          },
        },
      });
    }

    rejectedEmails.push(app.student.collegeEmail);

    await Student.findByIdAndUpdate(
      app.student._id,
      {
        $inc: {
          'stats.drivesRejected': 1,
        },
      }
    );
  }
}
  if (bulkOps.length) await Application.bulkWrite(bulkOps);
  // ── Mark the drive complete after final results ───────────────────────────
  if (isFinalRound) {
    const roundsForDrive = await Round.find({
  drive: round.drive._id
}).sort({ roundNumber: 1 });

const round1 = roundsForDrive[0];
    const attendedInR1 = round1?.attendedList?.rollNumbers?.length || 0;
    await OnCampusDrive.findByIdAndUpdate(round.drive._id, {
      isFrozen: false,
      status: 'completed',
      selectedStudentsCount: rollNumbers.length,
      selectionRatio: `${rollNumbers.length}/${attendedInR1}`,
    });
  }
    // ── Automatic result notifications ─────────────────────────────────────

  // Send result notifications only once
  if (
    !round.resultEmailSent &&
    (qualifiedStudents.length > 0 || rejectedStudents.length > 0)
  ) {
    const company = round.drive.companyName;

    // Qualified students
    if (qualifiedStudents.length > 0) {
      await notifyStudents({
        subject: isFinalRound
          ? `${company} - Final Result`
          : `${company} - Round ${round.roundNumber} Result`,
        message: isFinalRound
          ? `Dear Student,\n\nCongratulations! You have successfully cleared all rounds and have been SELECTED by ${company}.\n\nThe HR team will contact you soon with your offer letter details.\n\nWell done!\n— Placement Cell`
          : `Congratulations! You have qualified for the next round at ${company}.`,
        type: isFinalRound
          ? 'FINAL_RESULT'
          : 'ROUND_RESULT',
        students: qualifiedStudents,
        drive: round.drive,
        round,
        sentBy: req.user._id,
      });
    }

    // Rejected students
    if (rejectedStudents.length > 0) {
      await notifyStudents({
        subject: `${company} - Round ${round.roundNumber} Result`,
        message: `You were not shortlisted for the next round at ${company}.`,
        type: 'ROUND_RESULT',
        students: rejectedStudents,
        drive: round.drive,
        round,
        sentBy: req.user._id,
      });
    }

    // Mark notifications as sent only after successful dispatch
    round.resultEmailSent = true;
    await round.save();
  }
  await AuditLog.create({
    user: req.user._id, action: 'RESULTS_PUBLISHED',
    entity: 'Round', entityId: round._id,
    details: {
      roundName: round.roundName, isFinalRound,
      qualifiedCount: rollNumbers.length,
      rejectedCount: rejectedEmails.length,
      driveFrozen: isFinalRound,
    },
    ip: req.ip,
  });
  res.status(200).json(
    new ApiResponse(200, {
      qualifiedCount: rollNumbers.length,
      rejectedCount: rejectedEmails.length,
      isFinalRound,
      driveFrozen: isFinalRound,
    }, isFinalRound
      ? `Final results published. Drive is now FROZEN. Selected: ${rollNumbers.length}`
      : `Round ${round.roundNumber} results published. ${rollNumbers.length} qualified, ${rejectedEmails.length} eliminated.`
    )
  );
});
