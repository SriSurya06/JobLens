const express = require('express');
const router  = express.Router();
const feedbackCtrl = require('../controllers/feedback.controller');
const { protect }  = require('../middleware/auth.middleware');
const { authorize }= require('../middleware/role.middleware');
router.use(protect);
// Student submits anonymous feedback
router.post('/', authorize('student'), feedbackCtrl.submitFeedback);
// Both roles: browse company list and feedbacks
router.get('/companies',                    authorize('coordinator', 'student'), feedbackCtrl.getCompaniesWithFeedback);
router.get('/company/:companyName',         authorize('coordinator', 'student'), feedbackCtrl.getFeedbackByCompany);
router.get('/drive/:driveId',               authorize('coordinator', 'student'), feedbackCtrl.getFeedbackByDrive);
module.exports = router;