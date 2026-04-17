const router = require('express').Router();
const axios = require('axios');
const Doctor = require('../models/doctor.model');
const Availability = require('../models/availability.model');
const Prescription = require('../models/prescription.model');
const doctorAuth = require('../middleware/doctorAuth.middleware');

const clients = {
  auth: axios.create({
    baseURL: process.env.AUTH_SERVICE_URL || 'http://localhost:5001/api/auth',
  }),
  appointment: axios.create({
    baseURL: process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:5002/api/appointments',
  }),
  patient: axios.create({
    baseURL: process.env.PATIENT_SERVICE_URL || 'http://localhost:5007/api/patients',
  }),
  telemedicine: axios.create({
    baseURL: process.env.TELEMEDICINE_SERVICE_URL || 'http://localhost:5008/api/telemedicine',
  }),
};

async function resolveDoctorFromToken(req) {
  let doctor = await Doctor.findOne({ userId: req.user.id });
  if (doctor) return doctor;

  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  try {
    const authMe = await clients.auth.get('/me', {
      headers: { Authorization: authHeader },
    });
    const email = authMe.data?.user?.email;
    if (!email) return null;

    doctor = await Doctor.findOne({ email: email.toLowerCase() });
    if (!doctor) return null;

    // Backfill link for legacy records created without consistent userId mapping.
    doctor.userId = req.user.id;
    await doctor.save();
    return doctor;
  } catch {
    return null;
  }
}

async function createDoctorProfileFromAuth(req) {
  try {
    const authMe = await clients.auth.get('/me', {
      headers: { Authorization: req.headers.authorization },
    });
    const user = authMe.data?.user;
    if (!user?.email) return null;

    const existingByEmail = await Doctor.findOne({ email: user.email.toLowerCase() });
    if (existingByEmail) {
      existingByEmail.userId = req.user.id;
      if (!existingByEmail.name && user.name) existingByEmail.name = user.name;
      await existingByEmail.save();
      return existingByEmail;
    }

    // Do not auto-create profiles from auth users; this can resurrect deleted doctors.
    return null;
  } catch {
    return null;
  }
}

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

// ── GET /api/doctors/me — doctor profile using JWT userId ──
router.get('/me', doctorAuth, async (req, res) => {
  try {
    const doctor = (await resolveDoctorFromToken(req)) || (await createDoctorProfileFromAuth(req));
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });
    res.json({ doctor });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── PUT /api/doctors/me — update own profile ────────────────
router.put('/me', doctorAuth, async (req, res) => {
  try {
    const payload = {
      name: req.body.name,
      specialty: req.body.specialty,
      phone: req.body.phone,
      experience: req.body.experience,
      consultationFee: req.body.consultationFee,
    };
    const currentDoctor = (await resolveDoctorFromToken(req)) || (await createDoctorProfileFromAuth(req));
    if (!currentDoctor) return res.status(404).json({ message: 'Doctor profile not found' });

    const doctor = await Doctor.findByIdAndUpdate(currentDoctor._id, payload, { new: true, runValidators: true });
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });
    res.json({ message: 'Doctor profile updated', doctor });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Update failed', error: err.message });
  }
});

