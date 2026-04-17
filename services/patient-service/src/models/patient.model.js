const mongoose = require('mongoose');

// Patient profile keeps demographics, clinical snapshots, and uploaded report metadata.
const patientSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true, // links to auth-service user ID
      unique: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: '',
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      default: 'prefer_not_to_say',
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
      default: '',
    },
    // Embedded address avoids extra joins for common profile reads.
    address: {
      street:  { type: String, default: '' },
      city:    { type: String, default: '' },
      state:   { type: String, default: '' },
      country: { type: String, default: '' },
      zip:     { type: String, default: '' },
    },
    medicalHistory: [
      {
        condition:  { type: String },
        diagnosedAt: { type: Date },
        notes:      { type: String },
      },
    ],
    // Metadata only; the actual file is served from uploads directory.
    reports: [
      {
        originalName: { type: String, required: true },
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        mimeType: { type: String, default: 'application/pdf' },
        size: { type: Number, default: 0 },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    allergies: [{ type: String }],
    currentMedications: [{ type: String }],
    emergencyContact: {
      name:         { type: String, default: '' },
      relationship: { type: String, default: '' },
      phone:        { type: String, default: '' },
    },
    avatar: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);
