const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: '', trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['claimant', 'lawyer', 'insurance'], default: 'claimant' },
    phone: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    licenseNumber: { type: String, default: '' },
    practiceArea: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
    companyName: { type: String, default: '' }
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
