import { useState, useEffect } from 'react';
import axios from 'axios';

const SPECIALTIES = [
  'All', 'General Physician', 'Cardiologist', 'Dermatologist',
  'Neurologist', 'Orthopedist', 'Pediatrician', 'Psychiatrist',
  'Gynecologist', 'Ophthalmologist', 'ENT Specialist',
];

// Placeholder doctors for initial UI (replace with live API data)
const PLACEHOLDER_DOCTORS = [
  { _id: '1', name: 'Dr. Sarah Johnson',  specialty: 'Cardiologist',      experience: 12, consultationFee: 80,  rating: 4.9, isAvailable: true },
  { _id: '2', name: 'Dr. Ravi Kumar',     specialty: 'Neurologist',       experience: 9,  consultationFee: 70,  rating: 4.7, isAvailable: true },
  { _id: '3', name: 'Dr. Aisha Patel',    specialty: 'Dermatologist',     experience: 6,  consultationFee: 55,  rating: 4.8, isAvailable: false },
  { _id: '4', name: 'Dr. Emily Chen',     specialty: 'Pediatrician',      experience: 15, consultationFee: 65,  rating: 4.9, isAvailable: true },
  { _id: '5', name: 'Dr. Michael Brown',  specialty: 'General Physician', experience: 8,  consultationFee: 40,  rating: 4.6, isAvailable: true },
  { _id: '6', name: 'Dr. Priya Sharma',   specialty: 'Gynecologist',      experience: 11, consultationFee: 75,  rating: 4.8, isAvailable: true },
];

export default function Doctors() {
  const [doctors, setDoctors]       = useState(PLACEHOLDER_DOCTORS);
  const [specialty, setSpecialty]   = useState('All');
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const params = {};
        if (specialty !== 'All') params.specialty = specialty;
        if (search)              params.search     = search;
        const { data } = await axios.get('/api/doctors', { params });
        if (data.doctors?.length) setDoctors(data.doctors);
      } catch {
        // fallback to placeholder data
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, [specialty, search]);

  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <div className="section-tag mb-3">Find a Doctor</div>
          <h1 className="text-3xl font-heading font-bold mb-2">Browse Verified Doctors</h1>
          <p className="text-white/50 text-sm">Filter by specialty and book your appointment instantly.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <input
            type="text"
            placeholder="Search by doctor name..."
            className="form-input max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="form-input max-w-xs" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
            {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-bg-surface2 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {doctors.map((doc) => (
              <div key={doc._id} className="card flex flex-col gap-3">
                {/* Avatar placeholder */}
                <div className="w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center text-xl font-bold">
                  {doc.name.charAt(4)}
                </div>
                <div>
                  <h3 className="font-semibold font-heading">{doc.name}</h3>
                  <p className="text-sm text-white/50">{doc.specialty}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="badge badge-primary">{doc.experience} yrs exp</span>
                  <span className={`badge ${doc.isAvailable ? 'badge-green' : 'badge-red'}`}>
                    {doc.isAvailable ? '● Available' : '● Unavailable'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/[0.06]">
                  <span className="text-sm text-white/60">
                    ⭐ {doc.rating} &nbsp;·&nbsp; <span className="text-white font-semibold">${doc.consultationFee}</span>
                  </span>
                  <button className="btn-primary text-xs px-4 py-1.5" disabled={!doc.isAvailable}>
                    Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
