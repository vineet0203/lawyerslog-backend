const Case = require('./case.model');

const createCase = (req, res) => {
  const { fullName, email, phoneNumber, address, city, state, incidentType, incidentDate, incidentLocation, policeReportAvail, incidentDescription, insuranceCompany, policyNumber, injuryDescription } = req.body;

  if (!incidentType) return res.status(400).json({ success: false, message: 'Incident type is required' });
  if (!incidentDate || isNaN(new Date(incidentDate).getTime())) return res.status(400).json({ success: false, message: 'Valid incident date is required' });
  if (!incidentLocation) return res.status(400).json({ success: false, message: 'Incident location is required' });
  if (!incidentDescription) return res.status(400).json({ success: false, message: 'Description is required' });

  Case.create({
    userId: req.user._id,
    fullName, email, phoneNumber, address, city, state,
    incidentType, incidentDate: new Date(incidentDate),
    incidentLocation, policeReportAvail, incidentDescription,
    insuranceCompany, policyNumber, injuryDescription
  }).then(newCase => {
    res.status(201).json({ success: true, message: 'Case submitted successfully', case: newCase });
  }).catch(error => {
    res.status(500).json({ success: false, message: error.message });
  });
};

const getCases = (req, res) => {
  let query = {};
  if (req.user.role === 'claimant') query = { userId: req.user._id };
  else if (req.user.role === 'lawyer') query = { lawyerId: req.user._id };
  else if (req.user.role === 'insurance') query = { insuranceUserId: req.user._id };

  Case.find(query).sort({ createdAt: -1 }).then(cases => {
    res.status(200).json({ success: true, count: cases.length, cases });
  }).catch(error => {
    res.status(500).json({ success: false, message: error.message });
  });
};

const getCaseById = (req, res) => {
  Case.findById(req.params.id).then(caseData => {
    if (!caseData) return res.status(404).json({ success: false, message: 'Case not found' });
    res.status(200).json({ success: true, case: caseData });
  }).catch(error => {
    res.status(500).json({ success: false, message: error.message });
  });
};

const assignLawyer = (req, res) => {
  Case.findByIdAndUpdate(req.params.id, { lawyerId: req.user._id, status: 'lawyer_assigned' }, { new: true }).then(caseData => {
    if (!caseData) return res.status(404).json({ success: false, message: 'Case not found' });
    res.status(200).json({ success: true, case: caseData });
  }).catch(error => {
    res.status(500).json({ success: false, message: error.message });
  });
};

const updateCaseStatus = (req, res) => {
  const validStatuses = ['submitted', 'lawyer_assigned', 'documents_requested', 'insurance_review', 'negotiation', 'settlement_in_progress', 'closed'];
  const status = req.body.status;
  if (!validStatuses.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

  Case.findByIdAndUpdate(req.params.id, { status }, { new: true }).then(caseData => {
    if (!caseData) return res.status(404).json({ success: false, message: 'Case not found' });
    res.status(200).json({ success: true, case: caseData });
  }).catch(error => {
    res.status(500).json({ success: false, message: error.message });
  });
};

module.exports = { createCase, getCases, getCaseById, assignLawyer, updateCaseStatus };
