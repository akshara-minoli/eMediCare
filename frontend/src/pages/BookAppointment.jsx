import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { bookAppointment } from '../services/api';

const TIME_SLOTS = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
];

export default function BookAppointment() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const doctorId = searchParams.get('doctorId');
    const specialty = searchParams.get('specialty');

    const [date, setDate] = useState('');
    const [timeSlot, setTimeSlot] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleBook = async () => {
        if (!date || !timeSlot) {
            setError('Please select a date and time slot!');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await bookAppointment({
                patientId: 'patient_001',
                doctorId,
                specialty,
                date,
                timeSlot,
            });
            navigate('/appointments');
        } catch (err) {
            if (err.response?.status === 409) {
                setError('This slot is already booked! Please pick another.');
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="pt-[72px] min-h-screen bg-bg">
            <div className="max-w-xl mx-auto px-6 py-12">
                <div className="section-tag mb-3">Book Appointment</div>
                <h1 className="text-3xl font-heading font-bold mb-2">Select Date & Time</h1>
                <p className="text-white/50 text-sm mb-10">
                    Specialty: <span className="text-white">{specialty}</span>
                </p>

                <div className="card flex flex-col gap-6">

                    {/* Date picker */}
                    <div>
                        <label className="text-sm text-white/60 mb-2 block">Select Date</label>
                        <input
                            type="date"
                            className="form-input w-full"
                            value={date}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    {/* Time slots */}
                    <div>
                        <label className="text-sm text-white/60 mb-2 block">Select Time Slot</label>
                        <div className="grid grid-cols-3 gap-2">
                            {TIME_SLOTS.map((slot) => (
                                <button
                                    key={slot}
                                    onClick={() => setTimeSlot(slot)}
                                    className={`text-xs py-2 px-3 rounded-lg border transition-all ${timeSlot === slot
                                            ? 'border-primary bg-primary/20 text-white'
                                            : 'border-white/10 text-white/50 hover:border-white/30'
                                        }`}
                                >
                                    {slot}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-red-400 text-sm">{error}</p>
                    )}

                    {/* Confirm button */}
                    <button
                        onClick={handleBook}
                        disabled={loading}
                        className="btn-primary w-full py-3"
                    >
                        {loading ? 'Booking...' : 'Confirm Appointment'}
                    </button>

                    <button
                        onClick={() => navigate('/doctors')}
                        className="text-sm text-white/40 hover:text-white/60 text-center"
                    >
                        ← Back to Doctors
                    </button>

                </div>
            </div>
        </main>
    );
}