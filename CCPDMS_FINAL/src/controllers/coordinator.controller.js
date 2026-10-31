const Student = require('../models/Student');
const OnCampusDrive = require('../models/OnCampusDrive');
const OffCampusDrive = require('../models/OffCampusDrive');
const Application = require('../models/Application');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const { sendBulkEmails } = require('../services/email.service');
const { ApiResponse, ApiError } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const BRANCHES = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML', 'DS'];
const BATCHES = [2026, 2027, 2028, 2029];
// GET /api/coordinator/dashboard
// Returns batch-wise pie chart data: for each batch → branch-level student count
// + placement percentage
// Also returns summary counts for total drives, frozen drives, etc.
exports.getDashboard = asyncHandler(async (req, res) => {
  const batchData = await Promise.all(
    BATCHES.map(async (batch) => {
      const branchStats = await Promise.all(
        BRANCHES.map(async (branch) => {
          const [total, selected] = await Promise.all([
            Student.countDocuments({ passedOutYear: batch, branch }),
            Student.countDocuments({ passedOutYear: batch, branch, 'stats.drivesSelected': { $gt: 0 } }),
          ]);
          return {
            branch,
            total,
            selected,
            percentage: total > 0 ? parseFloat(((selected / total) * 100).toFixed(1)) : 0,
          };
        })
      );

      const batchTotal = branchStats.reduce((s, b) => s + b.total, 0);
      const batchSelected = branchStats.reduce((s, b) => s + b.selected, 0);

      return {
        batch,
        total: batchTotal,
        selected: batchSelected,
        placementPercent:
          batchTotal > 0 ? parseFloat(((batchSelected / batchTotal) * 100).toFixed(1)) : 0,
        branches: branchStats,
      };
    })
  );
  // Summary counts
  const totalOnCampusDrives = await OnCampusDrive.countDocuments();
  const totalOffCampusDrives = await OffCampusDrive.countDocuments();
  const frozenDrives = await OnCampusDrive.countDocuments({ isFrozen: true });

  res.status(200).json(
    new ApiResponse(200, {
      batchData,
      summary: {
        totalOnCampusDrives,
        totalOffCampusDrives,
        frozenDrives,
        activeDrives: totalOnCampusDrives - frozenDrives,
      },
    })
  );
});