// ── DELETE /api/doctors/me — delete own profile ─────────────
router.delete('/me', doctorAuth, async (req, res) => {
  try {
    const currentDoctor = (await resolveDoctorFromToken(req)) || (await createDoctorProfileFromAuth(req));
    if (!currentDoctor) return res.status(404).json({ message: 'Doctor profile not found' });

    const doctor = await Doctor.findByIdAndDelete(currentDoctor._id);
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });
    res.json({ message: 'Doctor profile deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── POST /api/doctors/availability — add/update availability ─
router.post('/availability', doctorAuth, async (req, res) => {
  try {
    const { date, timeSlots } = req.body;
    if (!date || !Array.isArray(timeSlots)) {
      return res.status(400).json({ message: 'date and timeSlots are required' });
    }

    const doctor = (await resolveDoctorFromToken(req)) || (await createDoctorProfileFromAuth(req));
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    const availability = await Availability.findOneAndUpdate(
      { doctorId: doctor._id, date },
      { timeSlots },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ message: 'Availability saved', availability });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save availability', error: err.message });
  }
});

// ── POST /api/doctors/availability/:id/cancel ──────────────
router.post('/availability/:id/cancel', doctorAuth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Cancellation message is required' });
    }

    const doctor = (await resolveDoctorFromToken(req)) || (await createDoctorProfileFromAuth(req));
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    const availability = await Availability.findById(req.params.id);
    if (!availability) return res.status(404).json({ message: 'Availability slot not found' });

    if (availability.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: 'You can only cancel your own availability slots' });
    }

    await availability.deleteOne();
    res.json({
      message: `Availability cancelled: ${message.trim()}`,
      cancellationMessage: message.trim(),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to cancel availability', error: err.message });
  }
});

// ── GET /api/doctors/availability/:doctorId ─────────────────
router.get('/availability/:doctorId', async (req, res) => {
  try {
    const availability = await Availability.find({ doctorId: req.params.doctorId }).sort({ date: 1 });
    res.json({ count: availability.length, availability });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch availability', error: err.message });
  }
});

// ── GET /api/doctors/appointments/requests — from appt svc ──
router.get('/appointments/requests', doctorAuth, async (req, res) => {
  try {
    const doctor = (await resolveDoctorFromToken(req)) || (await createDoctorProfileFromAuth(req));
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    const [byProfileId, byUserId] = await Promise.all([
      clients.appointment.get('/', { params: { doctorId: doctor._id.toString() } }),
      clients.appointment.get('/', { params: { doctorId: doctor.userId } }),
    ]);

    const merged = [...(byProfileId.data?.appointments || []), ...(byUserId.data?.appointments || [])];
    const uniqueById = Array.from(new Map(merged.map((item) => [item._id, item])).values());
    const patientIds = Array.from(new Set(uniqueById.map((item) => item.patientId).filter(Boolean)));
    const patientEntries = await Promise.all(
      patientIds.map(async (patientId) => {
        try {
          const patientRes = await clients.patient.get(`/${patientId}`);
          return [patientId, patientRes.data?.patient?.name || patientId];
        } catch {
          return [patientId, patientId];
        }
      })
    );

    const patientNameMap = new Map(patientEntries);
    const appointments = uniqueById.map((item) => ({
      ...item,
      patientName: patientNameMap.get(item.patientId) || item.patientId,
    }));

    res.json({ appointments });
  } catch (err) {
    res.status(err.response?.status || 500).json({
      message: err.response?.data?.message || 'Failed to fetch appointment requests',
      error: err.response?.data || err.message,
    });
  }
});

// ── PUT /api/doctors/appointments/:id/status ────────────────
router.put('/appointments/:id/status', doctorAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'cancelled', 'rejected', 'completed', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const doctor = (await resolveDoctorFromToken(req)) || (await createDoctorProfileFromAuth(req));
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    const payload = { status };
    if (status === 'confirmed') {
      payload.confirmedByDoctorId = doctor._id.toString();
      payload.confirmedByDoctorUserId = doctor.userId;
    }

    const response = await clients.appointment.patch(`/${req.params.id}/status`, payload);
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      message: err.response?.data?.message || 'Failed to update appointment status',
      error: err.response?.data || err.message,
    });
  }
});

