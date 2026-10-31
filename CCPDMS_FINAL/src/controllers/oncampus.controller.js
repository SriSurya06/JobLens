const OnCampusDrive = require('../models/OnCampusDrive');
const Application = require('../models/Application');
const AuditLog = require('../models/AuditLog');
const { filterEligibleStudents } = require('../services/filter.service');
const {
  extractEligibilityRollNumbers,
} = require('../services/eligibility-list.service');
const { ApiResponse, ApiError } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const {
  notifyStudents,
} = require('../services/notification.service');
// Helper — safely parse JSON arrays (handles both parsed arrays and JSON strings)
const parseArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val.split(',').map((s) => s.trim()); }
  }
  return [];
};
// POST /api/oncampus  — Coordinator creates a new on-campus drive
// POST /api/oncampus — Coordinator creates a new on-campus drive
exports.createDrive = asyncHandler(async (req, res, next) => {
  const {
    companyName,
    role,
    eligibleBatches,
    eligibleBranches,
    cgpaCutOff,
    backlogsAllowed,
    description,
    minPackage,
    maxPackage,
    registrationDeadline,
    registrationLink,
    status,
  } = req.body;

  if (
    !companyName ||
    !role ||
    !eligibleBatches ||
    !eligibleBranches ||
    cgpaCutOff === undefined ||
    cgpaCutOff === ''
  ) {
    return next(
      new ApiError(
        400,
        'companyName, role, eligibleBatches, eligibleBranches, and cgpaCutOff are required'
      )
    );
  }

  const batches = parseArray(eligibleBatches).map(Number);
  const branches = parseArray(eligibleBranches);

  if (!batches.length) {
    return next(
      new ApiError(400, 'At least one eligible batch is required')
    );
  }

  if (!branches.length) {
    return next(
      new ApiError(400, 'At least one eligible branch is required')
    );
  }

  // Duplicate check — same company + overlapping batch created today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const duplicate = await OnCampusDrive.findOne({
    companyName: {
      $regex: new RegExp(
        `^${companyName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
        'i'
      ),
    },
    eligibleBatches: { $in: batches },
    createdAt: { $gte: todayStart },
  });

  if (duplicate) {
    return next(
      new ApiError(
        409,
        `A drive for "${companyName}" with overlapping batches was already created today (Drive ID: ${duplicate._id})`
      )
    );
  }

  // Files uploaded through uploadOnCampusDriveFiles
  const documentFile = req.files?.document?.[0];
  const eligibilityListFile = req.files?.eligibilityList?.[0];
 let eligibleStudentRollNumbers;

if (eligibilityListFile) {
  try {
    eligibleStudentRollNumbers =
      await extractEligibilityRollNumbers(
        eligibilityListFile.path
      );
  } catch (error) {
    return next(
      new ApiError(
        400,
        `Unable to read eligibility list: ${error.message}`
      )
    );
  }

  if (!eligibleStudentRollNumbers.length) {
    return next(
      new ApiError(
        400,
        'The eligibility list does not contain any valid student roll numbers'
      )
    );
  }
}

  const drive = await OnCampusDrive.create({
    companyName: companyName.trim(),
    role: role.trim(),

    eligibleBatches: batches,
    eligibleBranches: branches,

    cgpaCutOff: Number(cgpaCutOff),
    backlogsAllowed: Number(backlogsAllowed ?? 0),

    description: description || '',

    minPackage: minPackage ? Number(minPackage) : undefined,
    maxPackage: maxPackage ? Number(maxPackage) : undefined,

    registrationDeadline: registrationDeadline
      ? new Date(registrationDeadline)
      : undefined,

    registrationLink: registrationLink || '',
    status: status || 'active',

    // Optional Job Description
    documentUrl: documentFile
      ? `/uploads/drive-docs/${documentFile.filename}`
      : undefined,

    // Optional Eligibility Student List
    eligibilityListUrl: eligibilityListFile
  ? `/uploads/eligibility-lists/${eligibilityListFile.filename}`
  : undefined,

eligibleStudentRollNumbers,

createdBy: req.user._id,
  });

  // Cache eligible student count
   // Calculate students who are eligible for this drive
  const eligible = await filterEligibleStudents(drive);

  drive.eligibleStudentsCount = eligible.length;

  await drive.save();

  // Automatically notify eligible students
  if (eligible.length > 0) {
    await notifyStudents({
      subject: `[${drive.companyName}] New On-Campus Drive — ${drive.role}`,
      message:
        `Dear Student,\n\n` +
        `A new on-campus placement drive has been posted that matches your eligibility.\n\n` +
        `Company: ${drive.companyName}\n` +
        `Role: ${drive.role}\n` +
        `CGPA Cut-off: ${drive.cgpaCutOff}\n` +
        `Backlogs Allowed: ${drive.backlogsAllowed}\n` +
        `Registration Deadline: ${
          drive.registrationDeadline
            ? new Date(
                drive.registrationDeadline
              ).toLocaleString()
            : 'To be announced'
        }\n\n` +
        `Please log in to the JobLens placement portal to view the complete drive details and apply before the deadline.\n\n` +
        `Best wishes,\n` +
        `— Placement Cell`,
      type: 'DRIVE_POSTED',
      students: eligible,
      drive,
      sentBy: req.user._id,
    });
  }

  await AuditLog.create({
    user: req.user._id,
    action: 'DRIVE_CREATED',
    entity: 'OnCampusDrive',
    entityId: drive._id,
    details: {
      companyName: drive.companyName,
      role: drive.role,
      batches,
      branches,
      eligibleCount: eligible.length,
      hasDocument: !!documentFile,
      hasEligibilityList: !!eligibilityListFile,
    },
    ip: req.ip,
  });

  res.status(201).json(
    new ApiResponse(
      201,
      drive,
      `On-campus drive for ${drive.companyName} created. ${eligible.length} students are eligible.`
    )
  );
});
// GET /api/oncampus?batch=&status=&page=&limit=  — Coordinator list
exports.getAllDrives = asyncHandler(async (req, res) => {
  const { batch, status, page = 1, limit = 10 } = req.query;
  const filter = {};
  if (batch) filter.eligibleBatches = Number(batch);
  if (status) filter.status = status;
  const skip = (Number(page) - 1) * Number(limit);
  const [drives, total] = await Promise.all([
    OnCampusDrive.find(filter)
      .populate('rounds', 'roundNumber roundName date isFinalRound')
      .populate('createdBy', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    OnCampusDrive.countDocuments(filter),
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
// GET /api/oncampus/:id  — Full drive details (both roles)
exports.getDriveById = asyncHandler(async (req, res, next) => {
  const drive = await OnCampusDrive.findById(req.params.id)
    .populate('rounds')
    .populate('createdBy', 'email')
    .populate('lastUpdatedBy', 'email');

  if (!drive) return next(new ApiError(404, 'On-campus drive not found'));
  res.status(200).json(new ApiResponse(200, drive));
});
// PATCH /api/oncampus/:id  — Coordinator updates drive (blocked if frozen)
// PATCH /api/oncampus/:id — Coordinator updates drive
// PATCH /api/oncampus/:id — Coordinator updates drive
exports.updateDrive = asyncHandler(async (req, res, next) => {
  const drive = await OnCampusDrive.findById(req.params.id);

  if (!drive) {
    return next(new ApiError(404, 'On-campus drive not found'));
  }

  // Update editable drive fields
  const UPDATABLE = [
    'companyName',
    'role',
    'eligibleBatches',
    'eligibleBranches',
    'cgpaCutOff',
    'backlogsAllowed',
    'description',
    'minPackage',
    'maxPackage',
    'registrationDeadline',
    'registrationLink',
    'status',
  ];

  UPDATABLE.forEach((field) => {
    if (req.body[field] !== undefined) {
      drive[field] = req.body[field];
    }
  });

  // Convert array fields when sent through FormData
  if (req.body.eligibleBatches !== undefined) {
    drive.eligibleBatches = parseArray(req.body.eligibleBatches).map(Number);
  }

  if (req.body.eligibleBranches !== undefined) {
    drive.eligibleBranches = parseArray(req.body.eligibleBranches);
  }

  // Convert numeric fields
  if (req.body.cgpaCutOff !== undefined) {
    drive.cgpaCutOff = Number(req.body.cgpaCutOff);
  }

  if (req.body.backlogsAllowed !== undefined) {
    drive.backlogsAllowed = Number(req.body.backlogsAllowed);
  }

  if (req.body.minPackage !== undefined) {
    drive.minPackage =
      req.body.minPackage === ''
        ? undefined
        : Number(req.body.minPackage);
  }

  if (req.body.maxPackage !== undefined) {
    drive.maxPackage =
      req.body.maxPackage === ''
        ? undefined
        : Number(req.body.maxPackage);
  }

  if (req.body.registrationDeadline !== undefined) {
    drive.registrationDeadline =
      req.body.registrationDeadline === ''
        ? undefined
        : new Date(req.body.registrationDeadline);
  }

  // Uploaded files
 // Uploaded files
const documentFile = req.files?.document?.[0];
const eligibilityListFile = req.files?.eligibilityList?.[0];

let eligibleStudentRollNumbers;

if (eligibilityListFile) {
  try {
    eligibleStudentRollNumbers =
      await extractEligibilityRollNumbers(
        eligibilityListFile.path
      );
  } catch (error) {
    return next(
      new ApiError(
        400,
        `Unable to read eligibility list: ${error.message}`
      )
    );
  }

  if (!eligibleStudentRollNumbers.length) {
    return next(
      new ApiError(
        400,
        'The eligibility list does not contain any valid student roll numbers'
      )
    );
  }
}

// Replace Job Description if a new file was uploaded
if (documentFile) {
  drive.documentUrl =
    `/uploads/drive-docs/${documentFile.filename}`;
}

// Replace Eligibility Student List if a new file was uploaded
if (eligibilityListFile) {
  drive.eligibilityListUrl =
    `/uploads/eligibility-lists/${eligibilityListFile.filename}`;
}

if (eligibleStudentRollNumbers !== undefined) {
  drive.eligibleStudentRollNumbers =
    eligibleStudentRollNumbers;
}
  // Recalculate eligible student count
  const eligible = await filterEligibleStudents(drive);

  drive.eligibleStudentsCount = eligible.length;
  drive.lastUpdatedBy = req.user._id;

  await drive.save();

  await AuditLog.create({
    user: req.user._id,
    action: 'DRIVE_UPDATED',
    entity: 'OnCampusDrive',
    entityId: drive._id,
    details: {
      ...req.body,
      hasDocument: !!documentFile,
      hasEligibilityList: !!eligibilityListFile,
    },
    ip: req.ip,
  });

  res.status(200).json(
    new ApiResponse(
      200,
      drive,
      'Drive updated successfully'
    )
  );
});
// GET /api/oncampus/:id/eligible-students  — Coordinator preview eligible students before creating drive
exports.getEligibleStudents = asyncHandler(async (req, res, next) => {
  const drive = await OnCampusDrive.findById(req.params.id);
  if (!drive) return next(new ApiError(404, 'Drive not found'));

  const students = await filterEligibleStudents(drive);
  res.status(200).json(new ApiResponse(200, { count: students.length, students }));
});
// GET /api/oncampus/:id/applications?status=  — All applicants for a drive
exports.getDriveApplications = asyncHandler(async (req, res, next) => {
  const drive = await OnCampusDrive.findById(req.params.id);
  if (!drive) return next(new ApiError(404, 'Drive not found'));

  const filter = { drive: drive._id };
  if (req.query.status) filter.overallStatus = req.query.status;

  const applications = await Application.find(filter)
    .populate('student', 'rollNumber name branch cgpa activeBacklogs collegeEmail passedOutYear')
    .sort({ appliedAt: -1 });

  res.status(200).json(
    new ApiResponse(200, { count: applications.length, applications })
  );
});
// GET /api/oncampus/:id/eligible-students  — Coordinator preview eligible students before creating drive
exports.getEligibleStudents = asyncHandler(async (req, res, next) => {
  const drive = await OnCampusDrive.findById(req.params.id);
  if (!drive) return next(new ApiError(404, 'Drive not found'));

  const students = await filterEligibleStudents(drive);
  res.status(200).json(new ApiResponse(200, { count: students.length, students }));
});
// GET /api/oncampus/:id/applications?status=  — All applicants for a drive
exports.getDriveApplications = asyncHandler(async (req, res, next) => {
  const drive = await OnCampusDrive.findById(req.params.id);
  if (!drive) return next(new ApiError(404, 'Drive not found'));

  const filter = { drive: drive._id };
  if (req.query.status) filter.overallStatus = req.query.status;

  const applications = await Application.find(filter)
    .populate('student', 'rollNumber name branch cgpa activeBacklogs collegeEmail passedOutYear')
    .sort({ appliedAt: -1 });

  res.status(200).json(
    new ApiResponse(200, { count: applications.length, applications })
  );
});
// GET /api/oncampus/:id/eligible-students  — Coordinator preview eligible students before creating drive
exports.getEligibleStudents = asyncHandler(async (req, res, next) => {
  const drive = await OnCampusDrive.findById(req.params.id);
  if (!drive) return next(new ApiError(404, 'Drive not found'));

  const students = await filterEligibleStudents(drive);
  res.status(200).json(new ApiResponse(200, { count: students.length, students }));
});
// GET /api/oncampus/:id/applications?status=  — All applicants for a drive
exports.getDriveApplications = asyncHandler(async (req, res, next) => {
  const drive = await OnCampusDrive.findById(req.params.id);
  if (!drive) return next(new ApiError(404, 'Drive not found'));

  const filter = { drive: drive._id };
  if (req.query.status) filter.overallStatus = req.query.status;

  const applications = await Application.find(filter)
    .populate('student', 'rollNumber name branch cgpa activeBacklogs collegeEmail passedOutYear')
    .sort({ appliedAt: -1 });

  res.status(200).json(
    new ApiResponse(200, { count: applications.length, applications })
  );
});
// GET /api/oncampus/:id/eligible-students  — Coordinator preview eligible students before creating drive
exports.getEligibleStudents = asyncHandler(async (req, res, next) => {
  const drive = await OnCampusDrive.findById(req.params.id);
  if (!drive) return next(new ApiError(404, 'Drive not found'));

  const students = await filterEligibleStudents(drive);
  res.status(200).json(new ApiResponse(200, { count: students.length, students }));
});
// GET /api/oncampus/:id/applications?status=  — All applicants for a drive
exports.getDriveApplications = asyncHandler(async (req, res, next) => {
  const drive = await OnCampusDrive.findById(req.params.id);
  if (!drive) return next(new ApiError(404, 'Drive not found'));

  const filter = { drive: drive._id };
  if (req.query.status) filter.overallStatus = req.query.status;

  const applications = await Application.find(filter)
    .populate('student', 'rollNumber name branch cgpa activeBacklogs collegeEmail passedOutYear')
    .sort({ appliedAt: -1 });

  res.status(200).json(
    new ApiResponse(200, { count: applications.length, applications })
  );
});
// GET /api/oncampus/:id/eligible-students  — Coordinator preview eligible students before creating drive
exports.getEligibleStudents = asyncHandler(async (req, res, next) => {
  const drive = await OnCampusDrive.findById(req.params.id);
  if (!drive) return next(new ApiError(404, 'Drive not found'));

  const students = await filterEligibleStudents(drive);
  res.status(200).json(new ApiResponse(200, { count: students.length, students }));
});
// GET /api/oncampus/:id/applications?status=  — All applicants for a drive
exports.getDriveApplications = asyncHandler(async (req, res, next) => {
  const drive = await OnCampusDrive.findById(req.params.id);
  if (!drive) return next(new ApiError(404, 'Drive not found'));

  const students = await filterEligibleStudents(drive);
  res.status(200).json(new ApiResponse(200, { count: students.length, students }));
});