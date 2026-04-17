const mongoose = require('mongoose');

// Session document tracks one doctor-patient consultation lifecycle.
const sessionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      required: [true, 'Appointment ID is required'],
      trim: true,
    },
    doctorId: {
      type: String,
      required: [true, 'Doctor ID is required'],
      trim: true,
    },
    patientId: {
      type: String,
      required: [true, 'Patient ID is required'],
      trim: true,
    },
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'waiting', 'active', 'ended', 'missed'],
      default: 'scheduled',
      index: true,
    },
    type: {
      type: String,
      enum: ['video', 'audio'],
      default: 'video',
    },
    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    durationMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    prescription: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

// Common dashboard queries are optimized with compound indexes.
sessionSchema.index({ doctorId: 1, scheduledAt: -1 });
sessionSchema.index({ patientId: 1, scheduledAt: -1 });
sessionSchema.index({ appointmentId: 1 }, { unique: true });

module.exports = mongoose.model('Session', sessionSchema);