const router = require('express').Router();
const Doctor = require('../models/doctor.model');

// ── GET /api/doctors — List all (with filters) ─────────────
router.get('/', async (req, res) => {
  try {
    const { specialty, isAvailable, search, verificationStatus, status } = req.query;
    const filter = {};

    if (specialty)    filter.specialty   = specialty;
    if (isAvailable)  filter.isAvailable = isAvailable === 'true';
    if (search)       filter.name        = { $regex: search, $options: 'i' };
    if (verificationStatus) filter.verificationStatus = verificationStatus;
    if (status) filter.verificationStatus = status;

    const doctors = await Doctor.find(filter).sort({ rating: -1 });
    res.json({ count: doctors.length, doctors });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /api/doctors/pending — pending verification list ───
router.get('/pending', async (req, res) => {
  try {
    const doctors = await Doctor.find({ verificationStatus: 'pending' }).sort({ createdAt: -1 });
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
    const verificationStatus = req.body.verificationStatus || req.body.status || 'pending';
    const payload = {
      ...req.body,
      verificationStatus,
      isVerified: verificationStatus === 'approved' ? true : !!req.body.isVerified,
    };

    const doctor = await Doctor.create(payload);
    res.status(201).json({ message: 'Doctor profile created', doctor });
  } catch (err) {
    res.status(400).json({ message: 'Validation error', error: err.message });
  }
});

// ── PUT /api/doctors/:id/status — verify/reject doctor ─────
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      {
        verificationStatus: status,
        isVerified: status === 'approved',
      },
      { new: true, runValidators: true }
    );

    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json({ message: 'Doctor status updated', doctor });
  } catch (err) {
    res.status(400).json({ message: 'Update failed', error: err.message });
  }
});

// ── PATCH /api/doctors/:id/block — block doctor access ─────
router.patch('/:id/block', async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { isAvailable: false },
      { new: true }
    );

    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json({ message: 'Doctor blocked', doctor });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
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
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json({ message: 'Doctor profile deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
