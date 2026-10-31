const express = require('express');
const router  = express.Router();
const onCampusCtrl    = require('../controllers/oncampus.controller');
const { protect }     = require('../middleware/auth.middleware');
const { authorize }   = require('../middleware/role.middleware');
const {
  uploadOnCampusDriveFiles,
} = require('../middleware/upload.middleware');
router.use(protect); // all routes require authentication
// ── COORDINATOR routes ───────────────────────────────────────────────────────
// Create drive (optional document upload)
router.post(
  '/',
  authorize('coordinator'),
  uploadOnCampusDriveFiles,
  onCampusCtrl.createDrive
);
// List all drives with filters
router.get('/', authorize('coordinator'), onCampusCtrl.getAllDrives);
// Update drive (optional document replacement)
router.patch(
  '/:id',
  authorize('coordinator'),
  uploadOnCampusDriveFiles,
  onCampusCtrl.updateDrive
);
// Preview eligible students for a drive
router.get('/:id/eligible-students', authorize('coordinator'), onCampusCtrl.getEligibleStudents);
// View all applicants for a drive (with optional status filter)
router.get('/:id/applications', authorize('coordinator'), onCampusCtrl.getDriveApplications);
// ── BOTH roles ───────────────────────────────────────────────────────────────
// Get single drive details (coordinator + student)
router.get('/:id', authorize('coordinator', 'student'), onCampusCtrl.getDriveById);
module.exports = router;    