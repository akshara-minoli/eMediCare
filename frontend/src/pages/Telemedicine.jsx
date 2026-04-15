import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getMyDoctorProfile,
  getSessions,
  startSession,
  endSession,
} from '../services/api';

const steps = [
  { icon: '📅', title: 'Book Appointment', desc: 'Schedule a video consultation with your chosen doctor.' },
  { icon: '🔗', title: 'Get Room Link', desc: 'A secure meeting link is created for your session.' },
  { icon: '📹', title: 'Join Video Call', desc: 'Join from browser, no extra app required.' },
  { icon: '📋', title: 'Complete Consult', desc: 'Doctor can finalize notes and prescription details.' },
];

function buildJoinUrl(session) {
  if (session.joinUrl) return session.joinUrl;
  return 'https://meet.jit.si/eMediCare-' + session.roomId;
}

export default function Telemedicine() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('emedicare_user') || 'null');
    } catch {
      return null;
    }
  }, []);

  const loadSessions = async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      if (user.role === 'doctor') {
        const profileRes = await getMyDoctorProfile();
        const doctor = profileRes.data && profileRes.data.doctor ? profileRes.data.doctor : null;

        const ids = Array.from(
          new Set([doctor && doctor._id, doctor && doctor.userId, user.id].filter(Boolean))
        );

        const responses = await Promise.all(
          ids.map((id) => getSessions({ doctorId: id }))
        );

        const merged = new Map();
        responses.forEach((response) => {
          const items = response.data && response.data.sessions ? response.data.sessions : [];
          items.forEach((item) => merged.set(item._id, item));
        });

        setSessions(Array.from(merged.values()));
      } else {
        const response = await getSessions({ patientId: user.id });
        setSessions((response.data && response.data.sessions) || []);
      }
    } catch (err) {
      setError(
        (err.response && err.response.data && err.response.data.message) ||
          'Could not load telemedicine sessions.'
      );
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleJoin = async (session) => {
    setBusyId(session._id);
    setError('');

    try {
      if (session.status === 'scheduled' || session.status === 'waiting') {
        await startSession(session._id);
      }
      window.open(buildJoinUrl(session), '_blank', 'noopener,noreferrer');
      await loadSessions();
    } catch (err) {
      setError(
        (err.response && err.response.data && err.response.data.message) ||
          'Could not join session.'
      );
    } finally {
      setBusyId('');
    }
  };

  const handleEnd = async (session) => {
    setBusyId(session._id);
    setError('');

    try {
      await endSession(session._id, {});
      await loadSessions();
    } catch (err) {
      setError(
        (err.response && err.response.data && err.response.data.message) ||
          'Could not end session.'
      );
    } finally {
      setBusyId('');
    }
  };

  const statusClass = {
    scheduled: 'badge-primary',
    waiting: 'badge-amber',
    active: 'badge-green',
    ended: 'badge-red',
    missed: 'badge-red',
  };

  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="section-tag mb-3">Video Consultation</div>
          <h1 className="text-3xl font-heading font-bold mb-2">Telemedicine</h1>
          <p className="text-white/50 text-sm max-w-xl">
            Consult with verified doctors from home using secure browser based calls.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {steps.map((item, i) => (
            <div key={item.title} className="card text-center">
              <div className="text-3xl mb-3">{item.icon}</div>
              <div className="text-xs font-bold text-primary mb-1 uppercase tracking-widest">
                Step {i + 1}
              </div>
              <h3 className="font-heading font-semibold text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {!user && (
          <div className="card text-center py-12 mb-10">
            <p className="text-white/50 text-sm mb-4">Log in to view and join your sessions.</p>
            <Link to="/login" className="btn-primary px-6 py-2.5">Login to Continue</Link>
          </div>
        )}

        {user && (
          <div>
            <div className="flex items-center justify-between gap-3 mb-5">
              <h2 className="text-xl font-heading font-semibold">
                {user.role === 'doctor' ? 'Your Consultation Sessions' : 'My Video Sessions'}
              </h2>
              <button type="button" onClick={loadSessions} className="btn-outline text-sm px-4 py-2">
                Refresh
              </button>
            </div>

            {error && <div className="alert-error mb-4">{error}</div>}

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-10 h-10 border-4 border-bg-surface2 border-t-primary rounded-full animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="card text-center py-16 flex flex-col items-center gap-3">
                <span className="text-5xl">📹</span>
                <h3 className="font-heading font-semibold">No sessions yet</h3>
                <p className="text-white/40 text-sm">Book an appointment to start telemedicine.</p>
                <Link to="/doctors" className="btn-primary text-sm px-5 py-2 mt-2">Find a Doctor</Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {sessions.map((s) => (
                  <div key={s._id} className="card flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={'badge ' + (statusClass[s.status] || 'badge-primary') + ' capitalize'}>
                          {s.status}
                        </span>
                        <span className="badge badge-primary capitalize">{s.type}</span>
                      </div>
                      <p className="text-sm font-semibold">
                        Room: <span className="text-white/50 font-mono text-xs">{s.roomId}</span>
                      </p>
                      <p className="text-xs text-white/40 mt-1">
                        Scheduled: {new Date(s.scheduledAt).toLocaleString()}
                      </p>
                      {s.durationMinutes > 0 && (
                        <p className="text-xs text-white/40">Duration: {s.durationMinutes} min</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(s.status === 'scheduled' || s.status === 'waiting' || s.status === 'active') && (
                        <button
                          type="button"
                          onClick={() => handleJoin(s)}
                          className="btn-primary text-sm px-5 py-2 whitespace-nowrap"
                          disabled={busyId === s._id}
                        >
                          {busyId === s._id ? 'Please wait...' : 'Join Call'}
                        </button>
                      )}

                      {s.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => handleEnd(s)}
                          className="btn-outline text-sm px-5 py-2 whitespace-nowrap"
                          disabled={busyId === s._id}
                        >
                          End Session
                        </button>
                      )}

                      {s.status === 'ended' && (
                        <span className="text-xs text-white/40 self-center">Session completed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}