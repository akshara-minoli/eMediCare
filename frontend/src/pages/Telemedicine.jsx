import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const steps = [
  { icon: '📅', title: 'Book Appointment', desc: 'Schedule a video consultation with your chosen doctor.' },
  { icon: '🔗', title: 'Get Room Link',    desc: 'Receive a secure unique room link via email or dashboard.' },
  { icon: '📹', title: 'Join Video Call',  desc: 'Join the session at the scheduled time from any device.' },
  { icon: '📋', title: 'Get Prescription', desc: 'Doctor issues a digital prescription after the consult.' },
];

export default function Telemedicine() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const user = JSON.parse(localStorage.getItem('emedicare_user') || 'null');

  useEffect(() => {
    if (!user) return;
    const fetchSessions = async () => {
      setLoading(true);
      try {
        const key = user.role === 'doctor' ? 'doctorId' : 'patientId';
        const { data } = await axios.get('/api/telemedicine/sessions', {
          params: { [key]: user.id },
          headers: { Authorization: `Bearer ${localStorage.getItem('emedicare_token')}` },
        });
        setSessions(data.sessions || []);
      } catch {
        setError('Could not load sessions.');
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const statusColor = {
    scheduled: 'badge-primary',
    waiting:   'badge-amber',
    active:    'badge-green',
    ended:     'badge-red',
    missed:    'badge-red',
  };

  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <div className="section-tag mb-3">Video Consultation</div>
          <h1 className="text-3xl font-heading font-bold mb-2">Telemedicine</h1>
          <p className="text-white/50 text-sm max-w-xl">
            Consult with verified doctors from the comfort of your home via secure HD video calls.
          </p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {steps.map(({ icon, title, desc }, i) => (
            <div key={title} className="card text-center">
              <div className="text-3xl mb-3">{icon}</div>
              <div className="text-xs font-bold text-primary mb-1 uppercase tracking-widest">Step {i + 1}</div>
              <h3 className="font-heading font-semibold text-sm mb-1">{title}</h3>
              <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* CTA if not logged in */}
        {!user && (
          <div className="card text-center py-12 mb-10">
            <p className="text-white/50 text-sm mb-4">Log in to view and start your telemedicine sessions.</p>
            <Link to="/login" className="btn-primary px-6 py-2.5">Login to Continue</Link>
          </div>
        )}

        {/* Sessions List */}
        {user && (
          <div>
            <h2 className="text-xl font-heading font-semibold mb-5">
              {user.role === 'doctor' ? 'Your Upcoming Sessions' : 'My Video Sessions'}
            </h2>

            {error && <div className="alert-error mb-4">{error}</div>}

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-10 h-10 border-4 border-bg-surface2 border-t-primary rounded-full animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="card text-center py-16 flex flex-col items-center gap-3">
                <span className="text-5xl">📹</span>
                <h3 className="font-heading font-semibold">No sessions yet</h3>
                <p className="text-white/40 text-sm">Book an appointment to start a video consultation.</p>
                <Link to="/doctors" className="btn-primary text-sm px-5 py-2 mt-2">Find a Doctor</Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {sessions.map((s) => (
                  <div key={s._id} className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge ${statusColor[s.status] || 'badge-primary'} capitalize`}>
                          {s.status}
                        </span>
                        <span className="badge badge-primary capitalize">{s.type}</span>
                      </div>
                      <p className="text-sm font-semibold">Room: <span className="text-white/50 font-mono text-xs">{s.roomId}</span></p>
                      <p className="text-xs text-white/40 mt-1">
                        Scheduled: {new Date(s.scheduledAt).toLocaleString()}
                      </p>
                      {s.durationMinutes > 0 && (
                        <p className="text-xs text-white/40">Duration: {s.durationMinutes} min</p>
                      )}
                    </div>
                    {s.status === 'scheduled' || s.status === 'waiting' ? (
                      <button className="btn-primary text-sm px-5 py-2 whitespace-nowrap">📹 Join Call</button>
                    ) : s.status === 'active' ? (
                      <button className="btn-primary text-sm px-5 py-2 whitespace-nowrap animate-pulse">🔴 Live — Join Now</button>
                    ) : (
                      <span className="text-xs text-white/30">Session {s.status}</span>
                    )}
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
