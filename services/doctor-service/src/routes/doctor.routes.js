const router = require('express').Router();
const Doctor = require('../models/doctor.model');

// ── GET /api/doctors — List all (with filters) ─────────────
router.get('/', async (req, res) => {
  try {
    const { specialty, isAvailable, search } = req.query;
    const filter = {};

    if (specialty)    filter.specialty   = specialty;
    if (isAvailable)  filter.isAvailable = isAvailable === 'true';
    if (search)       filter.name        = { $regex: search, $options: 'i' };

    const doctors = await Doctor.find(filter).sort({ rating: -1 });
    res.json({ count: doctors.length, doctors });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /api/doctors/:id — Get single doctor ───────────────
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json({ doctor });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── POST /api/doctors — Create doctor profile ──────────────
router.post('/', async (req, res) => {
  try {
    const doctor = await Doctor.create(req.body);
    res.status(201).json({ message: 'Doctor profile created', doctor });
  } catch (err) {
    res.status(400).json({ message: 'Validation error', error: err.message });
  }
});

// ── PUT /api/doctors/:id — Update doctor profile ───────────
router.put('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json({ message: 'Doctor profile updated', doctor });
  } catch (err) {
    res.status(400).json({ message: 'Update failed', error: err.message });
  }
});

// ── DELETE /api/doctors/:id — Remove doctor profile ────────
router.delete('/:id', async (req, res) => {
  try {
    await Doctor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Doctor profile deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
