import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getDoctorById, getDoctorAvailability, bookAppointment } from '../services/api';

export default function BookAppointment() {
  const { doctorId } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form State
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('in-person');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docRes, availRes] = await Promise.all([
          getDoctorById(doctorId),
          getDoctorAvailability(doctorId)
        ]);
        setDoctor(docRes.data?.doctor);
        setAvailability(availRes.data?.availability || []);
      } catch (err) {
        setError('Failed to load doctor details or availability.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [doctorId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) {
      setError('Please select both a date and a time slot.');
      return;
    }

    const user = JSON.parse(localStorage.getItem('emedicare_user'));
    if (!user) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await bookAppointment({
        patientId: user.id,
        doctorId,
        date: selectedDate,
        time: selectedTime,
        type: appointmentType,
        notes
      });
      setSuccess(true);
      setTimeout(() => navigate('/appointments'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-bg-surface2 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-bg py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link to="/doctors" className="btn-outline text-sm mb-6 inline-flex">← Back to Doctors</Link>
        
        <div className="card">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-2xl font-bold">
              {doctor?.name?.charAt(4) || 'D'}
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading">{doctor?.name}</h1>
              <p className="text-white/50">{doctor?.specialty} • ${doctor?.consultationFee} Fee</p>
            </div>
          </div>

          {success ? (
            <div className="alert-success flex flex-col items-center py-8 text-center">
              <span className="text-4xl mb-2">✅</span>
              <h2 className="text-xl font-bold">Booking Confirmed!</h2>
              <p>Redirecting you to your appointments...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <div className="alert-error">{error}</div>}

              {/* Date Selection */}
              <div>
                <label className="form-label">Available Dates</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availability.length > 0 ? (
                    availability.map((avail) => (
                      <button
                        key={avail._id}
                        type="button"
                        onClick={() => {
                          setSelectedDate(avail.date);
                          setSelectedTime(''); // Reset time when date changes
                        }}
                        className={`p-3 rounded-xl border text-sm transition-all ${
                          selectedDate === avail.date 
                          ? 'border-primary bg-primary/10 text-primary font-bold' 
                          : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30'
                        }`}
                      >
                        {new Date(avail.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </button>
                    ))
                  ) : (
                    <p className="text-white/40 text-sm col-span-full">No availability schedule found for this doctor.</p>
                  )}
                </div>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                  <label className="form-label">Select Time Slot</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availability.find(a => a.date === selectedDate)?.timeSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={`p-2 rounded-lg border text-xs transition-all ${
                          selectedTime === slot 
                          ? 'border-primary bg-primary text-white font-bold' 
                          : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Type and Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Consultation Type</label>
                  <select 
                    className="form-input" 
                    value={appointmentType}
                    onChange={(e) => setAppointmentType(e.target.value)}
                  >
                    <option value="in-person">In-Person</option>
                    <option value="video">Video Call</option>
                    <option value="phone">Phone Call</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Additional Notes</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="E.g. Reason for visit"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-primary w-full py-3 mt-4"
                disabled={submitting || !selectedTime}
              >
                {submitting ? 'Confirming...' : 'Confirm Appointment'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
