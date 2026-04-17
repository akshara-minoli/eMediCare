import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  sendNotification,
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
  const [activeView, setActiveView] = useState('overview');
  const [showDoctorPassword, setShowDoctorPassword] = useState(false);

  const [overview, setOverview] = useState({ doctors: 0, patients: 0, appointments: 0, payments: 0 });
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [editModal, setEditModal] = useState({
    open: false,
    type: '',
    id: '',
    title: '',
    fields: {},
  });

  const [doctorForm, setDoctorForm] = useState({
    email: '',
    password: '',
    name: '',
    specialty: 'General Physician',
    phone: '',
    experience: '',
    consultationFee: '',
  });

  const [notificationForm, setNotificationForm] = useState({
    doctorId: '',
    target: 'all', // 'all' or 'single'
    patientId: '',
    message: '',
    channel: 'system',
  });

  const pendingDoctors = useMemo(
    () => doctors.filter((doc) => doc.verificationStatus === 'pending'),
    [doctors]
  );

  const doctorNameMap = useMemo(
    () => new Map(
      doctors.flatMap((doc) => [
        [String(doc._id), doc.name || String(doc._id)],
        [String(doc.userId), doc.name || String(doc.userId)],
      ])
    ),
    [doctors]
  );

  const patientNameMap = useMemo(
    () => new Map(
      patients.flatMap((patient) => [
        [String(patient.userId), patient.name || String(patient.userId)],
        [String(patient._id), patient.name || String(patient._id)],
      ])
    ),
    [patients]
  );

  const sortedAppointments = useMemo(
    () => [...appointments].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return (b.time || '').localeCompare(a.time || '');
    }),
    [appointments]
  );

  const appointmentLabelMap = useMemo(
    () => new Map(
      sortedAppointments.map((item) => {
        const doctorName = doctorNameMap.get(String(item.doctorId)) || item.doctorId || 'Unknown doctor';
        const patientName = patientNameMap.get(String(item.patientId)) || item.patientId || 'Unknown patient';
        const dateLabel = item.date ? new Date(item.date).toLocaleDateString() : '-';
        const timeLabel = item.time || '';
        return [String(item._id), `${doctorName} - ${patientName} (${dateLabel} ${timeLabel})`.trim()];
      })
    ),
    [sortedAppointments, doctorNameMap, patientNameMap]
  );

  const dateToInputValue = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const adminUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('emedicare_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const openView = (view) => {
    setActiveView(view);
    setSidebarOpen(false);
  };

  const navButtonClass = (view) =>
    `btn-outline w-full justify-start ${activeView === view ? 'bg-primary/15 text-primary border-primary/30' : ''}`;

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
        experience: '',
        consultationFee: '',
      });
      setSuccess(response.data?.message || 'Doctor created successfully');
    });
  };

  const closeEditModal = () => {
    setEditModal({ open: false, type: '', id: '', title: '', fields: {} });
  };

  const openDoctorEdit = (doc) => {
    setEditModal({
      open: true,
      type: 'doctor',
      id: doc._id,
      title: 'Edit Doctor',
      fields: {
        name: doc.name || '',
        specialty: doc.specialty || 'General Physician',
        phone: doc.phone || '',
        experience: String(doc.experience ?? 0),
        consultationFee: String(doc.consultationFee ?? 0),
      },
    });
  };

  const openPatientEdit = (patient) => {
    setEditModal({
      open: true,
      type: 'patient',
      id: patient.userId,
      title: 'Edit Patient',
      fields: {
        name: patient.name || '',
        email: patient.email || '',
        phone: patient.phone || '',
      },
    });
  };

  const openAppointmentEdit = (appointment) => {
    setEditModal({
      open: true,
      type: 'appointment',
      id: appointment._id,
      title: 'Edit Appointment',
      fields: {
        status: appointment.status || 'pending',
        date: dateToInputValue(appointment.date),
        time: appointment.time || '',
      },
    });
  };

  const openPaymentEdit = (payment) => {
    setEditModal({
      open: true,
      type: 'payment',
      id: payment._id,
      title: 'Edit Payment',
      fields: {
        amount: String(payment.amount ?? 0),
        status: payment.status || 'pending',
      },
    });
  };

  const submitEditModal = async (e) => {
    e.preventDefault();

    if (!editModal.type || !editModal.id) return;

    if (editModal.type === 'doctor') {
      await withBusy(`edit-doctor-${editModal.id}`, async () => {
        await updateDoctorByAdmin(editModal.id, {
          name: editModal.fields.name.trim(),
          specialty: editModal.fields.specialty.trim() || 'General Physician',
          phone: editModal.fields.phone.trim(),
          experience: Number(editModal.fields.experience) || 0,
          consultationFee: Number(editModal.fields.consultationFee) || 0,
        });
        setSuccess(`Doctor updated successfully`);
      });
    }

    if (editModal.type === 'patient') {
      await withBusy(`edit-patient-${editModal.id}`, () =>
        updatePatientByAdmin(editModal.id, {
          name: editModal.fields.name.trim(),
          email: editModal.fields.email.trim().toLowerCase(),
          phone: editModal.fields.phone.trim(),
        })
      );
    }

    if (editModal.type === 'appointment') {
      await withBusy(`edit-appointment-${editModal.id}`, () =>
        updateAppointmentByAdmin(editModal.id, {
          status: editModal.fields.status.trim().toLowerCase(),
          date: editModal.fields.date,
          time: editModal.fields.time.trim(),
        })
      );
    }

    if (editModal.type === 'payment') {
      await withBusy(`edit-payment-${editModal.id}`, () =>
        updatePaymentByAdmin(editModal.id, {
          amount: Number(editModal.fields.amount),
          status: editModal.fields.status.trim().toLowerCase(),
        })
      );
    }

    closeEditModal();
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notificationForm.doctorId || !notificationForm.message) {
      setError('Doctor and Message are required');
      return;
    }

    await withBusy('send-notification', async () => {
      let recipients = [];

      if (notificationForm.target === 'all') {
        // Find all patients who have appointments with this doctor
        // Or just all patients? User said "select one patient or all"
        // Most logical: all patients in the system for "all", or maybe all patients of this doctor.
        // Let's go with all patients associated with that doctor in appointments
        const doctorAppointments = appointments.filter(a => String(a.doctorId) === String(notificationForm.doctorId));
        const patientIds = [...new Set(doctorAppointments.map(a => String(a.patientId)))];
        recipients = patients
          .filter(p => patientIds.includes(String(p.userId)) || patientIds.includes(String(p._id)))
          .map(p => p.email)
          .filter(Boolean);

        if (recipients.length === 0) {
          // Fallback: If no appointments, just send to all patients? 
          // User said "select one patient or all". I'll send to all patients in the system if doctor is selected but target is all.
          recipients = patients.map(p => p.email).filter(Boolean);
        }
      } else {
        const patient = patients.find(p => String(p.userId) === String(notificationForm.patientId) || String(p._id) === String(notificationForm.patientId));
        if (patient?.email) recipients = [patient.email];
      }

      if (recipients.length === 0) {
        throw new Error('No recipients found with valid email addresses');
      }

      const doctor = doctors.find(d => String(d._id) === String(notificationForm.doctorId));

      await sendNotification({
        type: 'ADMIN_ANNOUNCEMENT',
        recipient: recipients, // We'll update the backend to handle array
        message: `Message regarding Dr. ${doctor?.name || 'your doctor'}: ${notificationForm.message}`,
        channel: notificationForm.channel,
      });

      setSuccess(`Notification sent to ${recipients.length} recipients`);
      setNotificationForm(prev => ({ ...prev, message: '', patientId: '' }));
    });
  };

  const exportTableToPdf = (title, headers, rows) => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text(title, 14, 16);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 28,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [76, 97, 255] },
      theme: 'grid',
    });

    const safeTitle = title.toLowerCase().replace(/\s+/g, '-');
    doc.save(`${safeTitle}.pdf`);
  };

  const exportDoctorsPdf = () => {
    const rows = doctors.map((doc) => [
      doc._id || '-',
      doc.name || '-',
      doc.email || '-',
      doc.specialty || '-',
      doc.verificationStatus || 'pending',
      doc.phone || '-',
    ]);
    exportTableToPdf('Doctor Management', ['ID', 'Name', 'Email', 'Specialty', 'Status', 'Phone'], rows);
  };

  const exportPatientsPdf = () => {
    const rows = patients.map((patient) => [
      patient.userId || '-',
      patient.name || '-',
      patient.email || '-',
      patient.phone || '-',
      patient.isActive ? 'Yes' : 'No',
    ]);
    exportTableToPdf('Patient Management', ['User ID', 'Name', 'Email', 'Phone', 'Active'], rows);
  };

  const exportAppointmentsPdf = () => {
    const rows = sortedAppointments.map((item) => [
      item._id || '-',
      doctorNameMap.get(String(item.doctorId)) || item.doctorId || '-',
      patientNameMap.get(String(item.patientId)) || item.patientId || '-',
      `${new Date(item.date).toLocaleDateString()} ${item.time || ''}`.trim(),
      item.type || 'in-person',
      item.status || '-',
    ]);
    exportTableToPdf('Appointment Management', ['ID', 'Doctor', 'Patient', 'Date/Time', 'Type', 'Status'], rows);
  };

  const exportPaymentsPdf = () => {
    const rows = payments.map((item) => [
      item._id || '-',
      item.transactionId || 'N/A',
      patientNameMap.get(String(item.patientId)) || item.patientId || '-',
      appointmentLabelMap.get(String(item.appointmentId)) || item.appointmentId || '-',
      String(item.amount ?? '-'),
      item.method || '-',
      item.status || '-',
    ]);
    exportTableToPdf('Payment Management', ['ID', 'Transaction', 'Patient', 'Appointment', 'Amount', 'Method', 'Status'], rows);
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
              <button type="button" onClick={() => openView('overview')} className={navButtonClass('overview')}>Overview</button>
              <button type="button" onClick={() => openView('doctors')} className={navButtonClass('doctors')}>Doctors</button>
              <button type="button" onClick={() => openView('patients')} className={navButtonClass('patients')}>Patients</button>
              <button type="button" onClick={() => openView('appointments')} className={navButtonClass('appointments')}>Appointments</button>
              <button type="button" onClick={() => openView('payments')} className={navButtonClass('payments')}>Payments</button>
              <button type="button" onClick={() => openView('notifications')} className={navButtonClass('notifications')}>Notifications</button>
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

        {activeView === 'overview' && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Doctors" value={overview.doctors} />
          <StatCard label="Patients" value={overview.patients} />
          <StatCard label="Appointments" value={overview.appointments} />
          <StatCard label="Payments" value={overview.payments} />
        </section>
        )}

        {activeView === 'overview' && (
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
              <input
                className="form-input"
                type="number"
                min="0"
                placeholder="Experience (years)"
                value={doctorForm.experience}
                onChange={(e) => setDoctorForm((prev) => ({ ...prev, experience: e.target.value }))}
              />
              <input
                className="form-input"
                type="number"
                min="0"
                placeholder="Consultation fee"
                value={doctorForm.consultationFee}
                onChange={(e) => setDoctorForm((prev) => ({ ...prev, consultationFee: e.target.value }))}
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
        )}

        {activeView === 'doctors' && (
        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl">Doctor Management</h2>
            <button type="button" className="btn-outline" onClick={exportDoctorsPdf}>Export PDF</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-white/60 border-b border-white/10">
                <tr>
                  <th className="text-left py-2 pr-3">Name</th>
                  <th className="text-left py-2 pr-3">Specialty</th>
                  <th className="text-left py-2 pr-3">Exp.</th>
                  <th className="text-left py-2 pr-3">Fee</th>
                  <th className="text-left py-2 pr-3">Status</th>
                  <th className="text-left py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doc) => (
                  <tr key={doc._id} className="border-b border-white/5">
                    <td className="py-2 pr-3">{doc.name}</td>
                    <td className="py-2 pr-3">{doc.specialty}</td>
                    <td className="py-2 pr-3">{doc.experience ?? 0}</td>
                    <td className="py-2 pr-3">{doc.consultationFee ?? 0}</td>
                    <td className="py-2 pr-3 capitalize">{doc.verificationStatus || 'pending'}</td>
                    <td className="py-2 pr-3 space-x-3">
                      <button
                        className="text-sky-300 hover:text-sky-100"
                        disabled={busy === `edit-doctor-${doc._id}`}
                        onClick={() => openDoctorEdit(doc)}
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
        )}

        {activeView === 'patients' && (
        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl">Patient Management</h2>
            <button type="button" className="btn-outline" onClick={exportPatientsPdf}>Export PDF</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-white/60 border-b border-white/10">
                <tr>
                  <th className="text-left py-2 pr-3">Name</th>
                  <th className="text-left py-2 pr-3">Email</th>
                  <th className="text-left py-2 pr-3">Phone</th>
                  <th className="text-left py-2 pr-3">Active</th>
                  <th className="text-left py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p._id} className="border-b border-white/5">
                    <td className="py-2 pr-3">{p.name}</td>
                    <td className="py-2 pr-3">{p.email}</td>
                    <td className="py-2 pr-3">{p.phone || '-'}</td>
                    <td className="py-2 pr-3">{p.isActive ? 'Yes' : 'No'}</td>
                    <td className="py-2 pr-3 space-x-3">
                      <button
                        className="text-sky-300 hover:text-sky-100"
                        disabled={busy === `edit-patient-${p.userId}`}
                        onClick={() => openPatientEdit(p)}
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
        )}

        {activeView === 'appointments' && (
        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl">Appointment Management</h2>
            <button type="button" className="btn-outline" onClick={exportAppointmentsPdf}>Export PDF</button>
          </div>
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
                {sortedAppointments.length === 0 && (
                  <tr>
                    <td className="py-3 text-white/50" colSpan={5}>No appointments found.</td>
                  </tr>
                )}
                {sortedAppointments.map((item) => (
                  <tr key={item._id} className="border-b border-white/5">
                    <td className="py-2 pr-3">
                      <div className="font-medium text-white">{new Date(item.date).toLocaleDateString()}</div>
                      <div className="text-xs text-white/40">{item.time}</div>
                    </td>
                    <td className="py-2 pr-3">
                      <div className="font-medium">{doctorNameMap.get(String(item.doctorId)) || "Doctor"}</div>
                      <div className="text-[10px] text-white/30 truncate max-w-[100px]">{item.doctorId}</div>
                    </td>
                    <td className="py-2 pr-3">
                      <div className="font-medium">{patientNameMap.get(String(item.patientId)) || "Patient"}</div>
                      <div className="text-[10px] text-white/30 truncate max-w-[100px]">{item.patientId}</div>
                    </td>
                    <td className="py-2 pr-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' :
                        item.status === 'cancelled' ? 'bg-rose-500/20 text-rose-400' :
                        item.status === 'completed' ? 'bg-sky-500/20 text-sky-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2 pr-3 space-x-3">
                      <button
                        className="text-sky-300 hover:text-sky-100"
                        disabled={busy === `edit-appointment-${item._id}`}
                        onClick={() => openAppointmentEdit(item)}
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
        )}

        {activeView === 'payments' && (
        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl">Payment Management</h2>
            <button type="button" className="btn-outline" onClick={exportPaymentsPdf}>Export PDF</button>
          </div>
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
                    <td className="py-2 pr-3">{patientNameMap.get(String(item.patientId)) || item.patientId}</td>
                    <td className="py-2 pr-3">{appointmentLabelMap.get(String(item.appointmentId)) || item.appointmentId}</td>
                    <td className="py-2 pr-3">${item.amount} ({item.method})</td>
                    <td className="py-2 pr-3 capitalize">{item.status}</td>
                    <td className="py-2 pr-3 space-x-3">
                      <button
                        className="text-sky-300 hover:text-sky-100"
                        disabled={busy === `edit-payment-${item._id}`}
                        onClick={() => openPaymentEdit(item)}
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
        )}

        {activeView === 'notifications' && (
        <section className="card max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h2 className="font-heading text-xl">Send Patient Notifications</h2>
              <p className="text-sm text-white/50">Notify patients about doctor arrivals or updates.</p>
            </div>
          </div>

          <form onSubmit={handleSendNotification} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/60 ml-1">Select Doctor</label>
                <select
                  className="form-input"
                  value={notificationForm.doctorId}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, doctorId: e.target.value }))}
                  required
                >
                  <option value="">Choose a doctor...</option>
                  {doctors.map(doc => (
                    <option key={doc._id} value={doc._id}>{doc.name} ({doc.specialty})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-white/60 ml-1">Notification Method</label>
                <div className="form-input bg-white/5 border-white/5 text-white/40 flex items-center gap-2">
                  <span className="text-primary">●</span> Patient Dashboard Profile
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-white/60 ml-1">Recipient Selection</label>
              <div className="flex gap-4 p-3 bg-bg-surface2/50 rounded-xl border border-white/5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="target"
                    className="accent-primary"
                    checked={notificationForm.target === 'all'}
                    onChange={() => setNotificationForm(prev => ({ ...prev, target: 'all', patientId: '' }))}
                  />
                  <span className="text-sm text-white/80">All Patients of Doctor</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="target"
                    className="accent-primary"
                    checked={notificationForm.target === 'single'}
                    onChange={() => setNotificationForm(prev => ({ ...prev, target: 'single' }))}
                  />
                  <span className="text-sm text-white/80">Specific Patient</span>
                </label>
              </div>
            </div>

            {notificationForm.target === 'single' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-xs font-medium text-white/60 ml-1">Select Patient</label>
                <select
                  className="form-input"
                  value={notificationForm.patientId}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, patientId: e.target.value }))}
                  required={notificationForm.target === 'single'}
                >
                  <option value="">Choose a patient...</option>
                  {patients.map(p => (
                    <option key={p.userId || p._id} value={p.userId || p._id}>{p.name} ({p.email})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-medium text-white/60 ml-1">Message Content</label>
              <textarea
                className="form-input min-h-[120px] resize-none py-3"
                placeholder="Type your message here (e.g. Dr. Smith has arrived and is ready for appointments...)"
                value={notificationForm.message}
                onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                required
              />
            </div>

            <button
              type="submit"
              disabled={busy === 'send-notification'}
              className="btn-primary w-full justify-center py-3 text-base shadow-lg shadow-primary/20"
            >
              {busy === 'send-notification' ? 'Sending...' : 'Send Notification'}
            </button>
          </form>
        </section>
        )}

        {editModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-2xl card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-xl">{editModal.title}</h2>
                <button type="button" className="text-white/60 hover:text-white" onClick={closeEditModal}>
                  Close
                </button>
              </div>

              <form onSubmit={submitEditModal} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {editModal.type === 'doctor' && (
                  <>
                    <label className="block">
                      <span className="form-label">Doctor Name</span>
                      <input
                        className="form-input"
                        value={editModal.fields.name || ''}
                        onChange={(e) => setEditModal((prev) => ({ ...prev, fields: { ...prev.fields, name: e.target.value } }))}
                        placeholder="Doctor name"
                        required
                      />
                    </label>
                    <label className="block">
                      <span className="form-label">Specialty</span>
                      <input
                        className="form-input"
                        value={editModal.fields.specialty || ''}
                        onChange={(e) => setEditModal((prev) => ({ ...prev, fields: { ...prev.fields, specialty: e.target.value } }))}
                        placeholder="Specialty"
                        required
                      />
                    </label>
                    <label className="block">
                      <span className="form-label">Phone</span>
                      <input
                        className="form-input"
                        value={editModal.fields.phone || ''}
                        onChange={(e) => setEditModal((prev) => ({ ...prev, fields: { ...prev.fields, phone: e.target.value } }))}
                        placeholder="Phone"
                      />
                    </label>
                    <label className="block">
                      <span className="form-label">Experience (Years)</span>
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        value={editModal.fields.experience || ''}
                        onChange={(e) => setEditModal((prev) => ({ ...prev, fields: { ...prev.fields, experience: e.target.value } }))}
                        placeholder="Experience (years)"
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <span className="form-label">Consultation Fee</span>
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        value={editModal.fields.consultationFee || ''}
                        onChange={(e) => setEditModal((prev) => ({ ...prev, fields: { ...prev.fields, consultationFee: e.target.value } }))}
                        placeholder="Consultation fee"
                      />
                    </label>
                  </>
                )}

                {editModal.type === 'patient' && (
                  <>
                    <input
                      className="form-input"
                      value={editModal.fields.name || ''}
                      onChange={(e) => setEditModal((prev) => ({ ...prev, fields: { ...prev.fields, name: e.target.value } }))}
                      placeholder="Patient name"
                      required
                    />
                    <input
                      className="form-input"
                      type="email"
                      value={editModal.fields.email || ''}
                      onChange={(e) => setEditModal((prev) => ({ ...prev, fields: { ...prev.fields, email: e.target.value } }))}
                      placeholder="Patient email"
                      required
                    />
                    <input
                      className="form-input md:col-span-2"
                      value={editModal.fields.phone || ''}
                      onChange={(e) => setEditModal((prev) => ({ ...prev, fields: { ...prev.fields, phone: e.target.value } }))}
                      placeholder="Phone"
                    />
                  </>
                )}

                {editModal.type === 'appointment' && (
                  <>
                    <label className="block">
                      <span className="form-label">Date</span>
                      <input
                        className="form-input"
                        type="date"
                        value={editModal.fields.date || ''}
                        onChange={(e) => setEditModal((prev) => ({ ...prev, fields: { ...prev.fields, date: e.target.value } }))}
                        required
                      />
                    </label>
                    <label className="block">
                      <span className="form-label">Time</span>
                      <input
                        className="form-input"
                        value={editModal.fields.time || ''}
                        onChange={(e) => setEditModal((prev) => ({ ...prev, fields: { ...prev.fields, time: e.target.value } }))}
                        placeholder="e.g. 10:00 or 10:00-11:00"
                        required
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <span className="form-label">Status</span>
                      <select
                        className="form-input"
                        value={editModal.fields.status || 'pending'}
                        onChange={(e) => setEditModal((prev) => ({ ...prev, fields: { ...prev.fields, status: e.target.value } }))}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </label>
                  </>
                )}

                {editModal.type === 'payment' && (
                  <>
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      value={editModal.fields.amount || ''}
                      onChange={(e) => setEditModal((prev) => ({ ...prev, fields: { ...prev.fields, amount: e.target.value } }))}
                      placeholder="Amount"
                      required
                    />
                    <select
                      className="form-input"
                      value={editModal.fields.status || 'pending'}
                      onChange={(e) => setEditModal((prev) => ({ ...prev, fields: { ...prev.fields, status: e.target.value } }))}
                    >
                      <option value="pending">Pending</option>
                      <option value="success">Success</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </>
                )}

                <button type="submit" disabled={!!busy} className="btn-primary md:col-span-2 justify-center">
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        )}
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
