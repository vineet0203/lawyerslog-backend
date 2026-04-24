const express = require('express');
const router = express.Router();
const { createCase, getCases, getCaseById, updateCase, deleteCase, assignLawyer, updateCaseStatus } = require('./case.controller');
const { protect } = require('../../middleware/auth');
const upload = require('../../middleware/upload');
const allowRoles = require('../../middleware/roleCheck');

router.use(protect);

// POST - Create new case with file uploads
router.post('/', 
  upload.fields([
    { name: 'medicalReport', maxCount: 1 },
    { name: 'accidentPhotos', maxCount: 1 },
    { name: 'insurancePolicy', maxCount: 1 },
    { name: 'policeReport', maxCount: 1 },
    { name: 'witnessDoc', maxCount: 1 }
  ]),
  allowRoles('claimant'), 
  createCase
);

router.get('/', getCases);
router.get('/:id', getCaseById);
router.put('/:id', allowRoles('claimant'), updateCase);
router.delete('/:id', allowRoles('claimant'), deleteCase);
router.patch('/:id/assign-lawyer', allowRoles('lawyer'), assignLawyer);
router.patch('/:id/status', allowRoles('lawyer', 'insurance'), updateCaseStatus);

module.exports = router;
