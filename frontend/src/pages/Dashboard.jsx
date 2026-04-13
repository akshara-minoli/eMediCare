import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  createPatient,
  getPatient,
  getPatientReports,
  updatePatient,
  uploadPatientReport,
} from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
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

  const handleReportUpload = async (e) => {
    e.preventDefault();
    setReportMessage('');

    if (!user?.id || user.role !== 'patient') return;
    if (!reportFile) {
      setReportMessage('Please choose a PDF file first.');
      return;
    }

    if (reportFile.type !== 'application/pdf') {
      setReportMessage('Only PDF files are allowed.');
      return;
    }

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

  if (!user) return null;

  const quickLinks = [
    { icon: '🩺', label: 'Find a Doctor',  to: '/doctors',          color: 'bg-primary/10 border-primary/20' },
    { icon: '📅', label: 'My Appointments', to: '/appointments',     color: 'bg-emerald-500/10 border-emerald-500/20' },
    { icon: '🤖', label: 'AI Symptom Check',to: '/symptom-checker',  color: 'bg-purple-500/10 border-purple-500/20' },
  ];

  const formatDate = (value) => {
    if (!value) return 'N/A';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
  };

  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <div className="section-tag mb-3">Dashboard</div>
          <h1 className="text-3xl font-heading font-bold">
            Good day, <span className="text-gradient">{user.name}</span> 👋
          </h1>
          <p className="text-white/50 mt-1 text-sm">
            Role: <span className="badge badge-primary capitalize">{user.role}</span>
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {quickLinks.map(({ icon, label, to, color }) => (
            <Link key={to} to={to}
              className={`flex items-center gap-4 p-5 rounded-2xl border ${color} hover:-translate-y-1 transition-all duration-300`}>
              <span className="text-3xl">{icon}</span>
              <span className="font-semibold text-sm">{label}</span>
            </Link>
          ))}
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-heading font-semibold text-lg mb-3">Account Info</h2>
            <div className="space-y-2 text-sm text-white/60">
              <div className="flex justify-between"><span>Name</span><span className="text-white">{user.name}</span></div>
              <div className="flex justify-between"><span>Email</span><span className="text-white">{user.email}</span></div>
              <div className="flex justify-between"><span>Role</span><span className="text-white capitalize">{user.role}</span></div>
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
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
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
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="font-heading font-semibold text-lg">Medical History</h2>
              <Link to="/appointments" className="btn-primary text-xs px-4 py-2">View Appointments</Link>
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
        </div>

        {user.role === 'patient' && (
          <section className="card mt-6 space-y-4">
            <h2 className="font-heading font-semibold text-lg">Upload Medical Report (PDF)</h2>
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
          </section>
        )}
      </div>
    </main>
  );
}
