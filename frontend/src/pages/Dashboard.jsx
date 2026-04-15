import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  createPatient,
  getPatient,
  getPatientReports,
  updatePatient,
  uploadPatientReport,
  getPaymentHistory,
} from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [reportFile, setReportFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [reports, setReports] = useState([]);
  const [profile, setProfile] = useState({ phone: '', bloodGroup: '' });
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('emedicare_user');
    if (!stored) { navigate('/login'); return; }
    setUser(JSON.parse(stored));
  }, [navigate]);

  useEffect(() => {
    const loadReports = async () => {
      if (!user?.id || user.role !== 'patient') return;
      try {
        const response = await getPatientReports(user.id);
        setReports(response.data?.reports || []);
      } catch {
        setReports([]);
      }
    };
    loadReports();
  }, [user]);

  useEffect(() => {
    const loadPatientProfile = async () => {
      if (!user || user.role !== 'patient') return;
      setProfileLoading(true);
      setProfileError('');
      setProfileMessage('');
      try {
        const { data } = await getPatient(user.id);
        setProfile({
          phone: data?.patient?.phone || '',
          bloodGroup: data?.patient?.bloodGroup || '',
        });
        setMedicalHistory(data?.patient?.medicalHistory || []);
      } catch (err) {
        if (err.response?.status === 404) {
          try {
            await createPatient({ userId: user.id, name: user.name, email: user.email });
            setProfile({ phone: '', bloodGroup: '' });
            setMedicalHistory([]);
          } catch (createErr) {
            setProfileError(createErr.response?.data?.message || 'Failed to initialize patient profile.');
          }
        } else {
          setProfileError(err.response?.data?.message || 'Failed to load patient profile.');
        }
      } finally {
        setProfileLoading(false);
      }
    };
    loadPatientProfile();
  }, [user]);

  useEffect(() => {
    const loadPayments = async () => {
      if (!user?.id || user.role !== 'patient') return;
      setPaymentsLoading(true);
      try {
        const res = await getPaymentHistory(user.id);
        setPayments(res.data?.payments || []);
      } catch {
        setPayments([]);
      } finally {
        setPaymentsLoading(false);
      }
    };
    loadPayments();
  }, [user]);

  const handleProfileChange = (e) => {
    setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!user || user.role !== 'patient') return;
    setProfileSaving(true);
    setProfileError('');
    setProfileMessage('');
    try {
      await updatePatient(user.id, profile);
      setProfileMessage('Patient profile updated successfully.');
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update patient profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('emedicare_token');
    localStorage.removeItem('emedicare_user');
    navigate('/login', { replace: true });
  };

  const jumpTo = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setSidebarOpen(false);
  };

  const handleReportUpload = async (e) => {
    e.preventDefault();
    setReportMessage('');
    if (!user?.id || user.role !== 'patient') return;
    if (!reportFile) { setReportMessage('Please choose a PDF file first.'); return; }
    if (reportFile.type !== 'application/pdf') { setReportMessage('Only PDF files are allowed.'); return; }

    const formData = new FormData();
    formData.append('report', reportFile);
    setUploading(true);
    try {
      await uploadPatientReport(user.id, formData);
      setReportMessage('Report uploaded successfully.');
      setReportFile(null);
      const response = await getPatientReports(user.id);
      setReports(response.data?.reports || []);
    } catch (err) {
      setReportMessage(err.response?.data?.message || 'Failed to upload report.');
    } finally {
      setUploading(false);
    }
  };

  const downloadReceipt = (payment) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(10, 15, 40);
    doc.rect(0, 0, pageWidth, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('eMediCare', 14, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(180, 190, 220);
    doc.text('Official Payment Receipt', 14, 26);
    doc.text('Advanced Healthcare Management System', 14, 32);

    doc.setFillColor(56, 82, 219);
    doc.roundedRect(pageWidth - 50, 10, 36, 14, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('PAID', pageWidth - 34, 18, { align: 'center' });

    doc.setDrawColor(56, 82, 219);
    doc.setLineWidth(0.8);
    doc.line(14, 48, pageWidth - 14, 48);

    doc.setTextColor(30, 30, 60);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Receipt', 14, 60);

    const transDate = payment.createdAt
      ? new Date(payment.createdAt).toLocaleString()
      : new Date().toLocaleString();

    autoTable(doc, {
      startY: 65,
      margin: { left: 14, right: 14 },
      head: [['Field', 'Details']],
      body: [
        ['Transaction ID', payment.transactionId || 'N/A'],
        ['Date & Time', transDate],
        ['Amount Paid', `$${Number(payment.amount || 0).toFixed(2)} USD`],
        ['Status', 'PAID ✓'],
        ['Patient', payment.patientName || user?.name || 'N/A'],
        ['Doctor', `Dr. ${payment.doctorName || 'N/A'}`],
        ['Appointment ID', payment.appointmentId || 'N/A'],
        ['Appointment Date', `${payment.appointmentDate || 'N/A'} ${payment.appointmentTime || ''}`],
      ],
      headStyles: { fillColor: [56, 82, 219], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [40, 40, 80] },
      alternateRowStyles: { fillColor: [240, 243, 255] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
    });

    const afterTable = doc.lastAutoTable.finalY + 10;
    doc.setFillColor(240, 243, 255);
    doc.roundedRect(14, afterTable, pageWidth - 28, 18, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 160);
    doc.text('Thank you for choosing eMediCare. This is an official digitally generated receipt.', pageWidth / 2, afterTable + 8, { align: 'center' });
    doc.text('For queries, contact support@emedicare.health', pageWidth / 2, afterTable + 14, { align: 'center' });

    doc.save(`receipt-${payment.transactionId || payment._id}.pdf`);
  };

  if (!user) return null;

  const quickLinks = [
    { icon: '🩺', label: 'Find a Doctor',  to: '/doctors',          color: 'bg-primary/10 border-primary/20' },
    { icon: '📅', label: 'My Appointments', to: '/appointments',     color: 'bg-emerald-500/10 border-emerald-500/20' },
    { icon: '🤖', label: 'AI Symptom Check',to: '/symptom-checker',  color: 'bg-purple-500/10 border-purple-500/20' },
  ];

  const sidebarItems = [
    { id: 'patient-overview', label: 'Overview', icon: '📊' },
    { id: 'patient-profile', label: 'Profile', icon: '👤' },
    { id: 'patient-history', label: 'Medical History', icon: '📋' },
    { id: 'patient-reports', label: 'Reports', icon: '📄' },
    { id: 'patient-appointments', label: 'Appointments', icon: '📅' },
    { id: 'patient-telemedicine', label: 'Telemedicine', icon: '📹' },
    { id: 'patient-payments', label: 'Payment History', icon: '💳' },
    { id: 'patient-ai', label: 'AI Checker', icon: '🤖' },
  ];

  const formatDate = (value) => {
    if (!value) return 'N/A';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
  };

  const successfulPayments = payments.filter((p) => p.status === 'success');

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
            w-72 md:w-64 bg-bg-surface border-r border-white/10 p-3 md:rounded-r-2xl
            transition-transform duration-300 ease-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="flex flex-col h-full min-h-0">
            <div className="shrink-0 px-1 pt-1">
              <p className="section-tag mb-2">Patient Panel</p>
              <h2 className="font-heading text-xl">Control Center</h2>
              <p className="text-xs text-white/50 mt-1 break-all leading-snug">{user.email}</p>
            </div>

            <nav className="mt-4 flex-1 min-h-0 space-y-2 overflow-y-auto px-1 pr-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => jumpTo(item.id)}
                  className={`btn-outline w-full justify-start py-2 ${item.id === 'patient-payments' ? 'border-primary/30 text-primary bg-primary/5' : ''}`}
                >
                  <span className="mr-2">{item.icon}</span>{item.label}
                  {item.id === 'patient-payments' && successfulPayments.length > 0 && (
                    <span className="ml-auto bg-primary/20 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {successfulPayments.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div className="shrink-0 mt-3 pt-3 border-t border-white/10 space-y-2 px-1 pb-1">
              <Link to="/doctors" className="btn-primary w-full justify-center">Find Doctors</Link>
              <button type="button" onClick={() => jumpTo('patient-reports')} className="btn-ghost w-full justify-center">View Reports</button>
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

        <section className={`flex-1 min-w-0 space-y-8 transition-all duration-300 ${sidebarOpen ? 'md:pl-64' : ''}`}>
            <div className="card">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <div className="section-tag mb-3">Dashboard</div>
                  <h1 className="text-3xl font-heading font-bold">
                    Good day, <span className="text-gradient">{user.name}</span> 👋
                  </h1>
                  <p className="text-white/50 mt-1 text-sm">
                    Role: <span className="badge badge-primary capitalize">{user.role}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => jumpTo('patient-profile')} className="btn-outline text-sm px-4 py-2">
                    Edit Profile
                  </button>
                  <button type="button" onClick={() => jumpTo('patient-reports')} className="btn-primary text-sm px-4 py-2">
                    Upload Report
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">Reports</p>
                  <p className="text-3xl font-heading font-bold text-white">{reports.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">History</p>
                  <p className="text-3xl font-heading font-bold text-white">{medicalHistory.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">Payments</p>
                  <p className="text-3xl font-heading font-bold text-emerald-300">{successfulPayments.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">Total Paid</p>
                  <p className="text-2xl font-heading font-bold text-white">
                    ${successfulPayments.reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(0)}
                  </p>
                </div>
              </div>
            </div>

            <div id="patient-overview" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div id="patient-profile" className="card lg:col-span-2">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="font-heading font-semibold text-lg">Account Info</h2>
                    <p className="text-xs text-white/40 mt-1">Keep your patient profile current</p>
                  </div>
                  <button type="button" onClick={() => jumpTo('patient-appointments')} className="btn-ghost text-xs px-4 py-2">
                    Appointments
                  </button>
                </div>

                <div className="space-y-2 text-sm text-white/60">
                  <div className="flex justify-between gap-4"><span>Name</span><span className="text-white text-right">{user.name}</span></div>
                  <div className="flex justify-between gap-4"><span>Email</span><span className="text-white text-right break-all">{user.email}</span></div>
                  <div className="flex justify-between gap-4"><span>Role</span><span className="text-white capitalize">{user.role}</span></div>
                </div>

                {user.role === 'patient' && (
                  <form onSubmit={handleProfileSave} className="mt-6 space-y-3">
                    <h3 className="font-semibold text-white text-sm">Patient Profile</h3>
                    {profileError && <div className="alert-error">{profileError}</div>}
                    {profileMessage && <div className="text-emerald-300 text-xs">{profileMessage}</div>}
                    <div>
                      <label className="form-label">Phone</label>
                      <input
                        type="text"
                        name="phone"
                        className="form-input"
                        placeholder="+94770000000"
                        value={profile.phone}
                        onChange={handleProfileChange}
                        disabled={profileLoading || profileSaving}
                      />
                    </div>
                    <div>
                      <label className="form-label">Blood Group</label>
                      <select
                        name="bloodGroup"
                        className="form-input"
                        value={profile.bloodGroup}
                        onChange={handleProfileChange}
                        disabled={profileLoading || profileSaving}
                      >
                        <option value="">Not set</option>
                        {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="btn-primary text-sm px-4 py-2"
                      disabled={profileLoading || profileSaving}
                    >
                      {profileSaving ? 'Saving...' : 'Save Profile'}
                    </button>
                  </form>
                )}
              </div>

              <div className="card">
                <h2 className="font-heading font-semibold text-lg mb-3">Quick Links</h2>
                <div className="space-y-3">
                  {quickLinks.map(({ icon, label, to, color }) => (
                    <Link key={to} to={to} className={`flex items-center gap-4 p-4 rounded-2xl border ${color} hover:-translate-y-1 transition-all duration-300`}>
                      <span className="text-2xl">{icon}</span>
                      <span className="font-semibold text-sm">{label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div id="patient-history" className="card">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h2 className="font-heading font-semibold text-lg">Medical History</h2>
                  <p className="text-xs text-white/40 mt-1">Your medical history is visible here</p>
                </div>
                <button type="button" onClick={() => jumpTo('patient-reports')} className="btn-primary text-xs px-4 py-2">Go to Reports</button>
              </div>
              {medicalHistory.length === 0 ? (
                <p className="text-sm text-white/50">No medical history entries yet.</p>
              ) : (
                <div className="space-y-3 max-h-[280px] overflow-auto pr-1">
                  {medicalHistory.map((entry) => (
                    <div key={entry._id || `${entry.condition}-${entry.diagnosedAt}`} className="rounded-xl border border-white/10 p-3 bg-white/5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-white">{entry.condition || 'Condition'}</p>
                        <span className="text-xs text-white/50">{formatDate(entry.diagnosedAt)}</span>
                      </div>
                      {entry.notes ? <p className="text-xs text-white/60 mt-1">{entry.notes}</p> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div id="patient-reports" className="card space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-heading font-semibold text-lg">Upload Medical Report (PDF)</h2>
                  <p className="text-xs text-white/40 mt-1">Store reports and documents in your patient profile</p>
                </div>
                <button type="button" onClick={() => jumpTo('patient-telemedicine')} className="btn-ghost text-xs px-4 py-2">
                  Telemedicine
                </button>
              </div>
              <form onSubmit={handleReportUpload} className="flex flex-col md:flex-row gap-3 md:items-center">
                <input
                  type="file"
                  accept="application/pdf"
                  className="form-input"
                  onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                />
                <button type="submit" className="btn-primary" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload Report'}
                </button>
              </form>
              {reportMessage && <p className="text-sm text-white/70">{reportMessage}</p>}
              <div className="space-y-2">
                {reports.length === 0 && <p className="text-sm text-white/50">No uploaded reports yet.</p>}
                {reports.map((report) => (
                  <a
                    key={`${report.fileName}-${report.uploadedAt}`}
                    href={report.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block border border-white/10 rounded-xl px-3 py-2 text-sm hover:border-primary/40"
                  >
                    <p className="text-white">{report.originalName}</p>
                    <p className="text-white/50 text-xs">Uploaded: {new Date(report.uploadedAt).toLocaleString()}</p>
                  </a>
                ))}
              </div>
            </div>

            <div id="patient-appointments" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <h2 className="font-heading font-semibold text-lg">Appointments</h2>
                    <p className="text-xs text-white/40 mt-1">Track your booked appointments</p>
                  </div>
                  <Link to="/appointments" className="btn-primary text-xs px-4 py-2">View Schedule</Link>
                </div>
                <p className="text-sm text-white/50">Use the appointments page to book, view, and pay for visits.</p>
              </div>

              <div id="patient-telemedicine" className="card">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <h2 className="font-heading font-semibold text-lg">Telemedicine</h2>
                    <p className="text-xs text-white/40 mt-1">Join secure video consultations</p>
                  </div>
                  <Link to="/telemedicine" className="btn-primary text-xs px-4 py-2">Open Sessions</Link>
                </div>
                <p className="text-sm text-white/50">Video call sessions will appear here when scheduled.</p>
              </div>
            </div>

            {/* ── Payment History ─────────────────────────────────────── */}
            <div id="patient-payments" className="card space-y-4">
              <div className="flex items-center justify-between gap-3 mb-1">
                <div>
                  <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
                    💳 Payment History
                  </h2>
                  <p className="text-xs text-white/40 mt-1">All your past payments and downloadable receipts</p>
                </div>
                <Link to="/appointments" className="btn-outline text-xs px-4 py-2">Pay for Appointment</Link>
              </div>

              {paymentsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-bg-surface2 border-t-primary rounded-full animate-spin" />
                </div>
              ) : successfulPayments.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <span className="text-4xl block">💳</span>
                  <p className="text-white/50 text-sm">No payment records yet.</p>
                  <Link to="/appointments" className="btn-primary text-sm px-5 py-2 inline-flex">
                    Pay for an Appointment
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-white/60 border-b border-white/10">
                      <tr>
                        <th className="text-left py-2 pr-3">Appointment ID</th>
                        <th className="text-left py-2 pr-3">Date</th>
                        <th className="text-left py-2 pr-3">Doctor</th>
                        <th className="text-left py-2 pr-3">Amount</th>
                        <th className="text-left py-2 pr-3">Method</th>
                        <th className="text-left py-2 pr-3">Transaction ID</th>
                        <th className="text-right py-2">Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {successfulPayments.map((p) => (
                        <tr key={p._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 pr-3 font-mono text-xs text-white/60">{p.appointmentId?.slice(-8) || 'N/A'}</td>
                          <td className="py-3 pr-3 text-white/70">
                            {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3 pr-3">{p.doctorName ? `Dr. ${p.doctorName}` : '—'}</td>
                          <td className="py-3 pr-3 font-semibold text-emerald-300">
                            ${Number(p.amount || 0).toFixed(2)}
                          </td>
                          <td className="py-3 pr-3 capitalize text-white/60">{p.method || 'stripe'}</td>
                          <td className="py-3 pr-3 font-mono text-xs text-white/50 max-w-[140px] truncate" title={p.transactionId}>
                            {p.transactionId || '—'}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => downloadReceipt(p)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-400/25 transition-all hover:-translate-y-0.5"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div id="patient-ai" className="card">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h2 className="font-heading font-semibold text-lg">AI Symptom Check</h2>
                  <p className="text-xs text-white/40 mt-1">Use the built-in checker for preliminary suggestions</p>
                </div>
                <Link to="/symptom-checker" className="btn-primary text-xs px-4 py-2">Open Checker</Link>
              </div>
              <p className="text-sm text-white/50">This is a support tool only, not a diagnosis.</p>
            </div>
          </section>
      </div>
    </main>
  );
}
