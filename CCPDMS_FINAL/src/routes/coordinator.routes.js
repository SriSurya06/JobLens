const express = require('express');
const router  = express.Router();
const coordCtrl    = require('../controllers/coordinator.controller');
const { protect }  = require('../middleware/auth.middleware');
const { authorize }= require('../middleware/role.middleware');
// All coordinator routes require coordinator role
router.use(protect, authorize('coordinator'));
// Dashboard — batch-wise pie chart data
router.get('/dashboard', coordCtrl.getDashboard);
// Detailed placement stats for a batch
router.get('/placement-stats/:batch', coordCtrl.getPlacementStats);
// Student list with filters (CGPA, batch, branch, backlogs)
router.get('/students', coordCtrl.getStudentList);

// Available student skills
router.get('/students/skills', coordCtrl.getStudentSkills);

// Single student full profile
router.get('/students/:studentId', coordCtrl.getStudentDetail);
// Bulk notification email
router.post('/notify', coordCtrl.sendNotification);
// Audit logs
router.get('/audit-logs', coordCtrl.getAuditLogs);
module.exports = router;