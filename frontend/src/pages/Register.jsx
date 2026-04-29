import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { createPatient } from '../services/api';

export default function Register() {
  const [form, setForm]     = useState({ name: '', email: '', password: '', role: 'patient' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Keep form state in sync with input fields.
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Register auth user first, then create patient profile in patient-service.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/register', { ...form, role: 'patient' });
      localStorage.setItem('emedicare_token', data.token);
      localStorage.setItem('emedicare_user', JSON.stringify(data.user));

      // Auto-create patient profile for patient role accounts.
      if (data.user?.role === 'patient') {
        try {
          await createPatient({
            userId: data.user.id,
            name: data.user.name,
            email: data.user.email,
          });
        } catch (profileErr) {
          // Ignore conflict to support retries and existing profiles.
          if (profileErr.response?.status !== 409) {
            throw profileErr;
          }
        }
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="h-screen bg-[#F8FAFC] flex items-center justify-center px-4 overflow-hidden relative">
      {/* Aesthetic Background Elements */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#0A192F]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-[#0A192F]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-up">
        {/* Back Link */}
        <Link to="/" className="inline-flex items-center gap-2 mb-6 text-sm text-[#0A192F]/60 hover:text-[#0A192F] font-bold transition-colors">
          ← Back to Home
        </Link>

        <div className="bg-white/70 backdrop-blur-2xl border border-white rounded-[2.5rem] p-10 shadow-2xl shadow-[#0A192F]/10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-heading font-extrabold text-[#0A192F]">Create account</h1>
            <p className="text-[#64748B] text-sm mt-2 font-medium">Join eMediCare for smarter healthcare</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-[#0A192F] uppercase tracking-wider mb-2 ml-1">Full Name</label>
              <input
                id="reg-name"
                type="text"
                name="name"
                placeholder="John Doe"
                className="w-full px-5 py-3.5 bg-white/50 border border-[#D9E2EC] rounded-2xl text-sm text-[#0A192F] placeholder-[#94A3B8] focus:outline-none focus:border-[#0A192F] focus:ring-4 focus:ring-[#0A192F]/5 transition-all"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0A192F] uppercase tracking-wider mb-2 ml-1">Email Address</label>
              <input
                id="reg-email"
                type="email"
                name="email"
                placeholder="you@example.com"
                className="w-full px-5 py-3.5 bg-white/50 border border-[#D9E2EC] rounded-2xl text-sm text-[#0A192F] placeholder-[#94A3B8] focus:outline-none focus:border-[#0A192F] focus:ring-4 focus:ring-[#0A192F]/5 transition-all"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0A192F] uppercase tracking-wider mb-2 ml-1">Password</label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Min. 6 characters"
                  className="w-full px-5 py-3.5 bg-white/50 border border-[#D9E2EC] rounded-2xl text-sm text-[#0A192F] placeholder-[#94A3B8] focus:outline-none focus:border-[#0A192F] focus:ring-4 focus:ring-[#0A192F]/5 transition-all pr-20"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#64748B] hover:text-[#0A192F] uppercase tracking-widest transition-colors"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              id="reg-submit"
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 bg-[#0A192F] text-white font-bold rounded-2xl shadow-xl shadow-[#0A192F]/20 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Setting up account...' : 'Create Free Account'}
            </button>
          </form>

          <p className="text-center text-sm text-[#64748B] mt-8 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-[#0A192F] hover:underline font-bold">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
