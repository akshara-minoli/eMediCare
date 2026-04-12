import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

// Attach JWT to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('emedicare_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ── Auth ─────────────────────────────────────── */
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');

/* ── Doctors ──────────────────────────────────── */
export const getDoctors = (params) => API.get('/doctors', { params });
export const getDoctorById = (id) => API.get(`/doctors/${id}`);
export const createDoctor = (data) => API.post('/doctors', data);
export const updateDoctor = (id, d) => API.put(`/doctors/${id}`, d);

/* ── Patients ─────────────────────────────────── */
export const getPatient = (userId) => API.get(`/patients/${userId}`);
export const createPatient = (data) => API.post('/patients', data);
export const updatePatient = (userId, d) => API.put(`/patients/${userId}`, d);
export const addMedHistory = (userId, d) => API.patch(`/patients/${userId}/history`, d);

/* ── Appointments ─────────────────────────────── */
export const getAppointments = (params) => API.get('/appointments', { params });
export const bookAppointment = (data) => API.post('/appointments/book', data);
export const updateApptStatus = (id, s) => API.patch(`/appointments/${id}/status`, { status: s });
export const cancelAppt = (id) => API.delete(`/appointments/${id}`);

/* ── Payments ─────────────────────────────────── */
export const makePayment = (data) => API.post('/payments/pay', data);
export const getPaymentHistory = (patientId) => API.get(`/payments/${patientId}`);

/* ── AI ───────────────────────────────────────── */
export const checkSymptoms = (symptoms) => API.post('/ai/symptom-check', { symptoms });

/* ── Notifications ────────────────────────────── */
export const sendNotification = (data) => API.post('/notifications/send', data);

/* ── Telemedicine ─────────────────────────────── */
export const createSession = (data) => API.post('/telemedicine/sessions', data);
export const getSessions = (params) => API.get('/telemedicine/sessions', { params });
export const getSessionById = (id) => API.get(`/telemedicine/sessions/${id}`);
export const getSessionByRoom = (roomId) => API.get(`/telemedicine/sessions/room/${roomId}`);
export const startSession = (id) => API.patch(`/telemedicine/sessions/${id}/start`);
export const endSession = (id, data) => API.patch(`/telemedicine/sessions/${id}/end`, data);

/* ── Admin ────────────────────────────────────── */
export const getAdmins = () => API.get('/admin');
export const getAdminById = (id) => API.get(`/admin/${id}`);
export const createAdmin = (data) => API.post('/admin', data);
export const updateAdmin = (id, data) => API.put(`/admin/${id}`, data);
export const deleteAdmin = (id) => API.delete(`/admin/${id}`);

export default API;