// GET /api/coordinator/placement-stats/:batch
// Detailed stats for one passed-out year: drives, selected counts, branch breakdown
exports.getPlacementStats = asyncHandler(async (req, res, next) => {
  const batch = Number(req.params.batch);
  if (!BATCHES.includes(batch))
    return next(new ApiError(400, `Invalid batch. Allowed: ${BATCHES.join(', ')}`));

  const [students, onCampusDrives, offCampusDrives] = await Promise.all([
    Student.find({ passedOutYear: batch })
      .select('name rollNumber branch cgpa activeBacklogs stats'),
    OnCampusDrive.find({ eligibleBatches: batch })
      .populate('rounds', 'roundNumber roundName isFinalRound')
      .sort({ createdAt: -1 }),
    OffCampusDrive.find({ eligibleBatches: batch }).sort({ publishedAt: -1 }),
  ]);

  // Branch-wise breakdown
  const branchBreakdown = BRANCHES.map((branch) => {
    const branchStudents = students.filter((s) => s.branch === branch);
    const selected = branchStudents.filter((s) => s.stats?.drivesSelected > 0);
    return {
      branch,
      total: branchStudents.length,
      selected: selected.length,
      percentage: branchStudents.length > 0
        ? parseFloat(((selected.length / branchStudents.length) * 100).toFixed(1))
        : 0,
    };
  }).filter((b) => b.total > 0);

  const totalStudents = students.length;
  const totalSelected = students.filter((s) => s.stats?.drivesSelected > 0).length;

  res.status(200).json(
    new ApiResponse(200, {
      batch,
      totalStudents,
      totalSelected,
      overallPlacementPercent:
        totalStudents > 0 ? parseFloat(((totalSelected / totalStudents) * 100).toFixed(1)) : 0,
      branchBreakdown,
      onCampusDrives,
      offCampusDrives,
    })
  );
});
exports.getStudentSkills = asyncHandler(async (req, res) => {
  const students = await Student.find({
    skills: { $exists: true, $ne: [] },
  }).select("skills");

  const skills = [
    ...new Set(
      students
        .flatMap((student) => student.skills || [])
        .map((skill) => String(skill).trim())
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b));

  res.status(200).json(
    new ApiResponse(200, {
      skills,
    })
  );
});
exports.getStudentList = asyncHandler(async (req, res) => {
 const {
  batches,
  branches,
  minCgpa,
  maxCgpa,
  maxBacklogs,
  skills,
  page = 1,
  limit = 20,
} = req.query;
  const filter = {};
if (batches) {
  const batchList = Array.isArray(batches)
    ? batches
    : String(batches)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

  if (batchList.length > 0) {
    filter.passedOutYear = {
      $in: batchList.map(Number),
    };
  }
}

if (branches) {
  const branchList = Array.isArray(branches)
    ? branches
    : String(branches)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

  if (branchList.length > 0) {
    filter.branch = {
      $in: branchList,
    };
  }
}
  if (minCgpa) filter.cgpa = { ...filter.cgpa, $gte: Number(minCgpa) };
  if (maxCgpa) filter.cgpa = { ...filter.cgpa, $lte: Number(maxCgpa) };
  if (maxBacklogs) filter.activeBacklogs = { $lte: Number(maxBacklogs) };
  
  if (skills) {
  const skillList = Array.isArray(skills)
    ? skills
    : String(skills)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

  if (skillList.length > 0) {
    filter.skills = {
      $all: skillList,
    };
  }
}

  const skip = (Number(page) - 1) * Number(limit);

  const [students, total] = await Promise.all([
    Student.find(filter)
      .select(
  'rollNumber name branch passedOutYear cgpa activeBacklogs collegeEmail stats resume skills'
)
      .sort({ passedOutYear: 1, branch: 1, rollNumber: 1 })
      .skip(skip)
      .limit(Number(limit)),
    Student.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      students,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    })
  );
});
// GET /api/coordinator/students/:studentId  — Single student full profile
exports.getStudentDetail = asyncHandler(async (req, res, next) => {
  const student = await Student.findById(req.params.studentId)
    .populate('user', 'email isActive lastLogin');
  if (!student) return next(new ApiError(404, 'Student not found'));

  const applications = await Application.find({ student: student._id })
    .populate('drive', 'companyName status isFrozen')
    .sort({ appliedAt: -1 });

  res.status(200).json(new ApiResponse(200, { student, applications }));
});
// POST /api/coordinator/notify  — Bulk email to batch/branch filtered students
// POST /api/coordinator/notify — Bulk email + in-app notification
exports.sendNotification = asyncHandler(async (req, res, next) => {
  const {
    subject,
    message,
    batch,
    branch,
    type = 'ANNOUNCEMENT',
  } = req.body;

  if (!subject || !message) {
    return next(
      new ApiError(400, 'subject and message are required')
    );
  }

  const allowedTypes = [
    'ANNOUNCEMENT',
    'DRIVE_POSTED',
    'ROUND_ELIGIBLE',
    'ROUND_RESULT',
    'FINAL_RESULT',
    'DEADLINE_REMINDER',
  ];

  if (!allowedTypes.includes(type)) {
    return next(new ApiError(400, 'Invalid notification type'));
  }

  const filter = {};

  if (batch) {
    filter.passedOutYear = Number(batch);
  }

  if (branch) {
    filter.branch = branch;
  }

  const students = await Student.find(filter)
    .select('_id collegeEmail name');

  if (!students.length) {
    return next(
      new ApiError(
        404,
        'No students found matching the given filters'
      )
    );
  }

  const emails = students
    .map((student) => student.collegeEmail)
    .filter(Boolean);

  // Send email
  if (emails.length > 0) {
    sendBulkEmails({
      to: emails,
      subject,
      text: message,
    });
  }

  // Create in-app notification
  const notification = await Notification.create({
    subject,
    message,
    type,
    recipientStudents: students.map(
      (student) => student._id
    ),
    batch: batch ? Number(batch) : null,
    branch: branch || null,
    sentBy: req.user._id,
    emailSent: emails.length > 0,
    recipientCount: students.length,
  });

  await AuditLog.create({
    user: req.user._id,
    action: 'NOTIFICATION_SENT',
    entity: 'Student',
    details: {
      notificationId: notification._id,
      subject,
      type,
      recipientCount: students.length,
      emailRecipientCount: emails.length,
      batch: batch || 'All',
      branch: branch || 'All',
    },
    ip: req.ip,
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        recipientCount: students.length,
        emailRecipientCount: emails.length,
        notificationId: notification._id,
      },
      `Notification dispatched to ${students.length} students`
    )
  );
});
// GET /api/coordinator/auditlogs Section
exports.getAuditLogs = asyncHandler(async (req, res) => {
  const { entity, action, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (entity) filter.entity = entity;
  if (action) filter.action = action;

  const skip = (Number(page) - 1) * Number(limit);
  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('user', 'email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    AuditLog.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    })
  );
});
