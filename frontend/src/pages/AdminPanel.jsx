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
    `flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold transition-all ${
      activeView === view
        ? 'bg-[#0A192F] text-white shadow-lg shadow-[#0A192F]/20'
        : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0A192F]'
    }`;

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
      <main className="min-h-screen bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto px-6 py-12 flex justify-center">
          <div className="w-10 h-10 border-4 border-[#D9E2EC] border-t-[#0A192F] rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#0A192F]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10 flex gap-4 md:gap-6">
        <button
          type="button"
          onClick={() => setSidebarOpen((prev) => !prev)}
          className="fixed top-4 left-4 z-40 bg-[#0A192F] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-[#0A192F]/20 hover:scale-105 active:scale-95 transition-all"
        >
          {sidebarOpen ? 'Hide Menu' : 'Show Menu'}
        </button>

        <aside
          className={`
            fixed top-0 left-0 z-30 h-screen
            w-72 md:w-64 bg-white border-r border-[#D9E2EC] p-6
            transition-transform duration-300 ease-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="flex flex-col h-full">
            <div className="mb-8">
              <p className="inline-flex px-3 py-1 bg-[#0A192F]/5 border border-[#0A192F]/10 rounded-full text-[10px] font-bold text-[#0A192F] uppercase tracking-widest mb-3">Admin Panel</p>
              <h2 className="font-heading text-xl font-extrabold text-[#0A192F]">Control Center</h2>
              <p className="text-xs text-[#64748B] mt-1 font-medium">{adminUser?.email || 'admin@emedicare.com'}</p>
            </div>

            <nav className="space-y-2">
              <button type="button" onClick={() => openView('overview')} className={navButtonClass('overview')}>Overview</button>
              <button type="button" onClick={() => openView('doctors')} className={navButtonClass('doctors')}>Doctors</button>
              <button type="button" onClick={() => openView('patients')} className={navButtonClass('patients')}>Patients</button>
              <button type="button" onClick={() => openView('appointments')} className={navButtonClass('appointments')}>Appointments</button>
              <button type="button" onClick={() => openView('payments')} className={navButtonClass('payments')}>Payments</button>
              <button type="button" onClick={() => openView('notifications')} className={navButtonClass('notifications')}>Notifications</button>
            </nav>

            <div className="mt-auto pt-6 border-t border-[#F1F5F9]">
              <button type="button" onClick={handleLogout} className="w-full bg-red-50 text-red-600 font-bold px-4 py-3 rounded-xl hover:bg-red-100 transition-colors">Logout Account</button>
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
          <p className="inline-flex px-3 py-1 bg-[#0A192F]/5 border border-[#0A192F]/10 rounded-full text-[10px] font-bold text-[#0A192F] uppercase tracking-widest mb-3">Admin Dashboard</p>
          <h1 className="text-4xl font-heading font-extrabold text-[#0A192F]">Platform Operations</h1>
          <p className="text-sm text-[#64748B] mt-1 font-medium">Secure admin control center powered through API Gateway.</p>
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
          <div className="bg-white/70 backdrop-blur-2xl border border-white rounded-[2.5rem] p-10 shadow-2xl shadow-[#0A192F]/5">
            <h2 className="font-heading text-2xl font-bold mb-6 text-[#0A192F]">Create Doctor Account</h2>
            <form onSubmit={submitCreateDoctor} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                className="w-full px-5 py-4 bg-white/50 border border-[#D9E2EC] rounded-2xl text-sm text-[#0A192F] placeholder-[#94A3B8] focus:outline-none focus:border-[#0A192F] focus:ring-4 focus:ring-[#0A192F]/5 transition-all"
                placeholder="Doctor name"
                value={doctorForm.name}
                onChange={(e) => setDoctorForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
              <input
                className="w-full px-5 py-4 bg-white/50 border border-[#D9E2EC] rounded-2xl text-sm text-[#0A192F] placeholder-[#94A3B8] focus:outline-none focus:border-[#0A192F] focus:ring-4 focus:ring-[#0A192F]/5 transition-all"
                type="email"
                placeholder="Doctor email"
                value={doctorForm.email}
                onChange={(e) => setDoctorForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
              <div className="relative">
                <input
                  className="w-full px-5 py-4 bg-white/50 border border-[#D9E2EC] rounded-2xl text-sm text-[#0A192F] placeholder-[#94A3B8] focus:outline-none focus:border-[#0A192F] focus:ring-4 focus:ring-[#0A192F]/5 transition-all pr-20"
                  type={showDoctorPassword ? 'text' : 'password'}
                  placeholder="Temporary password"
                  value={doctorForm.password}
                  onChange={(e) => setDoctorForm((prev) => ({ ...prev, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowDoctorPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#64748B] hover:text-[#0A192F] uppercase tracking-widest transition-colors"
                >
                  {showDoctorPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                className="w-full px-5 py-4 bg-white/50 border border-[#D9E2EC] rounded-2xl text-sm text-[#0A192F] placeholder-[#94A3B8] focus:outline-none focus:border-[#0A192F] focus:ring-4 focus:ring-[#0A192F]/5 transition-all"
                placeholder="Phone"
                value={doctorForm.phone}
                onChange={(e) => setDoctorForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
              <input
                className="w-full px-5 py-4 bg-white/50 border border-[#D9E2EC] rounded-2xl text-sm text-[#0A192F] placeholder-[#94A3B8] focus:outline-none focus:border-[#0A192F] focus:ring-4 focus:ring-[#0A192F]/5 transition-all"
                type="number"
                min="0"
                placeholder="Experience (years)"
                value={doctorForm.experience}
                onChange={(e) => setDoctorForm((prev) => ({ ...prev, experience: e.target.value }))}
              />
              <input
                className="w-full px-5 py-4 bg-white/50 border border-[#D9E2EC] rounded-2xl text-sm text-[#0A192F] placeholder-[#94A3B8] focus:outline-none focus:border-[#0A192F] focus:ring-4 focus:ring-[#0A192F]/5 transition-all"
                type="number"
                min="0"
                placeholder="Consultation fee"
                value={doctorForm.consultationFee}
                onChange={(e) => setDoctorForm((prev) => ({ ...prev, consultationFee: e.target.value }))}
              />
              <select
                className="w-full px-5 py-4 bg-white/50 border border-[#D9E2EC] rounded-2xl text-sm text-[#0A192F] focus:outline-none focus:border-[#0A192F] focus:ring-4 focus:ring-[#0A192F]/5 transition-all sm:col-span-2"
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
                className="w-full py-4 bg-[#0A192F] text-white font-bold rounded-2xl shadow-xl shadow-[#0A192F]/20 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition-all sm:col-span-2"
              >
                {busy === 'create-doctor' ? 'Creating...' : 'Create Doctor Account'}
              </button>
            </form>
          </div>

          <div className="bg-white/70 backdrop-blur-2xl border border-white rounded-[2.5rem] p-10 shadow-2xl shadow-[#0A192F]/5">
            <h2 className="font-heading text-2xl font-bold mb-6 text-[#0A192F]">Pending Doctor Verification</h2>
            <div className="space-y-4 max-h-80 overflow-auto pr-2 custom-scrollbar">
              {pendingDoctors.length === 0 && <p className="text-sm text-[#64748B] font-medium italic">No pending doctors for review.</p>}
              {pendingDoctors.map((doc) => (
                <div key={doc._id} className="bg-white/50 border border-[#D9E2EC] rounded-2xl p-5 flex items-center justify-between gap-4 transition-all hover:border-[#0A192F]/20">
                  <div>
                    <p className="font-bold text-[#0A192F]">{doc.name}</p>
                    <p className="text-xs text-[#64748B] font-medium">{doc.email} · {doc.specialty}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="bg-[#0A192F] text-white text-[11px] font-bold px-4 py-2 rounded-xl shadow-lg shadow-[#0A192F]/10 hover:scale-105 active:scale-95 transition-all"
                      disabled={busy === `approve-${doc._id}`}
                      onClick={() => withBusy(`approve-${doc._id}`, () => updateAdminDoctorStatus(doc._id, 'approved'))}
                    >
                      Approve
                    </button>
                    <button
                      className="bg-red-50 text-red-600 border border-red-100 text-[11px] font-bold px-4 py-2 rounded-xl hover:bg-red-100 transition-all"
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
        <section className="bg-white/70 backdrop-blur-2xl border border-white rounded-[2.5rem] p-10 shadow-2xl shadow-[#0A192F]/5">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl font-bold text-[#0A192F]">Doctor Management</h2>
            <button type="button" className="bg-[#0A192F] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all hover:scale-105" onClick={exportDoctorsPdf}>Export PDF</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-[#64748B] border-b border-[#F1F5F9]">
                <tr>
                  <th className="text-left font-bold py-4 pr-3 uppercase tracking-wider text-[11px]">Name</th>
                  <th className="text-left font-bold py-4 pr-3 uppercase tracking-wider text-[11px]">Specialty</th>
                  <th className="text-left font-bold py-4 pr-3 uppercase tracking-wider text-[11px]">Exp.</th>
                  <th className="text-left font-bold py-4 pr-3 uppercase tracking-wider text-[11px]">Fee</th>
                  <th className="text-left font-bold py-4 pr-3 uppercase tracking-wider text-[11px]">Status</th>
                  <th className="text-left font-bold py-4 pr-3 uppercase tracking-wider text-[11px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {doctors.map((doc) => (
                  <tr key={doc._id} className="group hover:bg-[#F8FAFC]/80 transition-colors">
                    <td className="py-4 pr-3 font-bold text-[#0A192F]">{doc.name}</td>
                    <td className="py-4 pr-3 text-[#64748B] font-medium">{doc.specialty}</td>
                    <td className="py-4 pr-3 text-[#64748B] font-medium">{doc.experience ?? 0}y</td>
                    <td className="py-4 pr-3 text-[#0A192F] font-bold">LKR {doc.consultationFee ?? 0}</td>
                    <td className="py-4 pr-3">
                      <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        doc.verificationStatus === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {doc.verificationStatus || 'pending'}
                      </span>
                    </td>
                    <td className="py-4 pr-3 space-x-4">
                      <button
                        className="text-[#0A192F] font-bold hover:underline"
                        disabled={busy === `edit-doctor-${doc._id}`}
                        onClick={() => openDoctorEdit(doc)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-500 font-bold hover:underline"
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
        <section className="bg-white/70 backdrop-blur-2xl border border-white rounded-[2.5rem] p-10 shadow-2xl shadow-[#0A192F]/5">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl font-bold text-[#0A192F]">Patient Management</h2>
            <button type="button" className="bg-[#0A192F] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all hover:scale-105" onClick={exportPatientsPdf}>Export PDF</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-[#64748B] border-b border-[#F1F5F9]">
                <tr>
                  <th className="text-left font-bold py-4 pr-3 uppercase tracking-wider text-[11px]">Name</th>
                  <th className="text-left font-bold py-4 pr-3 uppercase tracking-wider text-[11px]">Email</th>
                  <th className="text-left font-bold py-4 pr-3 uppercase tracking-wider text-[11px]">Phone</th>
                  <th className="text-left font-bold py-4 pr-3 uppercase tracking-wider text-[11px]">Active</th>
                  <th className="text-left font-bold py-4 pr-3 uppercase tracking-wider text-[11px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {patients.map((p) => (
                  <tr key={p._id} className="group hover:bg-[#F8FAFC]/80 transition-colors">
                    <td className="py-4 pr-3 font-bold text-[#0A192F]">{p.name}</td>
                    <td className="py-4 pr-3 text-[#64748B] font-medium">{p.email}</td>
                    <td className="py-4 pr-3 text-[#64748B] font-medium">{p.phone || '-'}</td>
                    <td className="py-4 pr-3">
                      <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${
                        p.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {p.isActive ? 'ACTIVE' : 'BLOCKED'}
                      </span>
                    </td>
                    <td className="py-4 pr-3 space-x-4">
                      <button
                        className="text-[#0A192F] font-bold hover:underline"
                        disabled={busy === `edit-patient-${p.userId}`}
                        onClick={() => openPatientEdit(p)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-500 font-bold hover:underline"
                        disabled={busy === `delete-patient-${p.userId}`}
                        onClick={() => {
                          if (window.confirm('Delete this patient?')) {
                            withBusy(`delete-patient-${p.userId}`, () => deletePatientByAdmin(p.userId));
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

        {activeView === 'appointments' && (
        <section className="bg-white/70 backdrop-blur-2xl border border-white rounded-[2.5rem] p-10 shadow-2xl shadow-[#0A192F]/5">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl font-bold text-[#0A192F]">Appointment Management</h2>
            <button type="button" className="bg-[#0A192F] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all hover:scale-105" onClick={exportAppointmentsPdf}>Export PDF</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-[#64748B] border-b border-[#F1F5F9]">
                <tr>
                  <th className="text-left font-bold py-4 pr-3 uppercase tracking-wider text-[11px]">Date/Time</th>
                  <th className="text-left font-bold py-4 pr-3 uppercase tracking-wider text-[11px]">Doctor</th>
                  <th className="text-left font-bold py-4 pr-3 uppercase tracking-wider text-[11px]">Patient</th>
                  <th className="text-left font-bold py-4 pr-3 uppercase tracking-wider text-[11px]">Status</th>
                  <th className="text-left font-bold py-4 pr-3 uppercase tracking-wider text-[11px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {sortedAppointments.length === 0 && (
                  <tr>
                    <td className="py-8 text-[#64748B] font-medium italic text-center" colSpan={5}>No appointments found in the system.</td>
                  </tr>
                )}
                {sortedAppointments.map((item) => (
                  <tr key={item._id} className="group hover:bg-[#F8FAFC]/80 transition-colors">
                    <td className="py-4 pr-3">
                      <div className="font-bold text-[#0A192F]">{new Date(item.date).toLocaleDateString()}</div>
                      <div className="text-xs text-[#64748B] font-medium">{item.time}</div>
                    </td>
                    <td className="py-4 pr-3 text-[#64748B] font-medium">{doctorNameMap.get(String(item.doctorId)) || item.doctorId || '-'}</td>
                    <td className="py-4 pr-3 text-[#64748B] font-medium">{patientNameMap.get(String(item.patientId)) || item.patientId || '-'}</td>
                    <td className="py-4 pr-3">
                      <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' :
                        item.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {item.status || '-'}
                      </span>
                    </td>
                    <td className="py-4 pr-3 space-x-4">
                      <button
                        className="text-[#0A192F] font-bold hover:underline"
                        disabled={busy === `edit-appt-${item._id}`}
                        onClick={() => openAppointmentEdit(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-500 font-bold hover:underline"
                        disabled={busy === `delete-appt-${item._id}`}
                        onClick={() => {
                          if (window.confirm('Delete this appointment?')) {
                            withBusy(`delete-appt-${item._id}`, () => deleteAppointmentByAdmin(item._id));
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
        <section className="bg-white/70 backdrop-blur-2xl border border-white rounded-[2.5rem] p-10 shadow-2xl shadow-[#0A192F]/5">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl font-bold text-[#0A192F]">Payment Management</h2>
            <button type="button" className="bg-[#0A192F] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all hover:scale-105" onClick={exportPaymentsPdf}>Export PDF</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-[#64748B] border-b border-[#F1F5F9]">
                <tr>
                  <th className="text-left font-bold py-4 pr-3 uppercase tracking-wider text-[11px]">Transaction</th>
                  <th className="text-left font-bold py-4 pr-3 uppercase tracking-wider text-[11px]">Patient</th>
                  <th className="text-left font-bold py-4 pr-3 uppercase tracking-wider text-[11px]">Appointment</th>
                  <th className="text-left font-bold py-4 pr-3 uppercase tracking-wider text-[11px]">Amount</th>
                  <th className="text-left font-bold py-4 pr-3 uppercase tracking-wider text-[11px]">Status</th>
                  <th className="text-left font-bold py-4 pr-3 uppercase tracking-wider text-[11px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {payments.length === 0 && (
                  <tr>
                    <td className="py-8 text-[#64748B] font-medium italic text-center" colSpan={6}>No transactions found in records.</td>
                  </tr>
                )}
                {payments.map((item) => (
                  <tr key={item._id} className="group hover:bg-[#F8FAFC]/80 transition-colors">
                    <td className="py-4 pr-3 font-bold text-[#0A192F]">{item.transactionId || 'N/A'}</td>
                    <td className="py-4 pr-3 text-[#64748B] font-medium">{patientNameMap.get(String(item.patientId)) || item.patientId}</td>
                    <td className="py-4 pr-3 text-[#64748B] font-medium max-w-[200px] truncate">{appointmentLabelMap.get(String(item.appointmentId)) || item.appointmentId}</td>
                    <td className="py-4 pr-3 text-[#0A192F] font-bold">LKR {item.amount}</td>
                    <td className="py-4 pr-3">
                      <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'success' ? 'bg-emerald-50 text-emerald-600' :
                        item.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 pr-3 space-x-4">
                      <button className="text-[#0A192F] font-bold hover:underline" onClick={() => openPaymentEdit(item)}>Edit</button>
                      <button className="text-red-500 font-bold hover:underline" onClick={() => {
                        if (window.confirm('Delete payment record?')) withBusy(`del-pay-${item._id}`, () => deletePaymentByAdmin(item._id));
                      }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        )}

        {activeView === 'notifications' && (
        <section className="bg-white/70 backdrop-blur-2xl border border-white rounded-[2.5rem] p-10 shadow-2xl shadow-[#0A192F]/5 max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#0A192F]/5 flex items-center justify-center text-[#0A192F]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-[#0A192F]">Patient Notifications</h2>
              <p className="text-sm text-[#64748B] font-medium">Broadcast alerts or updates to your patients.</p>
            </div>
          </div>

          <form onSubmit={handleSendNotification} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-[#0A192F] uppercase tracking-wider ml-1">Select Doctor</label>
                <select className="w-full px-5 py-4 bg-white/50 border border-[#D9E2EC] rounded-2xl text-sm text-[#0A192F] focus:outline-none focus:border-[#0A192F] focus:ring-4 focus:ring-[#0A192F]/5 transition-all" value={notificationForm.doctorId} onChange={(e) => setNotificationForm(prev => ({ ...prev, doctorId: e.target.value }))} required>
                  <option value="">Choose a doctor...</option>
                  {doctors.map(doc => (<option key={doc._id} value={doc._id}>{doc.name} ({doc.specialty})</option>))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-[#0A192F] uppercase tracking-wider ml-1">Channel</label>
                <div className="w-full px-5 py-4 bg-[#F8FAFC] border border-[#D9E2EC] rounded-2xl text-sm text-[#64748B] font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0A192F]"></span> Patient Dashboard
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[11px] font-bold text-[#0A192F] uppercase tracking-wider ml-1">Recipients</label>
              <div className="flex gap-6 p-5 bg-[#F8FAFC] border border-[#D9E2EC] rounded-2xl">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="radio" name="target" className="w-4 h-4 accent-[#0A192F]" checked={notificationForm.target === 'all'} onChange={() => setNotificationForm(prev => ({ ...prev, target: 'all', patientId: '' }))} />
                  <span className="text-sm font-bold text-[#64748B] group-hover:text-[#0A192F] transition-colors">All Doctor Patients</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="radio" name="target" className="w-4 h-4 accent-[#0A192F]" checked={notificationForm.target === 'single'} onChange={() => setNotificationForm(prev => ({ ...prev, target: 'single' }))} />
                  <span className="text-sm font-bold text-[#64748B] group-hover:text-[#0A192F] transition-colors">Specific Patient</span>
                </label>
              </div>
            </div>

            {notificationForm.target === 'single' && (
              <div className="space-y-2 animate-fade-up">
                <label className="block text-[11px] font-bold text-[#0A192F] uppercase tracking-wider ml-1">Select Patient</label>
                <select className="w-full px-5 py-4 bg-white/50 border border-[#D9E2EC] rounded-2xl text-sm text-[#0A192F] focus:outline-none focus:border-[#0A192F] focus:ring-4 focus:ring-[#0A192F]/5 transition-all" value={notificationForm.patientId} onChange={(e) => setNotificationForm(prev => ({ ...prev, patientId: e.target.value }))} required={notificationForm.target === 'single'}>
                  <option value="">Select patient...</option>
                  {patients.map(p => (<option key={p.userId || p._id} value={p.userId || p._id}>{p.name} ({p.email})</option>))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-[#0A192F] uppercase tracking-wider ml-1">Announcement Message</label>
              <textarea className="w-full px-5 py-4 bg-white/50 border border-[#D9E2EC] rounded-2xl text-sm text-[#0A192F] placeholder-[#94A3B8] focus:outline-none focus:border-[#0A192F] focus:ring-4 focus:ring-[#0A192F]/5 transition-all min-h-[120px] resize-none" placeholder="Enter notification message..." value={notificationForm.message} onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))} required />
            </div>

            <button type="submit" disabled={busy === 'send-notification'} className="w-full py-4 bg-[#0A192F] text-white font-bold rounded-2xl shadow-xl shadow-[#0A192F]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
              {busy === 'send-notification' ? 'Processing...' : 'Broadcast Message'}
            </button>
          </form>
        </section>
        )}

        {editModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A192F]/40 backdrop-blur-md px-4 overflow-y-auto pt-20 pb-10">
            <div className="w-full max-w-2xl bg-white rounded-[2.5rem] p-10 shadow-2xl relative animate-fade-up border border-white">
              <button type="button" className="absolute top-8 right-8 text-[#64748B] hover:text-[#0A192F] font-bold uppercase text-[10px] tracking-widest" onClick={closeEditModal}>Close [x]</button>
              
              <h2 className="font-heading text-3xl font-bold text-[#0A192F] mb-8">{editModal.title}</h2>
              
              <form onSubmit={submitEditModal} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {editModal.type === 'doctor' && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-[#0A192F] uppercase tracking-wider ml-1">Name</label>
                      <input className="w-full px-5 py-4 bg-[#F8FAFC] border border-[#D9E2EC] rounded-2xl text-sm" value={editModal.fields.name || ''} onChange={(e) => setEditModal((prev) => ({ ...prev, fields: { ...prev.fields, name: e.target.value } }))} required />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-[#0A192F] uppercase tracking-wider ml-1">Specialty</label>
                      <input className="w-full px-5 py-4 bg-[#F8FAFC] border border-[#D9E2EC] rounded-2xl text-sm" value={editModal.fields.specialty || ''} onChange={(e) => setEditModal((prev) => ({ ...prev, fields: { ...prev.fields, specialty: e.target.value } }))} required />
                    </div>
                  </>
                )}
                {editModal.type === 'patient' && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-[#0A192F] uppercase tracking-wider ml-1">Name</label>
                      <input className="w-full px-5 py-4 bg-[#F8FAFC] border border-[#D9E2EC] rounded-2xl text-sm" value={editModal.fields.name || ''} onChange={(e) => setEditModal((prev) => ({ ...prev, fields: { ...prev.fields, name: e.target.value } }))} required />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-[#0A192F] uppercase tracking-wider ml-1">Email</label>
                      <input className="w-full px-5 py-4 bg-[#F8FAFC] border border-[#D9E2EC] rounded-2xl text-sm" value={editModal.fields.email || ''} onChange={(e) => setEditModal((prev) => ({ ...prev, fields: { ...prev.fields, email: e.target.value } }))} required />
                    </div>
                  </>
                )}
                {editModal.type === 'appointment' && (
                  <div className="md:col-span-2 grid grid-cols-2 gap-5">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-[#0A192F] uppercase tracking-wider ml-1">Status</label>
                      <select className="w-full px-5 py-4 bg-[#F8FAFC] border border-[#D9E2EC] rounded-2xl text-sm" value={editModal.fields.status || 'pending'} onChange={(e) => setEditModal((prev) => ({ ...prev, fields: { ...prev.fields, status: e.target.value } }))}>
                        <option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                )}
                
                <button type="submit" disabled={!!busy} className="w-full py-4 bg-[#0A192F] text-white font-bold rounded-2xl mt-4 md:col-span-2 shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                  Apply Updates
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
    <div className="bg-white/70 backdrop-blur-2xl border border-white p-6 rounded-3xl shadow-xl shadow-[#0A192F]/5 transition-all hover:scale-[1.02]">
      <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-heading font-extrabold text-[#0A192F]">{value}</p>
    </div>
  );
}
