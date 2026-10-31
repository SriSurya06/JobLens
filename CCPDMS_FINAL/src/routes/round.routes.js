const express = require('express');
const router  = express.Router();
const roundCtrl    = require('../controllers/round.controller');
const { protect }  = require('../middleware/auth.middleware');
const { authorize }= require('../middleware/role.middleware');
const { uploadExcel } = require('../middleware/upload.middleware');
// All round management is coordinator-only
router.use(protect, authorize('coordinator'));
// Create round for a drive
router.post('/', roundCtrl.createRound);
// Update venue / date / description
router.patch('/:id', roundCtrl.updateRound);
// Get all rounds for a drive (ordered by roundNumber)
router.get('/drive/:driveId', roundCtrl.getRoundsByDrive);
// Upload Excel result files
router.patch('/:id/eligible-list',  uploadExcel, roundCtrl.uploadEligibleList);
router.patch('/:id/attended-list',  uploadExcel, roundCtrl.uploadAttendedList);
router.patch('/:id/qualified-list', uploadExcel, roundCtrl.uploadQualifiedList);
module.exports = router;