const router = require('express').Router();
const path = require('path');
const multer = require('multer');
const Patient = require('../models/patient.model');

const uploadDir = path.join(__dirname, '../../uploads/patient-reports');
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    return cb(null, true);
  },
});

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

// ── POST /api/patients/:userId/reports — Upload PDF report ─
router.post('/:userId/reports', (req, res) => {
  upload.single('report')(req, res, async (err) => {
    if (err) {
      const message = err.message || 'Failed to upload report';
      const status = message.includes('Only PDF') ? 400 : 500;
      return res.status(status).json({ message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: 'PDF report file is required' });
      }

      const patient = await Patient.findOne({ userId: req.params.userId });
      if (!patient) return res.status(404).json({ message: 'Patient not found' });

      const report = {
        originalName: req.file.originalname,
        fileName: req.file.filename,
        fileUrl: `/api/patients/reports/${req.file.filename}`,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date(),
      };

      patient.reports = [...(patient.reports || []), report];
      await patient.save();

      return res.status(201).json({ message: 'Report uploaded successfully', report });
    } catch (saveErr) {
      return res.status(500).json({ message: 'Failed to save report metadata', error: saveErr.message });
    }
  });
});

// ── GET /api/patients/:userId/reports — List patient reports ─
router.get('/:userId/reports', async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.params.userId }).select('reports');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const reports = (patient.reports || []).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    res.json({ count: reports.length, reports });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch reports', error: err.message });
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
