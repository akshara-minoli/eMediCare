const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true, // links to auth-service user ID
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
      lowercase: true,
    },
    specialty: {
      type: String,
      required: [true, 'Specialty is required'],
      enum: [
        'General Physician',
        'Cardiologist',
        'Dermatologist',
        'Neurologist',
        'Orthopedist',
        'Pediatrician',
        'Psychiatrist',
        'Gynecologist',
        'Ophthalmologist',
        'ENT Specialist',
        'Other',
      ],
    },
    qualifications: [{ type: String }],
    experience: {
      type: Number, // years
      default: 0,
    },
    consultationFee: {
      type: Number,
      required: true,
    },
    availableSlots: [
      {
        day:       { type: String }, // e.g. "Monday"
        startTime: { type: String }, // e.g. "09:00"
        endTime:   { type: String }, // e.g. "17:00"
      },
    ],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    bio: {
      type: String,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Doctor', doctorSchema);
