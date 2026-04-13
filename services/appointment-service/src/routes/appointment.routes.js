const router = require('express').Router();
const Appointment = require('../models/appointment.model');

// ── GET /api/appointments ─────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { patientId, doctorId } = req.query;
    const filter = {};
    if (patientId) filter.patientId = patientId;
    if (doctorId) filter.doctorId = doctorId;

    const appointments = await Appointment.find(filter).sort({ date: 1 });
    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── POST /api/appointments/book ───────────────────────────────
router.post('/book', async (req, res) => {
  try {
    const { patientId, doctorId, date, time, type, notes } = req.body;

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      date,
      time,
      type: type || 'in-person',
      notes,
    });

    res.status(201).json({ message: 'Appointment booked', appointment });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── PATCH /api/appointments/:id/status ───────────────────────
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
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
});

// ── PUT /api/appointments/:id — update appointment ───────────
router.put('/:id', async (req, res) => {
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
});

// ── DELETE /api/appointments/:id ──────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Appointment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Appointment not found' });
    res.json({ message: 'Appointment cancelled' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
