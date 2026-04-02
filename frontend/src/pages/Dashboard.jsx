import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('emedicare_user');
    if (!stored) { navigate('/login'); return; }
    setUser(JSON.parse(stored));
  }, [navigate]);

  if (!user) return null;

  const quickLinks = [
    { icon: '🩺', label: 'Find a Doctor',  to: '/doctors',          color: 'bg-primary/10 border-primary/20' },
    { icon: '📅', label: 'My Appointments', to: '/appointments',     color: 'bg-emerald-500/10 border-emerald-500/20' },
    { icon: '🤖', label: 'AI Symptom Check',to: '/symptom-checker',  color: 'bg-purple-500/10 border-purple-500/20' },
  ];

  return (
    <main className="pt-[72px] min-h-screen bg-bg">
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
          </div>
          <div className="card flex flex-col items-center justify-center text-center gap-3">
            <span className="text-4xl">📋</span>
            <p className="text-sm text-white/50">Your medical records and prescriptions will appear here.</p>
            <Link to="/appointments" className="btn-primary text-sm px-5 py-2">View Appointments</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
