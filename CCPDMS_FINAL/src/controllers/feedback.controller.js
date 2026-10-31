const Feedback = require('../models/Feedback');
const Application = require('../models/Application');
const Student = require('../models/Student');
const { ApiResponse, ApiError } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
// POST /api/feedback  — Student submits anonymous feedback
//  • Only after terminal status (selected / rejected / not_shortlisted)
//  • One feedback per student per drive
//  • Student identity NEVER stored in a way that is returned via API
exports.submitFeedback = asyncHandler(async (req, res, next) => {
  const student = await Student.findOne({ user: req.user._id }).select('_id passedOutYear');
  if (!student) return next(new ApiError(404, 'Student profile not found'));
  const { driveId, driveType, companyName, role, rounds, outcome } = req.body;
  if (!driveId || !driveType || !companyName)
    return next(new ApiError(400, 'driveId, driveType, and companyName are required'));
  if (!['on-campus', 'off-campus'].includes(driveType))
    return next(new ApiError(400, 'driveType must be "on-campus" or "off-campus"'));
  // For on-campus drives: verify terminal status
  if (driveType === 'on-campus') {
    const app = await Application.findOne({ student: student._id, drive: driveId });
    if (!app)
      return next(new ApiError(404, 'No application found for this drive'));
   if (
  !['selected', 'rejected', 'not_shortlisted'].includes(app.overallStatus)
) {
  return next(
    new ApiError(
      400,
      'Feedback can only be submitted after you are out of the drive'
    )
  );
}
    if (app.feedbackSubmitted)
      return next(new ApiError(409, 'You have already submitted feedback for this drive'));
  }
  // Duplicate guard (enforced by DB unique index too)
  const exists = await Feedback.findOne({ student: student._id, 'driveRef.driveId': driveId });
  if (exists) return next(new ApiError(409, 'Feedback already submitted for this drive'));
  await Feedback.create({
    driveRef: { driveId, driveType },
    student: student._id,          // select:false — never returned in GET
    companyName: companyName.trim(),
    role: role || '',
    passedOutYear: student.passedOutYear,
    rounds: Array.isArray(rounds) ? rounds : [],
    outcome: outcome || undefined,
  });
  // Mark feedback submitted on application (on-campus only)
  if (driveType === 'on-campus') {
    await Application.updateOne(
      { student: student._id, drive: driveId },
      { $set: { feedbackSubmitted: true } }
    );
  }
  res.status(201).json(
    new ApiResponse(201, null, 'Thank you! Your feedback has been submitted anonymously.')
  );
});
// GET /api/feedback/companies  — All company names that have at least 1 feedback
exports.getCompaniesWithFeedback = asyncHandler(async (req, res) => {
  const companies = await Feedback.aggregate([
    {
      $group: {
        _id: '$companyName',
        count: { $sum: 1 },
        driveTypes: { $addToSet: '$driveRef.driveType' },
        latestYear: { $max: '$passedOutYear' },
      },
    },
    { $sort: { count: -1 } },
    {
      $project: {
        _id: 0,
        companyName: '$_id',
        count: 1,
        driveTypes: 1,
        latestYear: 1,
      },
    },
  ]);

  res.status(200).json(new ApiResponse(200, companies));
});
// GET /api/feedback/company/:companyName  — Paginated anonymous feedbacks
// student field is excluded via select('-student') — extra safety layer
exports.getFeedbackByCompany = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const regex = new RegExp(req.params.companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const [feedbacks, total] = await Promise.all([
    Feedback.find({ companyName: regex })
      .select('-student')              // NEVER return student identity
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Feedback.countDocuments({ companyName: regex }),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      feedbacks,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    })
  );
});
// GET /api/feedback/drive/:driveId  — All feedbacks for a specific drive
exports.getFeedbackByDrive = asyncHandler(async (req, res) => {
  const feedbacks = await Feedback.find({ 'driveRef.driveId': req.params.driveId })
    .select('-student')
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, { count: feedbacks.length, feedbacks }));
});
