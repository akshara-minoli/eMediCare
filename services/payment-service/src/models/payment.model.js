const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: [true, 'Patient ID is required'],
    },
    appointmentId: {
      type: String,
      required: [true, 'Appointment ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    method: {
      type: String,
      enum: ['card', 'upi', 'netbanking', 'wallet', 'stripe'],
      default: 'stripe',
    },
    transactionId: {
      type: String,
    },
    stripeSessionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refunded'],
      default: 'pending',
    },
    // Extra metadata for receipt generation
    patientName: { type: String, default: '' },
    patientEmail: { type: String, default: '' },
    doctorName: { type: String, default: '' },
    appointmentDate: { type: String, default: '' },
    appointmentTime: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
