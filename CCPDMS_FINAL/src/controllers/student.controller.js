const Student = require('../models/Student');
const Application = require('../models/Application');
const OnCampusDrive = require('../models/OnCampusDrive');
const OffCampusDrive = require('../models/OffCampusDrive');
const Notification = require('../models/Notification'); 
const { ApiResponse, ApiError } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { driveMatchesStudent } = require('../services/filter.service');
const { resolveDisplayRoundNumber } = require('../utils/roundDisplay');
const normalizeRollNumber = (value) =>
  String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
// PROFILE
// GET /api/student/profile
exports.getProfile = asyncHandler(async (req, res, next) => {
  const student = await Student.findOne({ user: req.user._id })
    .populate('user', 'email role lastLogin isActive');
  if (!student) return next(new ApiError(404, 'Student profile not found'));
  res.status(200).json(new ApiResponse(200, student));
});
// PATCH /api/student/profile
exports.updateProfile = asyncHandler(async (req, res, next) => {
  // Only these fields are student-editable
  const EDITABLE = [
    'personalEmail', 'contact', 'address',
    'skills', 'projects', 'internships',
    'certifications', 'academicAchievements',
    'codingProfiles', 'profileSummary', 'education',
  ];
  const updates = {};
  EDITABLE.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });
  if (!Object.keys(updates).length)
    return next(new ApiError(400, 'No valid fields provided for update'));
  const student = await Student.findOneAndUpdate(
    { user: req.user._id },
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!student) return next(new ApiError(404, 'Student profile not found'));
  res.status(200).json(new ApiResponse(200, student, 'Profile updated successfully'));
});
// RESUME
// POST /api/student/resume
exports.uploadResume = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new ApiError(400, 'Resume PDF is required'));
  const resumeUrl = `/uploads/resumes/${req.file.filename}`;
  const student = await Student.findOneAndUpdate(
    { user: req.user._id },
    {
      $set: {
        'resume.url': resumeUrl,
        'resume.uploadedAt': new Date(),
        lastResumeReminderSent: new Date(),
      },
    },
    { new: true }
  );
  if (!student) return next(new ApiError(404, 'Student profile not found'));
  res.status(200).json(
    new ApiResponse(200, { resumeUrl, uploadedAt: student.resume.uploadedAt }, 'Resume uploaded successfully')
  );
});
// DASHBOARD — statistics + drive history
// GET /api/student/dashboard
exports.getDashboard = asyncHandler(async (req, res, next) => {
  const student = await Student.findOne({ user: req.user._id })
    .select('name rollNumber branch passedOutYear cgpa activeBacklogs stats resume');
  if (!student) return next(new ApiError(404, 'Student profile not found'));
  const applications = await Application.find({ student: student._id })
    .populate('drive', 'companyName minPackage maxPackage status isFrozen selectionRatio')
    .sort({ appliedAt: -1 });
  // Status breakdown for pie/bar charts on frontend
  const statusBreakdown = {
    registered: 0, shortlisted: 0, in_progress: 0,
    selected: 0, rejected: 0, not_shortlisted: 0,
  };
  const driveHistory = applications.map((app) => {
    if (statusBreakdown[app.overallStatus] !== undefined) {
      statusBreakdown[app.overallStatus]++;
    }

    const displayRoundNumber = resolveDisplayRoundNumber(app);

    return {
      applicationId: app._id,
      driveId: app.drive?._id,
      companyName: app.drive?.companyName,
      overallStatus: app.overallStatus,
      eliminatedAtRound: app.eliminatedAtRound,
      displayRoundNumber,
      roundStatuses: app.roundStatuses,
      appliedAt: app.appliedAt,
      feedbackPending:
        !app.feedbackSubmitted &&
        ['selected', 'rejected', 'not_shortlisted'].includes(app.overallStatus),
    };
  });

  const derivedStats = {
    drivesApplied: applications.length,
    drivesSelected: applications.filter((app) => app.overallStatus === 'selected').length,
    drivesRejected: applications.filter((app) =>
      ['rejected', 'not_shortlisted'].includes(app.overallStatus)
    ).length,
  };

  res.status(200).json(
    new ApiResponse(200, {
      student: {
        name: student.name, rollNumber: student.rollNumber,
        branch: student.branch, passedOutYear: student.passedOutYear,
        cgpa: student.cgpa, activeBacklogs: student.activeBacklogs,
        hasResume: !!student.resume?.url,
      },
      stats: derivedStats,
      statusBreakdown,
      driveHistory,
      totalApplications: applications.length,
    })
  );
});
// ON-CAMPUS DRIVE VISIBILITY (Active + Past)
// GET /api/student/drives/oncampus
// Implements full SRS FR-13 logic:
//  • Drives where batch/branch doesn't match → excluded entirely
//  • CGPA < cutoff OR backlogs > allowed → Past Drives ("Not eligible")
//  • Eligible + not applied → Active Drives (registration open)
//  • overallStatus: registered / shortlisted / in_progress → Active Drives
//  • overallStatus: not_shortlisted / rejected / selected → Past Drives
exports.getOnCampusDrives = asyncHandler(async (req, res, next) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) return next(new ApiError(404, 'Student profile not found'));

  const drives = await OnCampusDrive.find({})
    .populate({
      path: 'rounds',
      select:
        'roundNumber roundName mode date venue description isFinalRound eligibleList attendedList qualifiedList eligibleEmailSent resultEmailSent',
    })
    .populate({
      path: 'createdBy',
      select: 'email name',
    })
    .populate({
      path: 'lastUpdatedBy',
      select: 'email name',
    })
    .sort({ createdAt: -1 });

  const activeDrives = [];
  const pastDrives = [];
  for (const drive of drives) {
    if (!driveMatchesStudent(drive, student)) continue;
    const application = await Application.findOne({
      student: student._id,
      drive: drive._id,
    });
//   

const meetsEligibility =
  student.cgpa >= (drive.cgpaCutOff ?? 0) &&
  student.activeBacklogs <= (drive.backlogsAllowed ?? 999);

    const driveObj = drive.toObject();
    driveObj.applicationId = application?._id || null;
    driveObj.overallStatus = application?.overallStatus || null;
    driveObj.roundStatuses = application?.roundStatuses || [];
    
    if (drive.rounds?.length && driveObj.roundStatuses.length) {
  const roundById = new Map(
    drive.rounds.map((round, index) => [
      String(round._id),
      { round, logicalRoundNumber: index + 1 }
    ])
  );

  driveObj.roundStatuses = driveObj.roundStatuses.map((rs) => {
    const roundEntry = roundById.get(String(rs.round));
    const liveRound = roundEntry?.round;
    const qualifiedRollNumbers = (liveRound?.qualifiedList?.rollNumbers || [])
      .map(normalizeRollNumber);
    const resultStatus =
      qualifiedRollNumbers.length &&
      rs.status !== 'not_attended'
        ? qualifiedRollNumbers.includes(normalizeRollNumber(student.rollNumber))
          ? 'qualified'
          : 'not_qualified'
        : rs.status;

    return liveRound
      ? {
          ...rs,
          round: liveRound._id,
          roundNumber: roundEntry.logicalRoundNumber,
          roundName: liveRound.roundName,
          status: resultStatus,
          mode: liveRound.mode,
          date: liveRound.date,
          venue: liveRound.venue,
          description: liveRound.description
        }
      : rs;
  });

  const highestRoundNumber = Math.max(
    ...driveObj.roundStatuses.map((rs) => rs.roundNumber || 0)
  );
  driveObj.roundStatuses = driveObj.roundStatuses.map((rs) => ({
    ...rs,
    status:
      rs.roundNumber < highestRoundNumber &&
      rs.status === 'not_qualified'
        ? 'qualified'
        : rs.status,
  }));
}
    const coordinator =
  drive.lastUpdatedBy ||
  drive.createdBy ||
  null;

driveObj.coordinator = coordinator
  ? {
      _id: coordinator._id,
      email: coordinator.email
    }
  : null;
  driveObj.eliminatedAtRound = application?.eliminatedAtRound
  ? (drive.rounds?.findIndex(
      (r) => r.roundNumber === application.eliminatedAtRound
    ) + 1)
  : null;
    driveObj.feedbackSubmitted = application?.feedbackSubmitted || false;
    driveObj.feedbackPending =
      application &&
      !application.feedbackSubmitted &&
      ['selected', 'rejected', 'not_shortlisted'].includes(application?.overallStatus);
    driveObj.feedbackAvailable = Boolean(driveObj.feedbackPending);
    if (!meetsEligibility) {
  // Student's branch and passed-out year match,
  // but CGPA/backlog eligibility criteria are not satisfied.
  driveObj.visibilityReason = 'You are not eligible for this drive';
  pastDrives.push(driveObj);
  continue;
}

// Drive is completed/frozen.
if (
  drive.status === 'completed' ||
  drive.status === 'frozen' ||
  drive.isFrozen
) {
  if (!application) {
    driveObj.visibilityReason = 'Drive completed';

    driveObj.feedbackUnavailableReason =
      'You are not eligible to give feedback because you did not register for this drive';
  } else {
    driveObj.visibilityReason = 'Drive completed';
  }

  pastDrives.push(driveObj);
  continue;
}

// Student has not registered for the drive.
if (!application) {
 let deadlinePassed = false;

if (drive.registrationDeadline) {
  const deadline = new Date(drive.registrationDeadline);

  // Registration remains open for the entire deadline date
  deadline.setUTCHours(23, 59, 59, 999);

  deadlinePassed = new Date() > deadline;
}
  if (deadlinePassed) {
    driveObj.visibilityReason =
      'Registration closed — you did not register for this drive';

    driveObj.feedbackUnavailableReason =
      'You are not eligible to give feedback because you did not register for this drive';

    pastDrives.push(driveObj);
    continue;
  }

  // Registration is still open.
  driveObj.visibilityReason = 'Registration open';
  activeDrives.push(driveObj);
  continue;
}
    switch (application.overallStatus) {
      case 'registered':
        driveObj.visibilityReason = 'Registered — awaiting Round 1 shortlist';
        activeDrives.push(driveObj);
        break;
      case 'shortlisted':
        driveObj.visibilityReason = 'Shortlisted for Round 1';
        activeDrives.push(driveObj);
        break;
      case 'in_progress':
        driveObj.visibilityReason = `Round ${application.roundStatuses.length} cleared — next round pending`;
        activeDrives.push(driveObj);
        break;
      case 'not_shortlisted':
        driveObj.visibilityReason = 'Not shortlisted for Round 1';
        pastDrives.push(driveObj);
        break;
      case 'rejected':
  driveObj.visibilityReason = `Not qualified in Round ${driveObj.eliminatedAtRound}`;
  pastDrives.push(driveObj);
  break;
      case 'selected':
        driveObj.visibilityReason = 'SELECTED';
        driveObj.isSelected = true;
        pastDrives.push(driveObj);
        break;
      default:
        pastDrives.push(driveObj);
    }
  }
  // res.status(200).json(new ApiResponse(200, { activeDrives, pastDrives }));
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
res.set('Pragma', 'no-cache');
res.set('Expires', '0');

