const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      required: [true, 'Appointment ID is required'],
    },
    doctorId: {
      type: String,
      required: [true, 'Doctor ID is required'],
    },
    patientId: {
      type: String,
      required: [true, 'Patient ID is required'],
    },
    roomId: {
      type: String,
      unique: true,
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'waiting', 'active', 'ended', 'missed'],
      default: 'scheduled',
    },
    type: {
      type: String,
      enum: ['video', 'audio'],
      default: 'video',
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
    recordingUrl: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    prescription: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Session', sessionSchema);
