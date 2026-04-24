const Case = require('./case.model');

const requiredFields = [
  'fullName',
  'email',
  'phoneNumber',
  'address',
  'city',
  'state',
  'incidentType',
  'incidentDate',
  'incidentLocation',
  'policeReportAvail',
  'incidentDescription',
  'insuranceCompany',
  'policyNumber',
  'injuryDescription'
];

const validIncidentTypes = ['Car Accident', 'Slip & Fall', 'Medical Malpractice', 'Workplace Injury', 'Other'];

const validateCasePayload = (body) => {
  const missingFields = requiredFields.filter((field) => !body[field]);
  if (missingFields.length > 0) {
    return {
      ok: false,
      status: 400,
      payload: {
        success: false,
        message: 'Missing required fields',
        errors: missingFields
      }
    };
  }

  if (!validIncidentTypes.includes(body.incidentType)) {
    return {
      ok: false,
      status: 400,
      payload: {
        success: false,
        message: 'Invalid incident type'
      }
    };
  }

  if (!['yes', 'no'].includes(body.policeReportAvail)) {
    return {
      ok: false,
      status: 400,
      payload: {
        success: false,
        message: 'Police report availability must be yes or no'
      }
    };
  }

  const parsedIncidentDate = new Date(body.incidentDate);
  if (isNaN(parsedIncidentDate.getTime())) {
    return {
      ok: false,
      status: 400,
      payload: {
        success: false,
        message: 'Invalid incident date'
      }
    };
  }

  return {
    ok: true,
    parsedIncidentDate
  };
};

const createCase = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      address,
      city,
      state,
      incidentType,
      incidentDate,
      incidentLocation,
      policeReportAvail,
      incidentDescription,
      insuranceCompany,
      policyNumber,
      injuryDescription
    } = req.body;

    const validation = validateCasePayload(req.body);
    if (!validation.ok) {
      return res.status(validation.status).json(validation.payload);
    }
    const parsedIncidentDate = validation.parsedIncidentDate;

    // Build document paths from uploaded files
    const documentPaths = {
      medicalReportPath: req.files?.medicalReport?.[0]?.path || null,
      accidentPhotosPath: req.files?.accidentPhotos?.[0]?.path || null,
      insurancePolicyPath: req.files?.insurancePolicy?.[0]?.path || null,
      policeReportPath: req.files?.policeReport?.[0]?.path || null,
      witnessDocPath: req.files?.witnessDoc?.[0]?.path || null
    };

    // Create new case with all fields
    const newCase = await Case.create({
      fullName: fullName.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      incidentType,
      incidentDate: parsedIncidentDate,
      incidentLocation: incidentLocation.trim(),
      policeReportAvail,
      incidentDescription: incidentDescription.trim(),
      insuranceCompany: insuranceCompany.trim(),
      policyNumber: policyNumber.trim(),
      injuryDescription: injuryDescription.trim(),
      userId: req.user._id,
      ...documentPaths,
      status: 'submitted'
    });

    res.status(201).json({
      success: true,
      message: 'Case submitted successfully',
      caseId: newCase._id
    });
  } catch (error) {
    // Clean up uploaded files if case creation fails
    if (req.files) {
      const fs = require('fs');
      Object.values(req.files).forEach(fileArr => {
        fileArr.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating case'
    });
  }
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

const updateCase = async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id);
    if (!caseData) return res.status(404).json({ success: false, message: 'Case not found' });

    if (caseData.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const validation = validateCasePayload(req.body);
    if (!validation.ok) {
      return res.status(validation.status).json(validation.payload);
    }

    caseData.fullName = req.body.fullName.trim();
    caseData.email = req.body.email.trim();
    caseData.phoneNumber = req.body.phoneNumber.trim();
    caseData.address = req.body.address.trim();
    caseData.city = req.body.city.trim();
    caseData.state = req.body.state.trim();
    caseData.incidentType = req.body.incidentType;
    caseData.incidentDate = validation.parsedIncidentDate;
    caseData.incidentLocation = req.body.incidentLocation.trim();
    caseData.policeReportAvail = req.body.policeReportAvail;
    caseData.incidentDescription = req.body.incidentDescription.trim();
    caseData.insuranceCompany = req.body.insuranceCompany.trim();
    caseData.policyNumber = req.body.policyNumber.trim();
    caseData.injuryDescription = req.body.injuryDescription.trim();

    await caseData.save();

    res.status(200).json({
      success: true,
      message: 'Case updated successfully',
      case: caseData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error updating case' });
  }
};

const deleteCase = async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id);
    if (!caseData) return res.status(404).json({ success: false, message: 'Case not found' });

    if (caseData.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await Case.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Case deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error deleting case' });
  }
};
const assignLawyer = async (req, res) => {
  try {
    const caseData = await Case.findByIdAndUpdate(
      req.params.id,
      { lawyerId: req.user._id, status: 'lawyer_assigned' },
      { new: true }
    );
    if (!caseData) return res.status(404).json({ success: false, message: 'Case not found' });
    res.status(200).json({ success: true, case: caseData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
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
module.exports = { createCase, getCases, getCaseById, updateCase, deleteCase, assignLawyer, updateCaseStatus };
