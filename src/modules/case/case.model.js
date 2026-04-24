const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  caseId: { type: String, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lawyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  insuranceUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  fullName: { type: String, default: '' },
  email: { type: String, default: '' },
  phoneNumber: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  incidentType: { type: String, enum: ['Car Accident', 'Slip & Fall', 'Medical Malpractice', 'Workplace Injury', 'Other'], required: true },
  incidentDate: { type: Date, required: true },
  incidentLocation: { type: String, required: true },
  policeReportAvail: { type: String, enum: ['yes', 'no'], default: 'no' },
  incidentDescription: { type: String, default: '' },
  insuranceCompany: { type: String, default: '' },
  policyNumber: { type: String, default: '' },
  injuryDescription: { type: String, default: '' },
  medicalReportPath: { type: String, default: '' },
  accidentPhotosPath: { type: String, default: '' },
  insurancePolicyPath: { type: String, default: '' },
  policeReportPath: { type: String, default: '' },
  witnessDocPath: { type: String, default: '' },
  status: {
    type: String,
    enum: ['submitted', 'lawyer_assigned', 'documents_requested', 'insurance_review', 'negotiation', 'settlement_in_progress', 'closed'],
    default: 'submitted'
  },
  settlement: {
    amount: { type: Number, default: 0 },
    approvedByClaimant: { type: Boolean, default: false },
    approvedByInsurance: { type: Boolean, default: false },
    paymentTimeline: { type: String, default: '' }
  },
  internalNotes: { type: String, default: '' }
}, { timestamps: true });

caseSchema.pre('save', function() {
  if (!this.caseId) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.caseId = `LL-${timestamp}-${random}`;
  }
});

module.exports = mongoose.model('Case', caseSchema);
