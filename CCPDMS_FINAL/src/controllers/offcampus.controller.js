const OffCampusDrive = require('../models/OffCampusDrive');
const AuditLog = require('../models/AuditLog');
const { ApiResponse, ApiError } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const parseArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val.split(',').map((s) => s.trim()); }
  }
  return [];
}
// POST /api/offcampus  — Coordinator posts a verified off-campus opportunity
exports.createDrive = asyncHandler(async (req, res, next) => {
  const {
    companyName, driveName, driveCategory,
    eligibleBatches, eligibleBranches,
    description, applyLink, lastDateToApply,
  } = req.body;
  if (!companyName || !driveName || !driveCategory || !applyLink || !eligibleBatches || !eligibleBranches)
    return next(new ApiError(400, 'companyName, driveName, driveCategory, applyLink, eligibleBatches, and eligibleBranches are required'));
  const batches = parseArray(eligibleBatches).map(Number);
  const branches = parseArray(eligibleBranches);
  if (!batches.length) return next(new ApiError(400, 'At least one eligible batch is required'));
  if (!branches.length) return next(new ApiError(400, 'At least one eligible branch is required'));
  const drive = await OffCampusDrive.create({
    companyName: companyName.trim(),
    driveName: driveName.trim(),
    driveCategory,
    eligibleBatches: batches,
    eligibleBranches: branches,
    description: description || '',
    applyLink,
    lastDateToApply: lastDateToApply ? new Date(lastDateToApply) : undefined,
    isVerified: true,
    createdBy: req.user._id,
  });
  await AuditLog.create({
    user: req.user._id, action: 'DRIVE_CREATED',
    entity: 'OffCampusDrive', entityId: drive._id,
    details: { companyName, driveName, driveCategory }, ip: req.ip,
  });
  res.status(201).json(
    new ApiResponse(201, drive, `Off-campus drive "${driveName}" by ${companyName} created successfully`)
  );
});
// GET /api/offcampus?category=&batch=&page=&limit=  — Coordinator list all
exports.getAllDrives = asyncHandler(async (req, res) => {
  const { category, batch, page = 1, limit = 10 } = req.query;
  const filter = {};
  if (category) filter.driveCategory = category;
  if (batch) filter.eligibleBatches = Number(batch);
  const skip = (Number(page) - 1) * Number(limit);
  const [drives, total] = await Promise.all([
    OffCampusDrive.find(filter)
      .populate('createdBy', 'email')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
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
// GET /api/offcampus/:id  — Full drive details (both roles)
exports.getDriveById = asyncHandler(async (req, res, next) => {
  const drive = await OffCampusDrive.findById(req.params.id).populate('createdBy', 'email');
  if (!drive) return next(new ApiError(404, 'Off-campus drive not found'));
  res.status(200).json(new ApiResponse(200, drive));
});
// PATCH /api/offcampus/:id  — Coordinator updates drive info / counts
exports.updateDrive = asyncHandler(async (req, res, next) => {
  const rawDriveCategory = req.body.driveCategory ?? req.body.driveType;
  const rawEligibleBatches = req.body.eligibleBatches;
  const rawEligibleBranches = req.body.eligibleBranches;

  const UPDATABLE = [
    'companyName',
    'driveName',
    'driveCategory',
    'description',
    'applyLink',
    'lastDateToApply',
    'appliedCount',
    'selectedCount',
  ];

  const updates = {};
  UPDATABLE.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (rawDriveCategory !== undefined) {
    updates.driveCategory = rawDriveCategory;
  }

  if (rawEligibleBatches !== undefined) {
    const batches = parseArray(rawEligibleBatches).map(Number).filter((n) => Number.isFinite(n));
    if (!batches.length) return next(new ApiError(400, 'At least one eligible batch is required'));
    updates.eligibleBatches = batches;
  }

  if (rawEligibleBranches !== undefined) {
    const branches = parseArray(rawEligibleBranches).map((b) => String(b).trim()).filter(Boolean);
    if (!branches.length) return next(new ApiError(400, 'At least one eligible branch is required'));
    updates.eligibleBranches = branches;
  }

  if (updates.lastDateToApply !== undefined) {
    updates.lastDateToApply = updates.lastDateToApply ? new Date(updates.lastDateToApply) : undefined;
  }

  if (!Object.keys(updates).length) {
    return next(new ApiError(400, 'No valid fields provided for update'));
  }

  const drive = await OffCampusDrive.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!drive) return next(new ApiError(404, 'Off-campus drive not found'));
  await AuditLog.create({
    user: req.user._id, action: 'DRIVE_UPDATED',
    entity: 'OffCampusDrive', entityId: drive._id,
    details: updates, ip: req.ip,
  });
  res.status(200).json(new ApiResponse(200, drive, 'Off-campus drive updated successfully'));
});
// DELETE /api/offcampus/:id  — Coordinator removes an expired/incorrect listing
exports.deleteDrive = asyncHandler(async (req, res, next) => {
  const drive = await OffCampusDrive.findByIdAndDelete(req.params.id);
  if (!drive) return next(new ApiError(404, 'Off-campus drive not found'));
  await AuditLog.create({
    user: req.user._id, action: 'DRIVE_DELETED',
    entity: 'OffCampusDrive', entityId: req.params.id,
    details: { companyName: drive.companyName, driveName: drive.driveName }, ip: req.ip,
  });
  res.status(200).json(new ApiResponse(200, null, `Off-campus drive "${drive.driveName}" deleted`));
});
