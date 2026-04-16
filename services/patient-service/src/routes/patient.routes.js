const router = require('express').Router();
const path = require('path');
const multer = require('multer');
const Patient = require('../models/patient.model');
const {
  getPatientByUserId,
  createPatient,
  updatePatient,
  addMedicalHistory,
} = require('../controllers/patient.controller');
const {
  validateUserIdParam,
  validateCreatePatientBody,
  validateUpdatePatientBody,
  validateMedicalHistoryBody,
} = require('../middleware/validate.middleware');

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

// GET /api/patients
// List all patients with optional status and text search filters.
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

// POST /api/patients
// Create patient profile (usually called right after patient signup).
router.post('/', validateCreatePatientBody, createPatient);

// POST /api/patients/:userId/reports
// Upload one PDF medical report and attach metadata to patient profile.
router.post('/:userId/reports', validateUserIdParam, (req, res) => {
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

// GET /api/patients/:userId/reports
// Return all uploaded reports for one patient.
router.get('/:userId/reports', validateUserIdParam, async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.params.userId }).select('reports');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const reports = (patient.reports || []).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    res.json({ count: reports.length, reports });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch reports', error: err.message });
  }
});

// PATCH /api/patients/:userId/block
// Soft-block patient by setting isActive=false.
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

// DELETE /api/patients/:userId
// Permanently delete one patient profile.
router.delete('/:userId', async (req, res) => {
  try {
    const patient = await Patient.findOneAndDelete({ userId: req.params.userId });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json({ message: 'Patient deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/patients/:userId
// Fetch one patient profile by userId.
router.get('/:userId', validateUserIdParam, getPatientByUserId);

// PUT /api/patients/:userId
// Update patient profile fields.
router.put('/:userId', validateUserIdParam, validateUpdatePatientBody, updatePatient);

// PATCH /api/patients/:userId/history
// Append a new medical history record.
router.patch(
  '/:userId/history',
  validateUserIdParam,
  validateMedicalHistoryBody,
  addMedicalHistory
);

module.exports = router;
