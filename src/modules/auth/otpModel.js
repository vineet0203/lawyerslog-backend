const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    otp: { type: String, required: true },
    password: { type: String, default: '' },
    name: { type: String, default: '' },
    role: { type: String, enum: ['claimant', 'lawyer', 'insurance'], default: 'claimant' },
    purpose: { type: String, enum: ['signup', 'reset'], required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }
  },
  { timestamps: true }
);

otpSchema.index({ email: 1, purpose: 1 }, { unique: true });

module.exports = mongoose.models.Otp || mongoose.model('Otp', otpSchema);
