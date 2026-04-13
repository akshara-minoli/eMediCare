const router = require('express').Router();
const Patient = require('../models/patient.model');

// ── GET /api/patients — List all patients ───────────────────
router.get('/', async (req, res) => {
  try {
    const { isActive, search } = req.query;
    const filter = {};

    if (typeof isActive === 'string') {
      filter.isActive = isActive === 'true';
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const patients = await Patient.find(filter).sort({ createdAt: -1 });
    res.json({ count: patients.length, patients });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /api/patients/:userId — Get patient by userId ──────
router.get('/:userId', async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.params.userId });
    if (!patient) return res.status(404).json({ message: 'Patient profile not found' });
    res.json({ patient });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── POST /api/patients — Create patient profile ─────────────
router.post('/', async (req, res) => {
  try {
    const existing = await Patient.findOne({ userId: req.body.userId });
    if (existing) return res.status(409).json({ message: 'Patient profile already exists' });

    const patient = await Patient.create(req.body);
    res.status(201).json({ message: 'Patient profile created', patient });
  } catch (err) {
    res.status(400).json({ message: 'Validation error', error: err.message });
  }
});

// ── PUT /api/patients/:userId — Update patient profile ──────
router.put('/:userId', async (req, res) => {
  try {
    const patient = await Patient.findOneAndUpdate(
      { userId: req.params.userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json({ message: 'Patient profile updated', patient });
  } catch (err) {
    res.status(400).json({ message: 'Update failed', error: err.message });
  }
});

// ── PATCH /api/patients/:userId/history — Add medical record
router.patch('/:userId/history', async (req, res) => {
  try {
    const patient = await Patient.findOneAndUpdate(
      { userId: req.params.userId },
      { $push: { medicalHistory: req.body } },
      { new: true }
    );
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json({ message: 'Medical history updated', patient });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── PATCH /api/patients/:userId/block — block patient ───────
router.patch('/:userId/block', async (req, res) => {
  try {
    const patient = await Patient.findOneAndUpdate(
      { userId: req.params.userId },
      { isActive: false },
      { new: true }
    );
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json({ message: 'Patient blocked', patient });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── DELETE /api/patients/:userId — delete patient profile ───
router.delete('/:userId', async (req, res) => {
  try {
    const patient = await Patient.findOneAndDelete({ userId: req.params.userId });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json({ message: 'Patient deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
