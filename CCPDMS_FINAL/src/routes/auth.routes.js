const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
// Public routes
router.post('/login', authCtrl.login);
router.post('/forgot-password', authCtrl.forgotPassword);
router.post('/reset-password', authCtrl.resetPassword);
// Protected routes (token required; change-password is exempt from isFirstLogin check in middleware)
router.patch('/change-password', protect, authCtrl.changePassword);
router.get('/me', protect, authCtrl.getMe);
module.exports = router;