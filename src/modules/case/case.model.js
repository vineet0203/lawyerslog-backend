const mongoose = require('mongoose');
const caseSchema = new mongoose.Schema({
  caseId: { type: String, unique: true },
  claimant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lawyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  insuranceCompany: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  incidentType: { type: String, enum: ['auto_accident', 'personal_injury', 'property_damage', 'medical_malpractice', 'other'], required: true },
  incidentDate: { type: Date, required: true },
  incidentLocation: { type: String, required: true },
  description: { type: String, required: true },
  insurancePolicyNumber: { type: String, default: '' },
  hasPoliceReport: { type: Boolean, default: false },
  hasMedicalInjury: { type: Boolean, default: false },
  documents: [{
    fileName: String,
    fileUrl: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now }
  }],
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
caseSchema.pre('save', function (next) {
  if (!this.caseId) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.caseId = `LL-${timestamp}-${random}`;
  }
  next();
});
module.exports = mongoose.model('Case', caseSchema);
