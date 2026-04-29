import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/login', form);
      localStorage.setItem('emedicare_token', data.token);
      localStorage.setItem('emedicare_user', JSON.stringify(data.user));

      const role = data?.user?.role;
      if (role === 'admin') {
        navigate('/admin-dashboard');
      } else if (role === 'doctor') {
        navigate('/doctor-dashboard');
      } else {
        navigate('/patient-dashboard');
      }
    } catch (err) {
      const status = err.response?.status;
      const serverMessage = err.response?.data?.message;
      console.error('Login failed', {
        status,
        message: serverMessage || err.message,
        email: form.email,
      });

      if (status === 502) {
        setError('Auth service is unavailable right now. Please try again in a moment.');
      } else {
        setError(serverMessage || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="h-screen bg-[#F8FAFC] flex items-center justify-center px-4 overflow-hidden relative">
      {/* Background purely aesthetic glow */}
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
            <h1 className="text-3xl font-heading font-extrabold text-[#0A192F]">Welcome back</h1>
            <p className="text-[#64748B] text-sm mt-2 font-medium">Log in to your eMediCare account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-[#0A192F] uppercase tracking-wider mb-2 ml-1">Email Address</label>
              <input
                id="login-email"
                type="email"
                name="email"
                placeholder="you@example.com"
                className="w-full px-5 py-4 bg-white/50 border border-[#D9E2EC] rounded-2xl text-sm text-[#0A192F] placeholder-[#94A3B8] focus:outline-none focus:border-[#0A192F] focus:ring-4 focus:ring-[#0A192F]/5 transition-all"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 ml-1">
                <label className="block text-[11px] font-bold text-[#0A192F] uppercase tracking-wider">Password</label>
                <Link to="/forgot-password" className="text-[11px] font-bold text-[#0A192F] hover:underline">Forgot?</Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  className="w-full px-5 py-4 bg-white/50 border border-[#D9E2EC] rounded-2xl text-sm text-[#0A192F] placeholder-[#94A3B8] focus:outline-none focus:border-[#0A192F] focus:ring-4 focus:ring-[#0A192F]/5 transition-all pr-20"
                  value={form.password}
                  onChange={handleChange}
                  required
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
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#0A192F] text-white font-bold rounded-2xl shadow-xl shadow-[#0A192F]/20 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Please wait...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-[#64748B] mt-8 font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#0A192F] hover:underline font-bold">Register here</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
