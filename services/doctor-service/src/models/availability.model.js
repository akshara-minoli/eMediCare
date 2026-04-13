const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
    },
    timeSlots: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'availability',
  }
);

availabilitySchema.index({ doctorId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Availability', availabilitySchema);
