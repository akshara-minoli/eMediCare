import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAppointments, getDoctors } from '../services/api';

export default function Appointments() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [doctorMap, setDoctorMap] = useState({});

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const rawUser = localStorage.getItem('emedicare_user');
        if (!rawUser) {
          navigate('/login');
          return;
        }

        const user = JSON.parse(rawUser);
        if (!user?.id) {
          navigate('/login');
          return;
        }

        const [appointmentsRes, doctorsRes] = await Promise.all([
          getAppointments({ patientId: user.id }),
          getDoctors(),
        ]);

        const doctorLookup = Object.fromEntries(
          (doctorsRes.data?.doctors || []).map((doctor) => [doctor._id, doctor.name])
        );

        setDoctorMap(doctorLookup);
        setAppointments(appointmentsRes.data?.appointments || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const sortedAppointments = useMemo(
    () => [...appointments].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [appointments]
  );

  const statusClass = (status) => {
    if (status === 'confirmed') return 'text-emerald-300';
    if (status === 'cancelled' || status === 'rejected') return 'text-red-300';
    if (status === 'completed') return 'text-sky-300';
    return 'text-amber-300';
  };

  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="section-tag mb-3">My Schedule</div>
        <h1 className="text-3xl font-heading font-bold mb-2">Appointments</h1>
        <p className="text-white/50 text-sm mb-10">Accepted and cancelled updates from doctors are shown here automatically.</p>

        {error && <div className="alert-error mb-6">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-bg-surface2 border-t-primary rounded-full animate-spin" />
          </div>
        ) : sortedAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <span className="text-6xl">📅</span>
            <h2 className="text-xl font-heading font-semibold">No appointments yet</h2>
            <p className="text-white/40 text-sm">Book your first appointment with a doctor to get started.</p>
            <Link to="/doctors" className="btn-primary px-6 py-2.5 text-sm">Find a Doctor</Link>
          </div>
        ) : (
          <section className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-white/60 border-b border-white/10">
                  <tr>
                    <th className="text-left py-2 pr-3">Appointment ID</th>
                    <th className="text-left py-2 pr-3">Doctor</th>
                    <th className="text-left py-2 pr-3">Date/Time</th>
                    <th className="text-left py-2 pr-3">Type</th>
                    <th className="text-left py-2 pr-3">Notes</th>
                    <th className="text-left py-2 pr-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAppointments.map((item) => (
                    <tr key={item._id} className="border-b border-white/5">
                      <td className="py-2 pr-3">{item._id}</td>
                      <td className="py-2 pr-3">{doctorMap[item.doctorId] || item.doctorId}</td>
                      <td className="py-2 pr-3">{new Date(item.date).toLocaleDateString()} {item.time}</td>
                      <td className="py-2 pr-3 capitalize">{item.type || 'in-person'}</td>
                      <td className="py-2 pr-3">{item.notes || '-'}</td>
                      <td className={`py-2 pr-3 capitalize font-medium ${statusClass(item.status)}`}>{item.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
