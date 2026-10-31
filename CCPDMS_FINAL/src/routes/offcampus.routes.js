const express = require('express');
const router  = express.Router();
const offCampusCtrl = require('../controllers/offcampus.controller');
const { protect }   = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
router.use(protect);
// ── COORDINATOR only ─────────────────────────────────────────────────────────
router.post('/',    authorize('coordinator'), offCampusCtrl.createDrive);
router.get('/',     authorize('coordinator'), offCampusCtrl.getAllDrives);
router.patch('/:id',authorize('coordinator'), offCampusCtrl.updateDrive);
router.delete('/:id',authorize('coordinator'),offCampusCtrl.deleteDrive);
// ── BOTH roles ───────────────────────────────────────────────────────────────
router.get('/:id',  authorize('coordinator', 'student'), offCampusCtrl.getDriveById);
module.exports = router;