import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createDoctorByAdmin,
  deleteAppointmentByAdmin,
  deleteDoctorByAdmin,
  deletePatientByAdmin,
  deletePaymentByAdmin,
  getAdminAppointments,
  getAdminDoctors,
  getAdminOverview,
  getAdminPatients,
  getAdminPayments,
  updateAppointmentByAdmin,
  updateDoctorByAdmin,
  updateAdminDoctorStatus,
  updatePatientByAdmin,
  updatePaymentByAdmin,
} from '../services/api';

const SPECIALTIES = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Neurologist',
  'Orthopedist',
  'Pediatrician',
  'Psychiatrist',
  'Gynecologist',
  'Ophthalmologist',
  'ENT Specialist',
  'Other',
];

export default function AdminPanel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadWarning, setLoadWarning] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showDoctorPassword, setShowDoctorPassword] = useState(false);

  const [overview, setOverview] = useState({ doctors: 0, patients: 0, appointments: 0, payments: 0 });
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);

  const [doctorForm, setDoctorForm] = useState({
    email: '',
    password: '',
    name: '',
    specialty: 'General Physician',
    phone: '',
  });

  const pendingDoctors = useMemo(
    () => doctors.filter((doc) => doc.verificationStatus === 'pending'),
    [doctors]
  );

  const adminUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('emedicare_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const jumpTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('emedicare_token');
    localStorage.removeItem('emedicare_user');
    navigate('/', { replace: true });
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    setLoadWarning('');

    const [overviewRes, doctorsRes, patientsRes, appointmentsRes, paymentsRes] = await Promise.allSettled([
      getAdminOverview(),
      getAdminDoctors(),
      getAdminPatients(),
      getAdminAppointments(),
      getAdminPayments(),
    ]);

    const warnings = [];

    const doctorsData = doctorsRes.status === 'fulfilled' ? doctorsRes.value.data?.doctors || [] : [];
    const patientsData = patientsRes.status === 'fulfilled' ? patientsRes.value.data?.patients || [] : [];
    const appointmentsData = appointmentsRes.status === 'fulfilled' ? appointmentsRes.value.data?.appointments || [] : [];
    const paymentsData = paymentsRes.status === 'fulfilled' ? paymentsRes.value.data?.payments || [] : [];

    if (doctorsRes.status !== 'fulfilled') warnings.push('doctors');
    if (patientsRes.status !== 'fulfilled') warnings.push('patients');
    if (appointmentsRes.status !== 'fulfilled') warnings.push('appointments');
    if (paymentsRes.status !== 'fulfilled') warnings.push('payments');

    setDoctors(doctorsData);
    setPatients(patientsData);
    setAppointments(appointmentsData);
    setPayments(paymentsData);

    if (overviewRes.status === 'fulfilled' && overviewRes.value?.data) {
      setOverview(overviewRes.value.data);
    } else {
      warnings.push('overview');
      setOverview({
        doctors: doctorsData.length,
        patients: patientsData.length,
        appointments: appointmentsData.length,
        payments: paymentsData.length,
      });
    }

    if (warnings.length > 0) {
      setLoadWarning(`Some admin data is unavailable right now: ${warnings.join(', ')}`);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const withBusy = async (key, fn) => {
    setBusy(key);
    setError('');
    setSuccess('');
    try {
      await fn();
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setBusy('');
    }
  };

  const submitCreateDoctor = async (e) => {
    e.preventDefault();
    await withBusy('create-doctor', async () => {
      const response = await createDoctorByAdmin(doctorForm);
      setDoctorForm({
        email: '',
        password: '',
        name: '',
        specialty: 'General Physician',
        phone: '',
      });
      setSuccess(response.data?.message || 'Doctor created successfully');
    });
  };

  const editDoctor = async (doc) => {
    const name = window.prompt('Doctor name', doc.name || '');
    if (name === null) return;
    const specialty = window.prompt('Specialty', doc.specialty || 'General Physician');
    if (specialty === null) return;
    await withBusy(`edit-doctor-${doc._id}`, () =>
      updateDoctorByAdmin(doc._id, { name: name.trim(), specialty: specialty.trim() || 'General Physician' })
    );
  };

  const editPatient = async (patient) => {
    const name = window.prompt('Patient name', patient.name || '');
    if (name === null) return;
    const phone = window.prompt('Phone', patient.phone || '');
    if (phone === null) return;
    await withBusy(`edit-patient-${patient.userId}`, () =>
      updatePatientByAdmin(patient.userId, { name: name.trim(), phone: phone.trim() })
    );
  };

  const editAppointment = async (appointment) => {
    const status = window.prompt('Status (pending, confirmed, completed, cancelled)', appointment.status || 'pending');
    if (status === null) return;
    await withBusy(`edit-appointment-${appointment._id}`, () =>
      updateAppointmentByAdmin(appointment._id, { status: status.trim().toLowerCase() })
    );
  };

  const editPayment = async (payment) => {
    const amount = window.prompt('Amount', String(payment.amount ?? '0'));
    if (amount === null) return;
    const status = window.prompt('Status (pending, success, failed, refunded)', payment.status || 'pending');
    if (status === null) return;
    await withBusy(`edit-payment-${payment._id}`, () =>
      updatePaymentByAdmin(payment._id, {
        amount: Number(amount),
        status: status.trim().toLowerCase(),
      })
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-bg">
        <div className="max-w-6xl mx-auto px-6 py-12 flex justify-center">
          <div className="w-10 h-10 border-4 border-bg-surface2 border-t-primary rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10 flex gap-4 md:gap-6">
        <button
          type="button"
          onClick={() => setSidebarOpen((prev) => !prev)}
          className="fixed top-4 left-4 z-40 btn-primary px-4 py-2"
        >
          {sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
        </button>

        <aside
          className={`
            fixed top-0 left-0 z-30 h-screen
            w-72 md:w-64 bg-bg-surface border-r border-white/10 p-4 md:rounded-r-2xl
            transition-transform duration-300 ease-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="flex flex-col h-full">
            <div>
              <p className="section-tag mb-2">Admin Panel</p>
              <h2 className="font-heading text-xl">Control Center</h2>
              <p className="text-xs text-white/50 mt-1">{adminUser?.email || 'admin user'}</p>
            </div>

            <nav className="mt-6 space-y-2">
              <button type="button" onClick={() => jumpTo('overview-section')} className="btn-outline w-full justify-start">Overview</button>
              <button type="button" onClick={() => jumpTo('doctors-section')} className="btn-outline w-full justify-start">Doctors</button>
              <button type="button" onClick={() => jumpTo('patients-section')} className="btn-outline w-full justify-start">Patients</button>
              <button type="button" onClick={() => jumpTo('appointments-section')} className="btn-outline w-full justify-start">Appointments</button>
              <button type="button" onClick={() => jumpTo('payments-section')} className="btn-outline w-full justify-start">Payments</button>
            </nav>

            <div className="mt-auto pt-6 border-t border-white/10">
              <button type="button" onClick={handleLogout} className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/30 px-4 py-2 rounded-xl transition-colors">Logout</button>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/35 z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className={`flex-1 min-w-0 space-y-8 transition-all duration-300 ${sidebarOpen ? 'md:pl-64' : ''}`}>
        <div>
          <div className="section-tag mb-2">Admin Dashboard</div>
          <h1 className="text-3xl font-heading font-bold">Platform Operations</h1>
          <p className="text-sm text-white/50 mt-1">Secure admin control center powered through API Gateway.</p>
        </div>

        {error && <div className="alert-error">{error}</div>}
        {success && (
          <div className="border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 rounded-xl px-4 py-3 text-sm">
            {success}
          </div>
        )}
        {loadWarning && (
          <div className="border border-amber-400/30 bg-amber-500/10 text-amber-200 rounded-xl px-4 py-3 text-sm">
            {loadWarning}
          </div>
        )}

        <section id="overview-section" className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Doctors" value={overview.doctors} />
          <StatCard label="Patients" value={overview.patients} />
          <StatCard label="Appointments" value={overview.appointments} />
          <StatCard label="Payments" value={overview.payments} />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-heading text-xl mb-4">Create Doctor Account</h2>
            <form onSubmit={submitCreateDoctor} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                className="form-input"
                placeholder="Doctor name"
                value={doctorForm.name}
                onChange={(e) => setDoctorForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
              <input
                className="form-input"
                type="email"
                placeholder="Doctor email"
                value={doctorForm.email}
                onChange={(e) => setDoctorForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
              <div className="relative">
                <input
                  className="form-input pr-20"
                  type={showDoctorPassword ? 'text' : 'password'}
                  placeholder="Temporary password"
                  value={doctorForm.password}
                  onChange={(e) => setDoctorForm((prev) => ({ ...prev, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowDoctorPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/60 hover:text-white transition-colors"
                >
                  {showDoctorPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                className="form-input"
                placeholder="Phone"
                value={doctorForm.phone}
                onChange={(e) => setDoctorForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
              <select
                className="form-input sm:col-span-2"
                value={doctorForm.specialty}
                onChange={(e) => setDoctorForm((prev) => ({ ...prev, specialty: e.target.value }))}
              >
                {SPECIALTIES.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={busy === 'create-doctor'}
                className="btn-primary sm:col-span-2 justify-center"
              >
                {busy === 'create-doctor' ? 'Creating...' : 'Create Doctor'}
              </button>
            </form>
          </div>

          <div className="card">
            <h2 className="font-heading text-xl mb-4">Pending Doctor Verification</h2>
            <div className="space-y-3 max-h-80 overflow-auto pr-1">
              {pendingDoctors.length === 0 && <p className="text-sm text-white/50">No pending doctors.</p>}
              {pendingDoctors.map((doc) => (
                <div key={doc._id} className="border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-xs text-white/50">{doc.email} · {doc.specialty}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn-primary text-xs px-3 py-1"
                      disabled={busy === `approve-${doc._id}`}
                      onClick={() => withBusy(`approve-${doc._id}`, () => updateAdminDoctorStatus(doc._id, 'approved'))}
                    >
                      Approve
                    </button>
                    <button
                      className="btn-outline text-xs px-3 py-1"
                      disabled={busy === `reject-${doc._id}`}
                      onClick={() => withBusy(`reject-${doc._id}`, () => updateAdminDoctorStatus(doc._id, 'rejected'))}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="doctors-section" className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl">Doctor Management</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-white/60 border-b border-white/10">
                <tr>
                  <th className="text-left py-2 pr-3">Name</th>
                  <th className="text-left py-2 pr-3">Specialty</th>
                  <th className="text-left py-2 pr-3">Status</th>
                  <th className="text-left py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doc) => (
                  <tr key={doc._id} className="border-b border-white/5">
                    <td className="py-2 pr-3">{doc.name}</td>
                    <td className="py-2 pr-3">{doc.specialty}</td>
                    <td className="py-2 pr-3 capitalize">{doc.verificationStatus || 'pending'}</td>
                    <td className="py-2 pr-3 space-x-3">
                      <button
                        className="text-sky-300 hover:text-sky-100"
                        disabled={busy === `edit-doctor-${doc._id}`}
                        onClick={() => editDoctor(doc)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-rose-300 hover:text-rose-100"
                        disabled={busy === `delete-doctor-${doc._id}`}
                        onClick={() => {
                          if (window.confirm('Delete this doctor profile?')) {
                            withBusy(`delete-doctor-${doc._id}`, () => deleteDoctorByAdmin(doc._id));
                          }
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="patients-section" className="card">
          <h2 className="font-heading text-xl mb-4">Patient Management</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-white/60 border-b border-white/10">
                <tr>
                  <th className="text-left py-2 pr-3">Name</th>
                  <th className="text-left py-2 pr-3">Email</th>
                  <th className="text-left py-2 pr-3">Active</th>
                  <th className="text-left py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p._id} className="border-b border-white/5">
                    <td className="py-2 pr-3">{p.name}</td>
                    <td className="py-2 pr-3">{p.email}</td>
                    <td className="py-2 pr-3">{p.isActive ? 'Yes' : 'No'}</td>
                    <td className="py-2 pr-3 space-x-3">
                      <button
                        className="text-sky-300 hover:text-sky-100"
                        disabled={busy === `edit-patient-${p.userId}`}
                        onClick={() => editPatient(p)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-300 hover:text-red-100"
                        disabled={busy === `delete-patient-${p.userId}`}
                        onClick={() => withBusy(`delete-patient-${p.userId}`, () => deletePatientByAdmin(p.userId))}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="appointments-section" className="card">
          <h2 className="font-heading text-xl mb-4">Appointment Management</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-white/60 border-b border-white/10">
                <tr>
                  <th className="text-left py-2 pr-3">Date/Time</th>
                  <th className="text-left py-2 pr-3">Doctor</th>
                  <th className="text-left py-2 pr-3">Patient</th>
                  <th className="text-left py-2 pr-3">Status</th>
                  <th className="text-left py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 && (
                  <tr>
                    <td className="py-3 text-white/50" colSpan={5}>No appointments found.</td>
                  </tr>
                )}
                {appointments.map((item) => (
                  <tr key={item._id} className="border-b border-white/5">
                    <td className="py-2 pr-3">{new Date(item.date).toLocaleDateString()} {item.time}</td>
                    <td className="py-2 pr-3">{item.doctorId}</td>
                    <td className="py-2 pr-3">{item.patientId}</td>
                    <td className="py-2 pr-3 capitalize">{item.status}</td>
                    <td className="py-2 pr-3 space-x-3">
                      <button
                        className="text-sky-300 hover:text-sky-100"
                        disabled={busy === `edit-appointment-${item._id}`}
                        onClick={() => editAppointment(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-300 hover:text-red-100"
                        disabled={busy === `delete-appointment-${item._id}`}
                        onClick={() => {
                          if (window.confirm('Delete this appointment?')) {
                            withBusy(`delete-appointment-${item._id}`, () => deleteAppointmentByAdmin(item._id));
                          }
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="payments-section" className="card">
          <h2 className="font-heading text-xl mb-4">Payment Management</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-white/60 border-b border-white/10">
                <tr>
                  <th className="text-left py-2 pr-3">Transaction</th>
                  <th className="text-left py-2 pr-3">Patient</th>
                  <th className="text-left py-2 pr-3">Appointment</th>
                  <th className="text-left py-2 pr-3">Amount</th>
                  <th className="text-left py-2 pr-3">Status</th>
                  <th className="text-left py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 && (
                  <tr>
                    <td className="py-3 text-white/50" colSpan={6}>No transactions found.</td>
                  </tr>
                )}
                {payments.map((item) => (
                  <tr key={item._id} className="border-b border-white/5">
                    <td className="py-2 pr-3">{item.transactionId || 'N/A'}</td>
                    <td className="py-2 pr-3">{item.patientId}</td>
                    <td className="py-2 pr-3">{item.appointmentId}</td>
                    <td className="py-2 pr-3">${item.amount} ({item.method})</td>
                    <td className="py-2 pr-3 capitalize">{item.status}</td>
                    <td className="py-2 pr-3 space-x-3">
                      <button
                        className="text-sky-300 hover:text-sky-100"
                        disabled={busy === `edit-payment-${item._id}`}
                        onClick={() => editPayment(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-300 hover:text-red-100"
                        disabled={busy === `delete-payment-${item._id}`}
                        onClick={() => {
                          if (window.confirm('Delete this payment record?')) {
                            withBusy(`delete-payment-${item._id}`, () => deletePaymentByAdmin(item._id));
                          }
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="card text-center">
      <p className="text-sm text-white/50">{label}</p>
      <p className="text-3xl font-heading font-bold mt-1">{value}</p>
    </div>
  );
}
