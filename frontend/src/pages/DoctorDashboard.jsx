import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  cancelDoctorAvailability,
  createDoctorPrescription,
  deleteMyDoctorProfile,
  getDoctorAppointmentRequests,
  getDoctorAvailability,
  getDoctorPatientReports,
  getDoctorPrescriptions,
  getDoctorTelemedicineLink,
  getMyDoctorProfile,
  getPatients,
  saveDoctorAvailability,
  updateDoctorAppointmentStatus,
  updateMyDoctorProfile,
} from '../services/api';

const TABS = ['Profile', 'Availability', 'Appointments', 'Video Consultation', 'Prescriptions', 'Patient Reports'];

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Profile');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);

  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [patientReport, setPatientReport] = useState(null);
  const [meetingLink, setMeetingLink] = useState('');

  const [profileForm, setProfileForm] = useState({ name: '', specialty: '', phone: '', experience: '', consultationFee: '' });
  const [availabilityForm, setAvailabilityForm] = useState({ date: '', fromTime: '', toTime: '' });
  const [prescriptionForm, setPrescriptionForm] = useState({ patientId: '', diagnosis: '', medicines: '', notes: '' });
  const [reportPatientId, setReportPatientId] = useState('');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');

  const normalizeTo24HourSlot = (slot) => {
    const value = (slot || '').trim();
    const match = value.match(/^(\d{1,2})(?::(\d{1,2}))?\s*-\s*(\d{1,2})(?::(\d{1,2}))?$/);
    if (!match) return null;

    const startHour = Number(match[1]);
    const startMinute = Number(match[2] || 0);
    const endHour = Number(match[3]);
    const endMinute = Number(match[4] || 0);

    const valid =
      startHour >= 0 && startHour <= 23 &&
      endHour >= 0 && endHour <= 23 &&
      startMinute >= 0 && startMinute <= 59 &&
      endMinute >= 0 && endMinute <= 59;

    if (!valid) return null;

    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(startHour)}:${pad(startMinute)}-${pad(endHour)}:${pad(endMinute)}`;
  };

  const patientNameMap = useMemo(
    () => new Map(
      patients.flatMap((patient) => [
        [patient.userId, patient.name || patient.userId],
        [patient._id, patient.name || patient._id],
      ])
    ),
    [patients]
  );

  const ownPatientIds = useMemo(() => {
    const ids = new Set();
    appointments.forEach((item) => {
      if (item.patientId) ids.add(String(item.patientId));
    });
    prescriptions.forEach((item) => {
      if (item.patientId) ids.add(String(item.patientId));
    });
    return ids;
  }, [appointments, prescriptions]);

  const ownPatients = useMemo(
    () => patients.filter((patient) => ownPatientIds.has(String(patient.userId || patient._id))),
    [patients, ownPatientIds]
  );

  const appointmentPatientIds = useMemo(() => {
    const ids = new Set();
    appointments.forEach((item) => {
      if (item.patientId) ids.add(String(item.patientId));
    });
    return ids;
  }, [appointments]);

  const reportPatients = useMemo(
    () => patients.filter((patient) => appointmentPatientIds.has(String(patient.userId || patient._id))),
    [patients, appointmentPatientIds]
  );

  useEffect(() => {
    if (!reportPatientId) return;
    if (!reportPatients.some((patient) => String(patient.userId || patient._id) === String(reportPatientId))) {
      setReportPatientId(reportPatients[0]?.userId || '');
      setPatientReport(null);
    }
  }, [reportPatients, reportPatientId]);

  const relatedPatientCount = useMemo(() => {
    const patientIds = new Set();
    appointments.forEach((item) => {
      if (item.patientId) patientIds.add(String(item.patientId));
    });
    prescriptions.forEach((item) => {
      if (item.patientId) patientIds.add(String(item.patientId));
    });
    return patientIds.size;
  }, [appointments, prescriptions]);

  const doctorAvailabilityCount = availability.length;
  const doctorPrescriptionCount = prescriptions.length;
  const doctorAppointmentCount = appointments.length;

  const timeOptions = useMemo(
    () => Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`),
    []
  );

  const pendingAppointments = useMemo(
    () => appointments.filter((item) => ['pending', 'confirmed'].includes(item.status)),
    [appointments]
  );

  const acceptedAppointments = useMemo(
    () => appointments.filter((item) => ['confirmed', 'completed'].includes(item.status)),
    [appointments]
  );

  const requestAppointments = useMemo(
    () => appointments.filter((item) => item.status === 'pending'),
    [appointments]
  );

  const consultationAppointments = useMemo(
    () => appointments.filter((item) => item.status === 'confirmed'),
    [appointments]
  );

  const selectedConsultationAppointment = useMemo(
    () => appointments.find((item) => item._id === selectedAppointmentId) || null,
    [appointments, selectedAppointmentId]
  );

  const totalAppointmentsCount = appointments.length;

  const getDateKey = (value) => {
    if (!value) return null;

    if (typeof value === 'string') {
      const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
      if (match) return match[1];
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return null;

    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const currentDoctorIds = useMemo(
    () => Array.from(new Set([profile?._id, profile?.userId].filter(Boolean).map(String))),
    [profile]
  );

  const todayAppointmentsCount = useMemo(() => {
    const todayKey = getDateKey(new Date());
    return appointments.filter((item) => {
      const appointmentDoctorId = String(item.doctorId || '');
      const confirmedByDoctorId = String(item.confirmedByDoctorId || '');
      const confirmedByDoctorUserId = String(item.confirmedByDoctorUserId || '');
      return (
        item.status === 'confirmed' &&
        currentDoctorIds.includes(appointmentDoctorId) &&
        (currentDoctorIds.includes(confirmedByDoctorId) || currentDoctorIds.includes(confirmedByDoctorUserId)) &&
        getDateKey(item.date) === todayKey
      );
    }).length;
  }, [appointments, currentDoctorIds]);

  const runBusy = async (fn) => {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await fn();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setBusy(false);
    }
  };

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getMyDoctorProfile();
      const doctor = response.data?.doctor;
      setProfile(doctor);
      setProfileForm({
        name: doctor?.name || '',
        specialty: doctor?.specialty || 'General Physician',
        phone: doctor?.phone || '',
        experience: doctor?.experience ?? 0,
        consultationFee: doctor?.consultationFee ?? 0,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load doctor profile');
    } finally {
      setLoading(false);
    }
  };

  const syncProfile = async () => {
    try {
      const response = await getMyDoctorProfile();
      const doctor = response.data?.doctor;
      if (!doctor) return;
      setProfile(doctor);
      setProfileForm({
        name: doctor?.name || '',
        specialty: doctor?.specialty || 'General Physician',
        phone: doctor?.phone || '',
        experience: doctor?.experience ?? 0,
        consultationFee: doctor?.consultationFee ?? 0,
      });
    } catch {
      // Keep current profile state if background sync fails.
    }
  };

  const loadAvailability = async () => {
    if (!profile?._id) return;
    const ids = Array.from(new Set([profile._id, profile.userId].filter(Boolean)));
    const responses = await Promise.allSettled(ids.map((doctorId) => getDoctorAvailability(doctorId)));
    const availabilityById = new Map();

    responses.forEach((result) => {
      if (result.status !== 'fulfilled') return;
      (result.value.data?.availability || []).forEach((item) => {
        availabilityById.set(String(item._id), item);
      });
    });

    setAvailability(Array.from(availabilityById.values()));
  };

  const loadAppointments = async () => {
    const response = await getDoctorAppointmentRequests();
    const data = response.data?.appointments || [];
    setAppointments(data);
    if (!selectedAppointmentId && data.length > 0) {
      setSelectedAppointmentId(data[0]._id);
    }
  };

  const loadPatients = async () => {
    const response = await getPatients({ isActive: true });
    setPatients(response.data?.patients || []);
  };

  const loadPrescriptions = async () => {
    const response = await getDoctorPrescriptions();
    const prescriptionsData = response.data?.prescriptions || [];
    setPrescriptions(Array.from(new Map(prescriptionsData.map((item) => [String(item._id), item])).values()));
  };

  useEffect(() => {
    loadProfile();
    loadPatients();
    loadPrescriptions();
  }, []);

  useEffect(() => {
    if (profile?._id) {
      loadAvailability();

      // Load appointments once profile resolves so dashboard counters stay visible.
      loadAppointments().catch(() => {
        setAppointments([]);
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    if (activeTab === 'Profile') {
      syncProfile();
      return;
    }
    if (activeTab === 'Availability') {
      runBusy(loadAvailability);
      return;
    }
    if (activeTab === 'Appointments' || activeTab === 'Video Consultation') {
      runBusy(loadAppointments);
      return;
    }
    if (activeTab === 'Prescriptions') {
      runBusy(loadPrescriptions);
    }
  }, [activeTab, profile]);

  const submitProfile = async (e) => {
    e.preventDefault();
    await runBusy(async () => {
      // Validate form data
      if (!profileForm.name?.trim()) throw new Error('Name is required');
      if (!profileForm.specialty?.trim()) throw new Error('Specialty is required');
      
      // Submit update with proper number conversion
      const updatePayload = {
        name: profileForm.name.trim(),
        specialty: profileForm.specialty.trim(),
        phone: profileForm.phone.trim(),
        experience: profileForm.experience ? Number(profileForm.experience) : 0,
        consultationFee: profileForm.consultationFee ? Number(profileForm.consultationFee) : 0,
      };
      
      const response = await updateMyDoctorProfile(updatePayload);
      const updatedDoctor = response.data?.doctor;
      
      if (!updatedDoctor) throw new Error('Server did not return updated profile');
      
      setProfile(updatedDoctor);
      setProfileForm({
        name: updatedDoctor.name || '',
        specialty: updatedDoctor.specialty || 'General Physician',
        phone: updatedDoctor.phone || '',
        experience: updatedDoctor.experience ?? 0,
        consultationFee: updatedDoctor.consultationFee ?? 0,
      });
      
      setSuccess('Profile updated successfully');
      setProfileEditorOpen(false);
    });
  };

  const submitAvailability = async (e) => {
    e.preventDefault();
    await runBusy(async () => {
      if (!availabilityForm.fromTime || !availabilityForm.toTime) {
        setError('Select both from and to times');
        return;
      }

      if (availabilityForm.fromTime >= availabilityForm.toTime) {
        setError('"To" time must be later than "From" time');
        return;
      }

      const slot = `${availabilityForm.fromTime}-${availabilityForm.toTime}`;
      const normalizedSlot = normalizeTo24HourSlot(slot);
      if (!normalizedSlot) {
        setError('Use valid 24-hour time');
        return;
      }

      await saveDoctorAvailability({ date: availabilityForm.date, timeSlots: [normalizedSlot] });
      setAvailabilityForm({ date: '', fromTime: '', toTime: '' });
      await loadAvailability();
      setSuccess('Availability saved');
    });
  };

  const cancelAvailabilityWithMessage = async (availabilityId) => {
    const message = window.prompt('Enter cancellation message for patients:');
    if (!message || !message.trim()) {
      setError('Cancellation message is required');
      return;
    }

    await runBusy(async () => {
      const response = await cancelDoctorAvailability(availabilityId, message.trim());
      await loadAvailability();
      setSuccess(response.data?.message || 'Availability cancelled');
    });
  };

  const changeAppointmentStatus = async (id, status) => {
    await runBusy(async () => {
      await updateDoctorAppointmentStatus(id, status);
      await loadAppointments();
      setSuccess(`Appointment ${status}`);
    });
  };

  const startConsultation = async () => {
    if (!selectedAppointmentId) {
      setError('Select an appointment first');
      return;
    }
    await runBusy(async () => {
      const response = await getDoctorTelemedicineLink(selectedAppointmentId);
      const link = response.data?.meetingLink || '';
      if (!link) {
        throw new Error('Meeting link could not be generated');
      }
      setMeetingLink(link);
      window.open(link, '_blank', 'noopener,noreferrer');
      setSuccess('Consultation started');
    });
  };

  const submitPrescription = async (e) => {
    e.preventDefault();
    await runBusy(async () => {
      if (!prescriptionForm.patientId) {
        setError('Select a patient name');
        return;
      }
      const payload = {
        patientId: prescriptionForm.patientId,
        diagnosis: prescriptionForm.diagnosis,
        medicines: prescriptionForm.medicines
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        notes: prescriptionForm.notes,
      };
      await createDoctorPrescription(payload);
      setPrescriptionForm({ patientId: '', diagnosis: '', medicines: '', notes: '' });
      await loadPrescriptions();
      setSuccess('Prescription created');
    });
  };

  const loadPatientReport = async () => {
    if (!reportPatientId.trim()) {
      setError('Select a patient name');
      return;
    }
    await runBusy(async () => {
      const response = await getDoctorPatientReports(reportPatientId.trim());
      setPatientReport(response.data);
      setSuccess('Patient report loaded');
    });
  };

  const removeOwnProfile = async () => {
    await runBusy(async () => {
      await deleteMyDoctorProfile();
      localStorage.removeItem('emedicare_token');
      localStorage.removeItem('emedicare_user');
      window.location.href = '/';
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('emedicare_token');
    localStorage.removeItem('emedicare_user');
    window.location.href = '/';
  };

  const exportAvailabilityPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text('Availability Schedule', 14, 16);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    const rows = availability.map((item) => [
      item.date || '-',
      (item.timeSlots || []).join(', ') || 'None',
    ]);

    autoTable(doc, {
      head: [['Date', 'Time Slots']],
      body: rows.length ? rows : [['No data', '-']],
      startY: 28,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.save('availability-schedule.pdf');
  };

  const exportPrescriptionsPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text('Issued Prescriptions', 14, 16);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    const rows = prescriptions.map((item) => [
      patientNameMap.get(item.patientId) || item.patientId || '-',
      item.diagnosis || '-',
      (item.medicines || []).join(', ') || 'None',
      item.notes || '-',
      item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-',
    ]);

    autoTable(doc, {
      head: [['Patient', 'Diagnosis', 'Medicines', 'Notes', 'Created']],
      body: rows.length ? rows : [['No data', '-', '-', '-', '-']],
      startY: 28,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.save('issued-prescriptions.pdf');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-bg-surface2 border-t-primary rounded-full animate-spin" />
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
              <p className="section-tag mb-2">Doctor Panel</p>
              <h2 className="font-heading text-xl">Control Center</h2>
              <p className="text-xs text-white/50 mt-1">{profile?.email || 'doctor user'}</p>
            </div>

            <nav className="mt-6 space-y-2">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    setSidebarOpen(false);
                  }}
                  className={`btn-outline w-full justify-start ${activeTab === tab ? 'bg-primary/15 text-primary border-primary/30' : ''}`}
                >
                  {tab}
                </button>
              ))}
            </nav>

            <div className="mt-auto pt-6 border-t border-white/10">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/30 px-4 py-2 rounded-xl transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/35 z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className={`flex-1 min-w-0 space-y-6 transition-all duration-300 ${sidebarOpen ? 'md:pl-64' : ''}`}>
        <header className="card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="section-tag mb-2">Doctor Dashboard</p>
              <h1 className="text-3xl font-heading font-bold">Welcome, {profile?.name || 'Doctor'}</h1>
              <p className="text-white/55 mt-1 text-sm">Manage your profile, schedule, appointments, and consultations.</p>
            </div>
            <button
              type="button"
              onClick={() => setProfileEditorOpen(true)}
              className="w-11 h-11 rounded-full border border-primary/35 bg-primary/10 hover:bg-primary/20 text-lg transition-colors"
              aria-label="Open profile management"
              title="Profile Management"
            >
              👤
            </button>
          </div>
        </header>

        {error && <div className="alert-error">{error}</div>}
        {success && <div className="border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 rounded-xl px-4 py-3 text-sm">{success}</div>}

        {activeTab === 'Profile' && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card">
                <h3 className="text-sm text-white/60">Total Appointments</h3>
                <p className="text-3xl font-heading font-bold mt-1">{doctorAppointmentCount}</p>
              </div>
              <div className="card">
                <h3 className="text-sm text-white/60">Appointments Today</h3>
                <p className="text-3xl font-heading font-bold mt-1">{todayAppointmentsCount}</p>
              </div>
            </div>

            <div className="card">
              <h2 className="font-heading text-xl mb-4">Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <p><span className="text-white/60">Name:</span> {profile?.name || '-'}</p>
                <p><span className="text-white/60">Specialty:</span> {profile?.specialty || '-'}</p>
                <p><span className="text-white/60">Phone:</span> {profile?.phone || '-'}</p>
                <p><span className="text-white/60">Email:</span> {profile?.email || '-'}</p>
                <p><span className="text-white/60">Experience:</span> {profile?.experience ?? 0} years</p>
                <p><span className="text-white/60">Consultation Fee:</span> {profile?.consultationFee ?? 0}</p>
              </div>
              <p className="text-xs text-white/45 mt-3">Click the profile icon in the header to update or delete your profile.</p>
            </div>

            <div className="card">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="font-heading text-xl">Availability Schedule</h2>
                <button type="button" className="btn-outline text-sm" onClick={exportAvailabilityPdf}>Export PDF</button>
              </div>
              <div className="space-y-2">
                {availability.length === 0 && <p className="text-sm text-white/50">No availability schedule saved yet.</p>}
                {availability.map((item) => (
                  <div key={item._id} className="border border-white/10 rounded-xl px-3 py-2 text-sm">
                    <p><span className="text-white/60">Date:</span> {item.date}</p>
                    <p><span className="text-white/60">Time Slots:</span> {(item.timeSlots || []).join(', ') || 'None'}</p>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => cancelAvailabilityWithMessage(item._id)}
                      className="mt-2 text-red-300 hover:text-red-100"
                    >
                      Cancel Availability
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="font-heading text-xl">Issued Prescriptions</h2>
                <button type="button" className="btn-outline text-sm" onClick={exportPrescriptionsPdf}>Export PDF</button>
              </div>
              <div className="space-y-2">
                {prescriptions.length === 0 && <p className="text-sm text-white/50">No prescriptions issued yet.</p>}
                {prescriptions.map((item) => (
                  <div key={item._id} className="border border-white/10 rounded-xl px-3 py-2 text-sm">
                    <p><span className="text-white/60">Patient:</span> {patientNameMap.get(item.patientId) || item.patientId}</p>
                    <p><span className="text-white/60">Diagnosis:</span> {item.diagnosis}</p>
                    <p><span className="text-white/60">Medicines:</span> {(item.medicines || []).join(', ') || 'None'}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'Availability' && (
          <section className="card space-y-4">
            <h2 className="font-heading text-xl">Availability Management</h2>
            <form onSubmit={submitAvailability} className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input type="date" className="form-input" value={availabilityForm.date} onChange={(e) => setAvailabilityForm((p) => ({ ...p, date: e.target.value }))} required />
              <select
                className="form-input"
                value={availabilityForm.fromTime}
                onChange={(e) => setAvailabilityForm((p) => ({ ...p, fromTime: e.target.value }))}
                required
              >
                <option value="">From</option>
                {timeOptions.map((time) => (
                  <option key={`from-${time}`} value={time}>{time}</option>
                ))}
              </select>
              <select
                className="form-input"
                value={availabilityForm.toTime}
                onChange={(e) => setAvailabilityForm((p) => ({ ...p, toTime: e.target.value }))}
                required
              >
                <option value="">To</option>
                {timeOptions.map((time) => (
                  <option key={`to-${time}`} value={time}>{time}</option>
                ))}
              </select>
              <button type="submit" disabled={busy} className="btn-primary md:col-span-4 justify-center">Save Availability</button>
            </form>
          </section>
        )}

        {activeTab === 'Appointments' && (
          <section className="space-y-6">
            <div className="card">
              <h2 className="font-heading text-xl mb-4">Accepted Appointments</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-white/60 border-b border-white/10">
                    <tr>
                      <th className="text-left py-2 pr-3">Appointment ID</th>
                      <th className="text-left py-2 pr-3">Patient</th>
                      <th className="text-left py-2 pr-3">Date/Time</th>
                      <th className="text-left py-2 pr-3">Type</th>
                      <th className="text-left py-2 pr-3">Notes</th>
                      <th className="text-left py-2 pr-3">Status</th>
                      <th className="text-left py-2 pr-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acceptedAppointments.length === 0 && (
                      <tr>
                        <td className="py-3 text-white/50" colSpan={7}>No accepted appointments found.</td>
                      </tr>
                    )}
                    {acceptedAppointments.map((item) => (
                      <tr key={item._id} className="border-b border-white/5">
                        <td className="py-2 pr-3">{item._id}</td>
                        <td className="py-2 pr-3">{item.patientName || item.patientId}</td>
                        <td className="py-2 pr-3">{new Date(item.date).toLocaleDateString()} {item.time}</td>
                        <td className="py-2 pr-3 capitalize">{item.type || 'in-person'}</td>
                        <td className="py-2 pr-3">{item.notes || '-'}</td>
                        <td className="py-2 pr-3 capitalize">{item.status}</td>
                        <td className="py-2 pr-3">
                          {item.status === 'confirmed' ? (
                            <button
                              className="text-red-300 hover:text-red-100"
                              disabled={busy}
                              onClick={() => changeAppointmentStatus(item._id, 'cancelled')}
                            >
                              Cancel
                            </button>
                          ) : (
                            <span className="text-white/40">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <h2 className="font-heading text-xl mb-4">Appointment Requests</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-white/60 border-b border-white/10">
                    <tr>
                      <th className="text-left py-2 pr-3">Appointment ID</th>
                      <th className="text-left py-2 pr-3">Patient</th>
                      <th className="text-left py-2 pr-3">Date/Time</th>
                      <th className="text-left py-2 pr-3">Type</th>
                      <th className="text-left py-2 pr-3">Notes</th>
                      <th className="text-left py-2 pr-3">Status</th>
                      <th className="text-left py-2 pr-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requestAppointments.length === 0 && (
                      <tr>
                        <td className="py-3 text-white/50" colSpan={7}>No pending appointment requests found.</td>
                      </tr>
                    )}
                    {requestAppointments.map((item) => (
                      <tr key={item._id} className="border-b border-white/5">
                        <td className="py-2 pr-3">{item._id}</td>
                        <td className="py-2 pr-3">{item.patientName || item.patientId}</td>
                        <td className="py-2 pr-3">{new Date(item.date).toLocaleDateString()} {item.time}</td>
                        <td className="py-2 pr-3 capitalize">{item.type || 'in-person'}</td>
                        <td className="py-2 pr-3">{item.notes || '-'}</td>
                        <td className="py-2 pr-3 capitalize">{item.status}</td>
                        <td className="py-2 pr-3 space-x-3">
                          <button className="text-emerald-300 hover:text-emerald-100" disabled={busy} onClick={() => changeAppointmentStatus(item._id, 'confirmed')}>Accept</button>
                          <button className="text-red-300 hover:text-red-100" disabled={busy} onClick={() => changeAppointmentStatus(item._id, 'rejected')}>Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'Video Consultation' && (
          <section className="card space-y-4">
            <h2 className="font-heading text-xl">Video Consultation</h2>
            <select className="form-input" value={selectedAppointmentId} onChange={(e) => setSelectedAppointmentId(e.target.value)}>
              <option value="">Select appointment</option>
              {consultationAppointments.map((item) => (
                <option key={item._id} value={item._id}>{item.patientName || item.patientId} - {new Date(item.date).toLocaleDateString()} {item.time}</option>
              ))}
            </select>
            {selectedConsultationAppointment && (
              <div className="border border-white/10 rounded-xl p-3 text-sm space-y-1">
                <p><span className="text-white/60">Patient:</span> {selectedConsultationAppointment.patientName || selectedConsultationAppointment.patientId}</p>
                <p><span className="text-white/60">Patient ID:</span> {selectedConsultationAppointment.patientId}</p>
                <p><span className="text-white/60">Requested Date/Time:</span> {new Date(selectedConsultationAppointment.date).toLocaleDateString()} {selectedConsultationAppointment.time}</p>
                <p><span className="text-white/60">Consultation Type:</span> {selectedConsultationAppointment.type || 'video'}</p>
                <p><span className="text-white/60">Request Notes:</span> {selectedConsultationAppointment.notes || '-'}</p>
              </div>
            )}
            {consultationAppointments.length === 0 && (
              <p className="text-sm text-white/50">No confirmed appointments available to start consultation.</p>
            )}
            <button type="button" disabled={busy || !selectedAppointmentId} onClick={startConsultation} className="btn-primary justify-center">Start Consultation</button>
            {meetingLink && (
              <a href={meetingLink} target="_blank" rel="noreferrer" className="text-primary underline break-all">
                {meetingLink}
              </a>
            )}
          </section>
        )}

        {activeTab === 'Prescriptions' && (
          <section className="card space-y-4">
            <h2 className="font-heading text-xl">Digital Prescriptions</h2>
            <form onSubmit={submitPrescription} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                className="form-input"
                value={prescriptionForm.patientId}
                onChange={(e) => setPrescriptionForm((p) => ({ ...p, patientId: e.target.value }))}
                required
              >
                <option value="">Select patient name</option>
                {ownPatients.map((patient) => (
                  <option key={patient.userId} value={patient.userId}>
                    {patient.name} {patient.email ? `(${patient.email})` : ''}
                  </option>
                ))}
              </select>
              <input className="form-input" placeholder="Diagnosis" value={prescriptionForm.diagnosis} onChange={(e) => setPrescriptionForm((p) => ({ ...p, diagnosis: e.target.value }))} required />
              <input className="form-input md:col-span-2" placeholder="Medicines (comma separated)" value={prescriptionForm.medicines} onChange={(e) => setPrescriptionForm((p) => ({ ...p, medicines: e.target.value }))} />
              <textarea className="form-input md:col-span-2" placeholder="Notes" value={prescriptionForm.notes} onChange={(e) => setPrescriptionForm((p) => ({ ...p, notes: e.target.value }))} />
              <button type="submit" disabled={busy} className="btn-primary md:col-span-2 justify-center">Create Prescription</button>
            </form>
          </section>
        )}

        {activeTab === 'Patient Reports' && (
          <section className="card space-y-4">
            <h2 className="font-heading text-xl">Patient Reports</h2>
            <div className="flex gap-2 flex-col md:flex-row">
              <select className="form-input" value={reportPatientId} onChange={(e) => setReportPatientId(e.target.value)}>
                <option value="">Select patient name</option>
                {reportPatients.map((patient) => (
                  <option key={patient.userId} value={patient.userId}>
                    {patient.name} {patient.email ? `(${patient.email})` : ''}
                  </option>
                ))}
              </select>
              <button type="button" disabled={busy} onClick={loadPatientReport} className="btn-primary">Load</button>
            </div>
            {patientReport && (
              <div className="border border-white/10 rounded-xl p-3 text-sm space-y-1">
                <p><span className="text-white/60">Name:</span> {patientReport.name}</p>
                <p><span className="text-white/60">Email:</span> {patientReport.email}</p>
                <p><span className="text-white/60">Allergies:</span> {(patientReport.allergies || []).join(', ') || 'None'}</p>
                <p><span className="text-white/60">Current Medications:</span> {(patientReport.currentMedications || []).join(', ') || 'None'}</p>
                <div>
                  <p className="text-white/60">Medical History:</p>
                  <ul className="list-disc pl-6">
                    {(patientReport.medicalHistory || []).map((entry, idx) => (
                      <li key={`${entry.condition || 'history'}-${idx}`}>{entry.condition || 'Record'} {entry.notes ? `- ${entry.notes}` : ''}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-white/60">Uploaded PDF Reports:</p>
                  {(patientReport.reports || []).length === 0 && (
                    <p className="text-white/50">No PDF reports uploaded yet.</p>
                  )}
                  <ul className="space-y-1 mt-1">
                    {(patientReport.reports || []).map((report) => (
                      <li key={`${report.fileName}-${report.uploadedAt}`}>
                        <a
                          href={report.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline break-all"
                        >
                          {report.originalName}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>
        )}

        {profileEditorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4">
            <div className="w-full max-w-2xl card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-xl">Profile Management</h2>
                <button
                  type="button"
                  onClick={() => setProfileEditorOpen(false)}
                  className="text-white/60 hover:text-white"
                >
                  Close
                </button>
              </div>
              <form onSubmit={submitProfile} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="block">
                  <span className="form-label">Name</span>
                  <input className="form-input" value={profileForm.name} onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))} placeholder="Name" required />
                </label>
                <label className="block">
                  <span className="form-label">Specialty</span>
                  <input className="form-input" value={profileForm.specialty} onChange={(e) => setProfileForm((p) => ({ ...p, specialty: e.target.value }))} placeholder="Specialty" required />
                </label>
                <label className="block">
                  <span className="form-label">Phone</span>
                  <input className="form-input" value={profileForm.phone} onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" />
                </label>
                <label className="block">
                  <span className="form-label">Experience (Years)</span>
                  <input className="form-input" type="number" min="0" value={profileForm.experience} onChange={(e) => setProfileForm((p) => ({ ...p, experience: e.target.value }))} placeholder="Experience (years)" />
                </label>
                <label className="block">
                  <span className="form-label">Consultation Fee</span>
                  <input className="form-input" type="number" min="0" value={profileForm.consultationFee} onChange={(e) => setProfileForm((p) => ({ ...p, consultationFee: e.target.value }))} placeholder="Consultation fee" />
                </label>
                <label className="block">
                  <span className="form-label">Email</span>
                  <input className="form-input opacity-70" value={profile?.email || ''} disabled />
                </label>
                <button type="submit" disabled={busy} className="btn-primary md:col-span-2 justify-center">Update Profile</button>
              </form>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (window.confirm('Delete your doctor profile?')) removeOwnProfile();
                }}
                className="mt-4 text-red-300 hover:text-red-100"
              >
                Delete My Profile
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </main>
  );
}
