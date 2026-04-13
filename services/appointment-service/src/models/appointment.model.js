const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: [true, 'Patient ID is required'],
    },
    doctorId: {
      type: String,
      required: [true, 'Doctor ID is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    time: {
      type: String,
      required: [true, 'Time slot is required'],
    },
    type: {
      type: String,
      enum: ['in-person', 'video', 'phone'],
      default: 'in-person',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    confirmedByDoctorId: {
      type: String,
      default: '',
    },
    confirmedByDoctorUserId: {
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

module.exports = mongoose.model('Appointment', appointmentSchema);
