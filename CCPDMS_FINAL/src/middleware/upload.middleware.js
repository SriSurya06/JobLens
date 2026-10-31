const multer = require('multer');
const path   = require('path');
const { ApiError } = require('../utils/ApiResponse');
const MAX_BYTES = (Number(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024;
// ── Dynamic disk storage factory ──────────────────────────────────────────────
const diskStorage = (folder) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, `uploads/${folder}`),
    filename:    (_req, file, cb) => {
      const ts     = Date.now();
      const rand   = Math.round(Math.random() * 1e9);
      const ext    = path.extname(file.originalname).toLowerCase();
      cb(null, `${ts}-${rand}${ext}`);
    },
  });
// ── MIME type filter factory ───────────────────────────────────────────────────
const mimeFilter = (allowedMimes) => (_req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) return cb(null, true);
  cb(
    new ApiError(400, `Invalid file type "${file.mimetype}". Allowed: ${allowedMimes.join(', ')}`),
    false
  );
};
// ── Wrap multer to pass its errors into Express error middleware ───────────────
const wrap = (uploadFn) => (req, res, next) =>
  uploadFn(req, res, (err) => {
    if (err instanceof multer.MulterError)
      return next(new ApiError(400, `File upload error: ${err.message}`));
    if (err) return next(err);
    next();
  });
// ── Exported middlewares ───────────────────────────────────────────────────────
/** Resume: PDF only → uploads/resumes/ */
exports.uploadResume = wrap(
  multer({
    storage:    diskStorage('resumes'),
    limits:     { fileSize: MAX_BYTES },
    fileFilter: mimeFilter(['application/pdf']),
  }).single('resume')
);
/** Drive document: PDF / DOC / DOCX → uploads/drive-docs/ */
exports.uploadDriveDoc = wrap(
  multer({
    storage:    diskStorage('drive-docs'),
    limits:     { fileSize: MAX_BYTES },
    fileFilter: mimeFilter([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]),
  }).single('document')
);
/**
 * Round result files:
 * XLS / XLSX / PDF → uploads/round-results/
 */
exports.uploadExcel = wrap(
  multer({
    storage: diskStorage('round-results'),
    limits: { fileSize: MAX_BYTES },
    fileFilter: mimeFilter([
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/pdf',
    ]),
  }).single('file')
);

/**
 * Eligibility student list: XLS / XLSX / PDF
 * → uploads/eligibility-lists/
 */
exports.uploadEligibilityList = wrap(
  multer({
    storage: diskStorage('eligibility-lists'),
    limits: { fileSize: MAX_BYTES },
    fileFilter: mimeFilter([
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/pdf',
    ]),
  }).single('eligibilityList')
);

/**
 * On-campus drive files:
 * - document → Job Description
 * - eligibilityList → Student eligibility list
 */
const onCampusDriveStorage = multer.diskStorage({
  destination: (_req, file, cb) => {
    if (file.fieldname === 'eligibilityList') {
      cb(null, 'uploads/eligibility-lists');
    } else {
      cb(null, 'uploads/drive-docs');
    }
  },

  filename: (_req, file, cb) => {
    const ts = Date.now();
    const rand = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();

    cb(null, `${ts}-${rand}${ext}`);
  },
});

exports.uploadOnCampusDriveFiles = wrap(
  multer({
    storage: onCampusDriveStorage,
    limits: { fileSize: MAX_BYTES },

    fileFilter: (_req, file, cb) => {
      const allowed = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];

      if (allowed.includes(file.mimetype)) {
        return cb(null, true);
      }

      cb(
        new ApiError(
          400,
          `Invalid file type "${file.mimetype}". Allowed: PDF, DOC, DOCX, XLS, XLSX`
        ),
        false
      );
    },
  }).fields([
    { name: 'document', maxCount: 1 },
    { name: 'eligibilityList', maxCount: 1 },
  ])
);