res.status(200).json(
  new ApiResponse(200, { activeDrives, pastDrives })
);
});
// APPLY TO DRIVE
// POST /api/student/drives/oncampus/:driveId/apply
exports.applyToDrive = asyncHandler(async (req, res, next) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) return next(new ApiError(404, 'Student profile not found'));
  // Resume is mandatory before applying
  if (!student.resume?.url)
    return next(new ApiError(400, 'Please upload your resume before applying to any drive'));
  const drive = await OnCampusDrive.findById(req.params.driveId);
  if (!drive) return next(new ApiError(404, 'On-campus drive not found'));
  if (drive.isFrozen || drive.status === 'frozen')
    return next(new ApiError(400, 'Registration is closed — drive results have been declared'));
 if (drive.registrationDeadline) {
  const deadline = new Date(drive.registrationDeadline);

  // Registration remains open for the entire deadline date
  deadline.setUTCHours(23, 59, 59, 999);

  if (new Date() > deadline) {
    return next(
      new ApiError(400, 'Registration deadline has passed for this drive')
    );
  }
}
   
  // Batch / branch / CGPA / backlog check
  if (!driveMatchesStudent(drive, student)) {
    return next(
      new ApiError(
        403,
        `You are not eligible for this drive based on batch, branch, CGPA, or backlog requirements.`
      )
    );
  }
  // Duplicate application guard (also enforced by DB index)
  const existing = await Application.findOne({ student: student._id, drive: drive._id });
  if (existing) return next(new ApiError(409, 'You have already applied to this drive'));
  const application = await Application.create({
    student: student._id,
    drive: drive._id,
    overallStatus: 'registered',
    resumeSnapshot: student.resume.url,
    appliedAt: new Date(),
  });
  await Student.findByIdAndUpdate(student._id, { $inc: { 'stats.drivesApplied': 1 } });
  res.status(201).json(
    new ApiResponse(201, application, `Successfully applied to ${drive.companyName}`)
  );
});
// APPLICATION STATUS for a specific drive
// GET /api/student/drives/oncampus/:driveId/status
exports.getApplicationStatus = asyncHandler(async (req, res, next) => {
  const student = await Student.findOne({ user: req.user._id }).select('_id');
  if (!student) return next(new ApiError(404, 'Student profile not found'));
  const application = await Application.findOne({
    student: student._id,
    drive: req.params.driveId,
  })
    .populate({
  path: 'drive',
  select: 'companyName minPackage maxPackage status isFrozen selectionRatio description createdBy lastUpdatedBy',
  populate: [
    { path: 'createdBy', select: 'email' },
    { path: 'lastUpdatedBy', select: 'email' }
  ]
})
  .populate(
  'roundStatuses.round',
  'roundName roundNumber mode date venue description'
);
  if (!application)
    return next(new ApiError(404, 'No application found for this drive'));
  res.status(200).json(new ApiResponse(200, application));
});
// OFF-CAMPUS DRIVES (student feed — batch + branch filtered)
// GET /api/student/drives/offcampus?category=&page=&limit=
exports.getOffCampusFeed = asyncHandler(async (req, res, next) => {
  const student = await Student.findOne({ user: req.user._id }).select('passedOutYear branch');
  if (!student) return next(new ApiError(404, 'Student profile not found'));
  const { category, page = 1, limit = 10 } = req.query;
  const filter = {
    eligibleBatches: student.passedOutYear,
    eligibleBranches: student.branch,
  };
  if (category) filter.driveCategory = category;
  const skip = (Number(page) - 1) * Number(limit);
  const [drives, total] = await Promise.all([
    OffCampusDrive.find(filter).sort({ publishedAt: -1 }).skip(skip).limit(Number(limit)),
    OffCampusDrive.countDocuments(filter),
  ]);
  res.status(200).json(
    new ApiResponse(200, {
      drives,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    })
  );
});
// AI JOB-SEARCH LINK GENERATOR (FR-21)
// POST /api/student/job-links
exports.generateJobLinks = asyncHandler(async (req, res) => {
  const {
    role = '',
    location = '',
    experience = '0',
  } = req.body;
  const encodedRole = encodeURIComponent(role.trim());
  const encodedLocation = encodeURIComponent(location.trim());
  const slugRole = role.trim().toLowerCase().replace(/\s+/g, '-');
  const slugLoc = location.trim().toLowerCase().replace(/\s+/g, '-');
  const links = {
    linkedin: `https://www.linkedin.com/jobs/search/?keywords=${encodedRole}&location=${encodedLocation}`,
    naukri: `https://www.naukri.com/${slugRole}-jobs-in-${slugLoc || 'india'}`,
    unstop: `https://unstop.com/jobs?search=${encodedRole}`,
    indeed: `https://in.indeed.com/jobs?q=${encodedRole}&l=${encodedLocation}`,
    internshala: `https://internshala.com/internships/${slugRole}-internship`,
    glassdoor: `https://www.glassdoor.co.in/Job/jobs.htm?sc.keyword=${encodedRole}&locKeyword=${encodedLocation}`,
    wellfound: `https://wellfound.com/jobs?query=${encodedRole}`,
    hirist: `https://www.hirist.tech/j/${slugRole}-jobs`,
  };
  res.status(200).json(
    new ApiResponse(200, { role, location, experience, links }, 'Job search links generated')
  );
});
// AI RESUME–JOB MATCH (FR-20) — Stub (connect to OpenAI / Anthropic in prod)
// POST /api/student/resume-match
exports.resumeMatch = asyncHandler(async (req, res, next) => {
  const { jobDescription } = req.body;
  const student = await Student.findOne({ user: req.user._id })
    .select('skills certifications internships projects profileSummary resume');
  if (!student) return next(new ApiError(404, 'Student profile not found'));
  if (!student.resume?.url)
    return next(new ApiError(400, 'Please upload your resume before using resume match'));
  if (!jobDescription)
    return next(new ApiError(400, 'jobDescription is required'));
  // Simple keyword-based stub — replace with LLM call in production
  const jdWords = jobDescription.toLowerCase().split(/\W+/);
  const matched = (student.skills || []).filter((s) => jdWords.includes(s.toLowerCase()));
  const missing = (student.skills || []).filter((s) => !jdWords.includes(s.toLowerCase()));
  const score = student.skills?.length
    ? Math.round((matched.length / student.skills.length) * 100)
    : 0;
  res.status(200).json(
    new ApiResponse(200, {
      jobFitScore: score,
      matchedSkills: matched,
      missingInJD: missing,
      suggestion: `Your profile matches ${score}% of the job description. Focus on: ${missing.slice(0, 3).join(', ') || 'All skills are covered'}.`,
      note: 'For detailed AI analysis, connect this endpoint to an LLM service.',
    })
  );
});

