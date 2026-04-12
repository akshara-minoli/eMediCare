import { useState, useEffect } from 'react';
import { getAppointments, cancelAppt } from '../services/api';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data } = await getAppointments();
      setAppointments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await cancelAppt(id);
      fetchAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'confirmed') return 'badge-green';
    if (status === 'cancelled') return 'badge-red';
    return 'badge-primary';
  };

  return (
    <main className="pt-[72px] min-h-screen bg-bg">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="section-tag mb-3">My Schedule</div>
        <h1 className="text-3xl font-heading font-bold mb-2">Appointments</h1>
        <p className="text-white/50 text-sm mb-10">View and manage your upcoming and past appointments.</p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-bg-surface2 border-t-primary rounded-full animate-spin" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <span className="text-6xl">📅</span>
            <h2 className="text-xl font-heading font-semibold">No appointments yet</h2>
            <p className="text-white/40 text-sm">Book your first appointment with a doctor to get started.</p>
            <a href="/doctors" className="btn-primary px-6 py-2.5 text-sm">Find a Doctor</a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {appointments.map((appt) => (
              <div key={appt._id} className="card flex flex-col gap-3">
                <div>
                  <h3 className="font-semibold font-heading">{appt.doctorId}</h3>
                  <p className="text-sm text-white/50">{appt.specialty}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="badge badge-primary">📅 {appt.date}</span>
                  <span className="badge badge-primary">🕐 {appt.timeSlot}</span>
                </div>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/[0.06]">
                  <span className={`badge ${getStatusColor(appt.status)}`}>
                    {appt.status}
                  </span>
                  {appt.status !== 'cancelled' && (
                    <button
                      onClick={() => handleCancel(appt._id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}