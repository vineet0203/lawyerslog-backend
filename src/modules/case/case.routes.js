const express = require('express');
const router = express.Router();
const { createCase, getCases, getCaseById, assignLawyer, updateCaseStatus } = require('./case.controller');
const { protect } = require('../../middleware/auth');

router.post('/', protect, createCase);
router.get('/', protect, getCases);
router.get('/:id', protect, getCaseById);
router.patch('/:id/assign-lawyer', protect, assignLawyer);
router.patch('/:id/status', protect, updateCaseStatus);

module.exports = router;