// NOTIFICATIONS
// GET /api/student/notifications
exports.getNotifications = asyncHandler(async (req, res, next) => {
  const student = await Student.findOne({ user: req.user._id })
    .select('_id passedOutYear branch');

  if (!student) {
    return next(new ApiError(404, 'Student profile not found'));
  }

  const notifications = await Notification.find({
    $or: [
      // General notification based on batch/branch
      {
        $and: [
          { recipientStudents: { $size: 0 } },
          {
            $or: [
              { batch: null },
              { batch: student.passedOutYear },
            ],
          },
          {
            $or: [
              { branch: null },
              { branch: student.branch },
            ],
          },
        ],
      },

      // Direct notification for this student
      {
        recipientStudents: student._id,
      },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('sentBy', 'email')
    .populate('drive', 'companyName role')
    .populate('round', 'roundName roundNumber');

  const result = notifications.map((n) => ({
    _id: n._id,
    subject: n.subject,
    message: n.message,

    type: n.type,

    batch: n.batch,
    branch: n.branch,

    drive: n.drive
      ? {
          _id: n.drive._id,
          companyName: n.drive.companyName,
          role: n.drive.role,
        }
      : null,

    round: n.round
      ? {
          _id: n.round._id,
          roundName: n.round.roundName,
          roundNumber: n.round.roundNumber,
        }
      : null,

    sentBy: n.sentBy?.email,
    createdAt: n.createdAt,

    isRead: n.readBy.some((id) =>
      id.equals(student._id)
    ),
  }));

  const unreadCount = result.filter(
    (n) => !n.isRead
  ).length;

  res.status(200).json(
    new ApiResponse(
      200,
      {
        notifications: result,
        unreadCount,
      }
    )
  );
});
// PATCH /api/student/notifications/:id/read
exports.markNotificationRead = asyncHandler(async (req, res, next) => {
  const student = await Student.findOne({ user: req.user._id })
    .select('_id passedOutYear branch');

  if (!student) {
    return next(new ApiError(404, 'Student profile not found'));
  }

  const notification = await Notification.findOne({
    _id: req.params.id,
    $and: [
      {
        $or: [
          {
            $and: [
              {
                $or: [
                  { recipientStudents: { $exists: false } },
                  { recipientStudents: { $size: 0 } },
                ],
              },
              { $or: [{ batch: null }, { batch: student.passedOutYear }] },
              { $or: [{ branch: null }, { branch: student.branch }] },
            ],
          },
          { recipientStudents: student._id },
        ],
      },
    ],
  });

  if (!notification) {
    return next(new ApiError(404, 'Notification not found'));
  }

  const alreadyRead = notification.readBy.some(
    (id) => id.equals(student._id)
  );

  if (!alreadyRead) {
    notification.readBy.push(student._id);
    await notification.save();
  }

  res.status(200).json(
    new ApiResponse(200, {
      message: 'Notification marked as read',
    })
  );
});
// PATCH /api/student/notifications/read-all
exports.markAllNotificationsRead = asyncHandler(async (req, res, next) => {
  const student = await Student.findOne({ user: req.user._id })
    .select('_id passedOutYear branch');

  if (!student) {
    return next(new ApiError(404, 'Student profile not found'));
  }

  const notifications = await Notification.find({
    $or: [
      // General notifications targeted by batch/branch
      {
        $and: [
          {
            $or: [
              { recipientStudents: { $exists: false } },
              { recipientStudents: { $size: 0 } },
            ],
          },
          {
            $or: [
              { batch: null },
              { batch: student.passedOutYear },
            ],
          },
          {
            $or: [
              { branch: null },
              { branch: student.branch },
            ],
          },
        ],
      },

      // Direct notifications for this student
      {
        recipientStudents: student._id,
      },
    ],
  }).select('_id readBy');

  const unreadNotifications = notifications.filter(
    (notification) =>
      !notification.readBy.some((id) =>
        id.equals(student._id)
      )
  );

  if (unreadNotifications.length > 0) {
    await Notification.updateMany(
      {
        _id: {
          $in: unreadNotifications.map(
            (notification) => notification._id
          ),
        },
      },
      {
        $addToSet: {
          readBy: student._id,
        },
      }
    );
  }

  res.status(200).json(
    new ApiResponse(200, {
      message: 'All notifications marked as read',
    })
  );
});

// DELETE /api/student/notifications — Clear this student's notification list
exports.clearNotifications = asyncHandler(async (req, res, next) => {
  const student = await Student.findOne({ user: req.user._id })
    .select('_id passedOutYear branch');

  if (!student) {
    return next(new ApiError(404, 'Student profile not found'));
  }

  await Notification.deleteMany({
    recipientStudents: student._id,
  });

  res.status(200).json(
    new ApiResponse(200, { message: 'Notifications cleared' })
  );
});

// DELETE /api/student/notifications/:id — Clear one notification
exports.clearNotification = asyncHandler(async (req, res, next) => {
  const student = await Student.findOne({ user: req.user._id }).select('_id');

  if (!student) {
    return next(new ApiError(404, 'Student profile not found'));
  }

  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipientStudents: student._id,
  });

  if (!notification) {
    return next(new ApiError(404, 'Notification not found'));
  }

  res.status(200).json(
    new ApiResponse(200, { message: 'Notification cleared' })
  );
});
