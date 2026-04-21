const Case = require('./case.model');
const createCase = async (req, res) => {
  try {
    const { incidentType, incidentDate, incidentLocation, description, insurancePolicyNumber, hasPoliceReport, hasMedicalInjury } = req.body;

    const validIncidentTypes = ['auto_accident', 'personal_injury', 'property_damage', 'medical_malpractice', 'other'];
    if (!incidentType || !validIncidentTypes.includes(incidentType)) {
      return res.status(400).json({ success: false, message: 'Valid incident type is required' });
    }

    const parsedIncidentDate = new Date(incidentDate);
    if (!incidentDate || Number.isNaN(parsedIncidentDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Valid incident date is required' });
    }

    if (!incidentLocation || !String(incidentLocation).trim()) {
      return res.status(400).json({ success: false, message: 'Incident location is required' });
    }

    if (!description || !String(description).trim()) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }

    const newCase = await Case.create({
      claimant: req.user._id,
      incidentType,
      incidentDate: parsedIncidentDate,
      incidentLocation: String(incidentLocation).trim(),
      description: String(description).trim(),
      insurancePolicyNumber: insurancePolicyNumber ? String(insurancePolicyNumber).trim() : '',
      hasPoliceReport: Boolean(hasPoliceReport),
      hasMedicalInjury: Boolean(hasMedicalInjury)
    });
    res.status(201).json({ success: true, message: 'Case submitted successfully', case: newCase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const getCases = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'claimant') query = { claimant: req.user._id };
    else if (req.user.role === 'lawyer') query = { lawyer: req.user._id };
    else if (req.user.role === 'insurance') query = { insuranceCompany: req.user._id };
    const cases = await Case.find(query)
      .populate('claimant', 'name email phone')
      .populate('lawyer', 'name email')
      .populate('insuranceCompany', 'name companyName')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: cases.length, cases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const getCaseById = async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id)
      .populate('claimant', 'name email phone')
      .populate('lawyer', 'name email practiceArea')
      .populate('insuranceCompany', 'name companyName');
    if (!caseData) return res.status(404).json({ success: false, message: 'Case not found' });
    const userId = req.user._id.toString();
    const isClaimant = caseData.claimant?._id.toString() === userId;
    const isLawyer = caseData.lawyer?._id?.toString() === userId;
    const isInsurance = caseData.insuranceCompany?._id?.toString() === userId;
    if (!isClaimant && !isLawyer && !isInsurance) return res.status(403).json({ success: false, message: 'Access denied to this case' });
    res.status(200).json({ success: true, case: caseData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const assignLawyer = async (req, res) => {
  try {
    const caseData = await Case.findByIdAndUpdate(req.params.id, { lawyer: req.user._id, status: 'lawyer_assigned' }, { new: true });
    if (!caseData) return res.status(404).json({ success: false, message: 'Case not found' });
    res.status(200).json({ success: true, message: 'Case accepted', case: caseData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const updateCaseStatus = async (req, res) => {
  try {
    const status = String(req.body.status || '').trim();
    const validStatuses = ['submitted', 'lawyer_assigned', 'documents_requested', 'insurance_review', 'negotiation', 'settlement_in_progress', 'closed'];
    if (!validStatuses.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status value' });
    const caseData = await Case.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!caseData) return res.status(404).json({ success: false, message: 'Case not found' });
    res.status(200).json({ success: true, message: 'Status updated', case: caseData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
module.exports = { createCase, getCases, getCaseById, assignLawyer, updateCaseStatus };
