const express = require('express');
const router  = express.Router();
const studentCtrl = require('../controllers/student.controller');
const { protect }    = require('../middleware/auth.middleware');
const { authorize }  = require('../middleware/role.middleware');
const { uploadResume } = require('../middleware/upload.middleware');
// All student routes require authentication
router.use(protect);
// ── Profile ─────────────────────────────────────────────────────────────────
router.get('/profile',  authorize('student'), studentCtrl.getProfile);
router.patch('/profile',authorize('student'), studentCtrl.updateProfile);
// ── Resume ──────────────────────────────────────────────────────────────────
router.post('/resume',  authorize('student'), uploadResume, studentCtrl.uploadResume);
// ── Dashboard ───────────────────────────────────────────────────────────────
router.get('/dashboard',authorize('student'), studentCtrl.getDashboard);
// ── On-Campus Drive Visibility ──────────────────────────────────────────────
router.get('/drives/oncampus',                      authorize('student'), studentCtrl.getOnCampusDrives);
router.post('/drives/oncampus/:driveId/apply',      authorize('student'), studentCtrl.applyToDrive);
router.get('/drives/oncampus/:driveId/status',      authorize('student'), studentCtrl.getApplicationStatus);
// ── Off-Campus Drive Feed ────────────────────────────────────────────────────
router.get('/drives/offcampus',                     authorize('student'), studentCtrl.getOffCampusFeed);
// ── AI Features ─────────────────────────────────────────────────────────────
router.post('/job-links',    authorize('student'), studentCtrl.generateJobLinks);
router.post('/resume-match', authorize('student'), studentCtrl.resumeMatch);
// ── Notifications ────────────────────────────────────────────────────────────
router.get('/notifications',            authorize('student'), studentCtrl.getNotifications);
router.patch('/notifications/read-all', authorize('student'), studentCtrl.markAllNotificationsRead);
router.patch('/notifications/:id/read', authorize('student'), studentCtrl.markNotificationRead);
router.delete('/notifications',         authorize('student'), studentCtrl.clearNotifications);
router.delete('/notifications/:id',     authorize('student'), studentCtrl.clearNotification);
module.exports = router;