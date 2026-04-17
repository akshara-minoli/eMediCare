const Appointment = require('../models/appointment.model');

// Get all appointments with optional filters
exports.getAppointments = async (req, res) => {
  try {
    const { patientId, doctorId, status } = req.query;
    const filter = {};
    if (patientId) filter.patientId = patientId;
    if (doctorId) filter.doctorId = doctorId;
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter).sort({ date: 1, time: 1 });
    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get single appointment by ID
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json({ appointment });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Book a new appointment with double-booking prevention
exports.bookAppointment = async (req, res) => {
  try {
    const { patientId, doctorId, date, time, type, notes } = req.body;

    if (!patientId || !doctorId || !date || !time) {
      return res.status(400).json({ message: 'patientId, doctorId, date, and time are required.' });
    }

    // Double-booking prevention: same doctor + same date + same time slot
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);
    const nextDay = new Date(normalizedDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const existing = await Appointment.findOne({
      doctorId,
      time,
      date: { $gte: normalizedDate, $lt: nextDay },
      status: { $in: ['pending', 'confirmed'] },
    });

    if (existing) {
      return res.status(409).json({
        message: 'This time slot is already booked for the selected doctor. Please choose a different time.',
      });
    }

    // Prevent same patient booking same doctor same slot
    const patientConflict = await Appointment.findOne({
      patientId,
      date: { $gte: normalizedDate, $lt: nextDay },
      time,
      status: { $in: ['pending', 'confirmed'] },
    });

    if (patientConflict) {
      return res.status(409).json({
        message: 'You already have an appointment at this date and time.',
      });
    }

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      date: normalizedDate,
      time,
      type: type || 'in-person',
      notes: notes || '',
    });

    res.status(201).json({ message: 'Appointment booked successfully', appointment });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update appointment status
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${allowed.join(', ')}` });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json({ message: 'Status updated', appointment });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update full appointment details
exports.updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json({ message: 'Appointment updated', appointment });
  } catch (err) {
    res.status(400).json({ message: 'Update failed', error: err.message });
  }
};

// Cancel (Soft Delete) appointment - usually for patients/doctors
exports.cancelAppointment = async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });

    if (!['pending', 'confirmed'].includes(appt.status)) {
      return res.status(400).json({
        message: `Cannot cancel an appointment with status '${appt.status}'.`,
      });
    }

    appt.status = 'cancelled';
    await appt.save();

    res.json({ message: 'Appointment cancelled successfully', appointment: appt });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Permanent (Hard Delete) appointment - usually for admin
exports.deleteAppointment = async (req, res) => {
  try {
    const deleted = await Appointment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Appointment not found' });
    res.json({ message: 'Appointment deleted permanently' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
