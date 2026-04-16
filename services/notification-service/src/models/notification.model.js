const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['ADMIN_ANNOUNCEMENT', 'APPOINTMENT_REMINDER', 'PRESCRIPTION_UPDATE', 'LAB_REPORT', 'PAYMENT_RECEIPT'],
    default: 'ADMIN_ANNOUNCEMENT'
  },
  recipient: {
    type: String, // email or 'all'
    required: true,
    index: true
  },
  message: {
    type: String,
    required: true
  },
  channel: {
    type: String,
    enum: ['email', 'sms', 'push', 'system'],
    default: 'system'
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'read', 'failed'],
    default: 'sent'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
