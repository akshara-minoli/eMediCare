const axios = require('axios');

const clients = {
  auth: axios.create({ baseURL: process.env.AUTH_SERVICE_URL || 'http://localhost:5001/api/auth' }),
  doctor: axios.create({ baseURL: process.env.DOCTOR_SERVICE_URL || 'http://localhost:5006/api/doctors' }),
  patient: axios.create({ baseURL: process.env.PATIENT_SERVICE_URL || 'http://localhost:5007/api/patients' }),
  appointment: axios.create({ baseURL: process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:5002/api/appointments' }),
  payment: axios.create({ baseURL: process.env.PAYMENT_SERVICE_URL || 'http://localhost:5003/api/payments' }),
};

function forwardAuthHeader(req) {
  return req.headers.authorization ? { Authorization: req.headers.authorization } : {};
}

function handleError(res, err, fallbackMessage) {
  const status = err.response?.status || 500;
  const message = err.response?.data?.message || fallbackMessage;
  res.status(status).json({ message, details: err.response?.data || err.message });
}

exports.getOverview = async (req, res) => {
  const [doctorRes, patientRes, appointmentRes, paymentRes] = await Promise.allSettled([
    clients.doctor.get('/'),
    clients.patient.get('/'),
    clients.appointment.get('/'),
    clients.payment.get('/'),
  ]);

  const warnings = [];

  if (doctorRes.status !== 'fulfilled') warnings.push('doctors');
  if (patientRes.status !== 'fulfilled') warnings.push('patients');
  if (appointmentRes.status !== 'fulfilled') warnings.push('appointments');
  if (paymentRes.status !== 'fulfilled') warnings.push('payments');

  const overview = {
    doctors:
      doctorRes.status === 'fulfilled'
        ? doctorRes.value.data.count || doctorRes.value.data.doctors?.length || 0
        : 0,
    patients:
      patientRes.status === 'fulfilled'
        ? patientRes.value.data.count || patientRes.value.data.patients?.length || 0
        : 0,
    appointments:
      appointmentRes.status === 'fulfilled'
        ? appointmentRes.value.data.appointments?.length || 0
        : 0,
    payments:
      paymentRes.status === 'fulfilled'
        ? paymentRes.value.data.count || paymentRes.value.data.payments?.length || 0
        : 0,
  };

  if (warnings.length > 0) {
    return res.status(200).json({
      ...overview,
      partial: true,
      unavailable: warnings,
    });
  }

  return res.status(200).json(overview);
};

exports.getDoctors = async (req, res) => {
  try {
    const response = await clients.doctor.get('/', { params: req.query });
    res.json(response.data);
  } catch (err) {
    handleError(res, err, 'Failed to fetch doctors');
  }
};

exports.getPendingDoctors = async (req, res) => {
  try {
    const response = await clients.doctor.get('/pending');
    res.json(response.data);
  } catch (err) {
    handleError(res, err, 'Failed to fetch pending doctors');
  }
};

exports.updateDoctorStatus = async (req, res) => {
  try {
    const response = await clients.doctor.put(`/${req.params.id}/status`, {
      status: req.body.status,
    });
    res.json(response.data);
  } catch (err) {
    handleError(res, err, 'Failed to update doctor status');
  }
};

exports.blockDoctor = async (req, res) => {
  try {
    const response = await clients.doctor.patch(`/${req.params.id}/block`);
    res.json(response.data);
  } catch (err) {
    handleError(res, err, 'Failed to block doctor');
  }
};

exports.updateDoctor = async (req, res) => {
  try {
    const response = await clients.doctor.put(`/${req.params.id}`, req.body);
    res.json(response.data);
  } catch (err) {
    handleError(res, err, 'Failed to update doctor');
  }
};

exports.deleteDoctor = async (req, res) => {
  try {
    const doctorRes = await clients.doctor.get(`/${req.params.id}`);
    const doctor = doctorRes.data?.doctor;

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const authUserId = doctor.userId;
    if (authUserId) {
      await clients.auth.delete(`/users/${authUserId}`, { headers: forwardAuthHeader(req) });
    }

    const response = await clients.doctor.delete(`/${req.params.id}`);
    res.json(response.data);
  } catch (err) {
    handleError(res, err, 'Failed to delete doctor');
  }
};

exports.createDoctor = async (req, res) => {
  let authUserId = null;
  let authUserCreatedHere = false;
  try {
    const { email, password, name, specialty, phone, experience, consultationFee } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail || !password || !name || !specialty) {
      return res.status(400).json({ message: 'email, password, name, and specialty are required' });
    }

    // Step 1: create auth credentials in auth-service
    try {
      const authResponse = await clients.auth.post(
        '/register',
        { email: normalizedEmail, password, role: 'doctor' }
      );

      authUserId = authResponse.data?.userId || authResponse.data?.user?.id;
      authUserCreatedHere = true;
      if (!authUserId) {
        return res.status(502).json({ message: 'Auth service did not return a user id' });
      }
    } catch (authErr) {
      if (authErr.response?.status !== 409) {
        throw authErr;
      }

      const existingAuth = await clients.auth.get('/users/by-email', {
        params: { email: normalizedEmail },
        headers: forwardAuthHeader(req),
      });
      authUserId = existingAuth.data?.user?.id;
      if (!authUserId) {
        return res.status(502).json({ message: 'Existing auth user could not be resolved' });
      }
    }

    try {
      const existingDoctor = await clients.doctor.get('/by-email/' + encodeURIComponent(normalizedEmail));
      if (existingDoctor?.data?.doctor) {
        return res.status(409).json({ message: 'Doctor profile already exists for this email' });
      }
    } catch (doctorLookupErr) {
      if (doctorLookupErr.response?.status !== 404) {
        throw doctorLookupErr;
      }
    }

    try {
      // Step 2: create doctor profile in doctor-service with same userId
      const doctorResponse = await clients.doctor.post('/', {
        userId: authUserId,
        name,
        specialty,
        phone: phone || '',
        email: normalizedEmail,
        experience: Number(experience) || 0,
        consultationFee: Number(consultationFee) || 0,
        status: 'pending',
        verificationStatus: 'pending',
      });

      return res.status(201).json({
        message: 'Doctor account created successfully',
        userId: authUserId,
        doctor: doctorResponse.data.doctor,
      });
    } catch (doctorErr) {
      // Best-effort rollback to avoid orphaned auth accounts only when we created the auth account here.
      if (authUserCreatedHere) {
        try {
          await clients.auth.delete(`/users/${authUserId}`, { headers: forwardAuthHeader(req) });
        } catch (rollbackErr) {
          return res.status(502).json({
            message: 'Doctor profile creation failed and rollback failed',
            details: doctorErr.response?.data || doctorErr.message,
            rollback: rollbackErr.response?.data || rollbackErr.message,
          });
        }
      }

      return res.status(502).json({
        message: authUserCreatedHere
          ? 'Doctor profile creation failed. Auth account rolled back.'
          : 'Doctor profile creation failed.',
        details: doctorErr.response?.data || doctorErr.message,
      });
    }
  } catch (err) {
    handleError(res, err, 'Failed to create doctor');
  }
};

exports.getPatients = async (req, res) => {
  try {
    const response = await clients.patient.get('/', { params: req.query });
    res.json(response.data);
  } catch (err) {
    handleError(res, err, 'Failed to fetch patients');
  }
};

exports.blockPatient = async (req, res) => {
  try {
    const response = await clients.patient.patch(`/${req.params.userId}/block`);
    res.json(response.data);
  } catch (err) {
    handleError(res, err, 'Failed to block patient');
  }
};

exports.deletePatient = async (req, res) => {
  try {
    const response = await clients.patient.delete(`/${req.params.userId}`);
    res.json(response.data);
  } catch (err) {
    handleError(res, err, 'Failed to delete patient');
  }
};

exports.updatePatient = async (req, res) => {
  try {
    const response = await clients.patient.put(`/${req.params.userId}`, req.body);
    res.json(response.data);
  } catch (err) {
    handleError(res, err, 'Failed to update patient');
  }
};

exports.getAppointments = async (req, res) => {
  try {
    const response = await clients.appointment.get('/', { params: req.query });
    res.json(response.data);
  } catch (err) {
    handleError(res, err, 'Failed to fetch appointments');
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const response = await clients.appointment.put(`/${req.params.id}`, req.body);
    res.json(response.data);
  } catch (err) {
    handleError(res, err, 'Failed to update appointment');
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const response = await clients.appointment.delete(`/${req.params.id}`);
    res.json(response.data);
  } catch (err) {
    handleError(res, err, 'Failed to delete appointment');
  }
};

exports.getPayments = async (req, res) => {
  try {
    const response = await clients.payment.get('/', { params: req.query });
    res.json(response.data);
  } catch (err) {
    handleError(res, err, 'Failed to fetch payments');
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const response = await clients.payment.put(`/${req.params.id}`, req.body);
    res.json(response.data);
  } catch (err) {
    handleError(res, err, 'Failed to update payment');
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const response = await clients.payment.delete(`/${req.params.id}`);
    res.json(response.data);
  } catch (err) {
    handleError(res, err, 'Failed to delete payment');
  }
};