// ── GET /api/doctors/telemedicine/:appointmentId ────────────
router.get('/telemedicine/:appointmentId', doctorAuth, async (req, res) => {
  try {
    const doctor = (await resolveDoctorFromToken(req)) || (await createDoctorProfileFromAuth(req));
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    const appointmentsRes = await clients.appointment.get('/', { params: { doctorId: doctor._id.toString() } });
    const appointment = (appointmentsRes.data?.appointments || []).find(
      (item) => item._id === req.params.appointmentId
    );

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found for this doctor' });
    }

    const sessionResponse = await clients.telemedicine.post('/sessions', {
      appointmentId: appointment._id,
      doctorId: doctor._id.toString(),
      patientId: appointment.patientId,
      scheduledAt: appointment.date,
      type: 'video',
    });

    const meetingLink = sessionResponse.data?.session?.joinUrl
      || sessionResponse.data?.joinUrl
      || `https://meet.jit.si/eMediCare-${appointment._id}`;

    res.json({
      message: 'Telemedicine session ready',
      meetingLink,
      session: sessionResponse.data?.session,
    });
  } catch (err) {
    res.status(err.response?.status || 500).json({
      message: err.response?.data?.message || 'Failed to create telemedicine session',
      error: err.response?.data || err.message,
    });
  }
});

// ── POST /api/doctors/prescriptions — create prescription ───
router.post('/prescriptions', doctorAuth, async (req, res) => {
  try {
    const doctor = (await resolveDoctorFromToken(req)) || (await createDoctorProfileFromAuth(req));
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    const { patientId, diagnosis, medicines, notes } = req.body;
    if (!patientId || !diagnosis) {
      return res.status(400).json({ message: 'patientId and diagnosis are required' });
    }

    const prescription = await Prescription.create({
      doctorId: doctor._id,
      patientId,
      diagnosis,
      medicines: Array.isArray(medicines) ? medicines : [],
      notes: notes || '',
    });

    res.status(201).json({ message: 'Prescription created', prescription });
  } catch (err) {
    res.status(400).json({ message: 'Failed to create prescription', error: err.message });
  }
});

// ── GET /api/doctors/prescriptions — list own prescriptions ─
router.get('/prescriptions', doctorAuth, async (req, res) => {
  try {
    const doctor = (await resolveDoctorFromToken(req)) || (await createDoctorProfileFromAuth(req));
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    const doctorIds = Array.from(new Set([doctor._id?.toString(), doctor.userId?.toString()].filter(Boolean)));
    const filter = { doctorId: { $in: doctorIds } };
    if (req.query.patientId) filter.patientId = req.query.patientId;
    const prescriptions = await Prescription.find(filter).sort({ createdAt: -1 });

    res.json({ count: prescriptions.length, prescriptions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch prescriptions', error: err.message });
  }
});

// ── GET /api/doctors/patient-reports/:patientId ─────────────
router.get('/patient-reports/:patientId', doctorAuth, async (req, res) => {
  try {
    const doctor = (await resolveDoctorFromToken(req)) || (await createDoctorProfileFromAuth(req));
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    const [appointmentsByProfile, appointmentsByUser] = await Promise.all([
      clients.appointment.get('/', { params: { doctorId: doctor._id.toString() } }),
      clients.appointment.get('/', { params: { doctorId: doctor.userId } }),
    ]);

    const allAppointments = [
      ...(appointmentsByProfile.data?.appointments || []),
      ...(appointmentsByUser.data?.appointments || []),
    ];

    const hasPatientRelation = allAppointments.some((appt) => appt.patientId === req.params.patientId);
    if (!hasPatientRelation) {
      return res.status(403).json({ message: 'You can only view reports of your own patients' });
    }

    const response = await clients.patient.get(`/${req.params.patientId}`);
    const patient = response.data?.patient;
    if (!patient) return res.status(404).json({ message: 'Patient report not found' });

    res.json({
      patientId: patient.userId,
      name: patient.name,
      email: patient.email,
      medicalHistory: patient.medicalHistory || [],
      currentMedications: patient.currentMedications || [],
      allergies: patient.allergies || [],
      reports: patient.reports || [],
    });
  } catch (err) {
    res.status(err.response?.status || 500).json({
      message: err.response?.data?.message || 'Failed to fetch patient reports',
      error: err.response?.data || err.message,
    });
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

// ── GET /api/doctors/by-email/:email — lookup by email ──────
router.get('/by-email/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const doctor = await Doctor.findOne({ email });
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json({ doctor });
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
