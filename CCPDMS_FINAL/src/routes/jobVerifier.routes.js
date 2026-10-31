'use strict';
const express = require('express');
const router  = express.Router();
const jobVerifierCtrl = require('../controllers/jobVerifier.controller');
const { protect }     = require('../middleware/auth.middleware');
const { authorize }   = require('../middleware/role.middleware');
// All routes below require authentication
router.use(protect);
// ── Check Job Authenticity ───────────────────────────────────────────────────
// POST /api/student/job-verifier/check
router.post('/check', authorize('student'), jobVerifierCtrl.checkJobAuthenticity);
// ── Verification History ─────────────────────────────────────────────────────
// GET /api/student/job-verifier/history
router.get('/history', authorize('student'), jobVerifierCtrl.getVerificationHistory);
module.exports = router;