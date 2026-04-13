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

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/register', { ...form, role: 'patient' });
      localStorage.setItem('emedicare_token', data.token);
      localStorage.setItem('emedicare_user', JSON.stringify(data.user));

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
    <main className="min-h-screen bg-gradient-hero flex items-center justify-center px-4">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-up">
        <div className="glass rounded-2xl p-8">
          <Link to="/" className="inline-flex mb-6 text-sm text-primary hover:underline font-medium">
            Back to Home
          </Link>

          <div className="text-center mb-8">
            <span className="text-4xl">⚕</span>
            <h1 className="text-2xl font-heading font-bold mt-2">Create your account</h1>
            <p className="text-white/50 text-sm mt-1">Join eMediCare and take control of your health</p>
          </div>

          {error && <div className="alert-error mb-5">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="form-label">Full Name</label>
              <input id="reg-name" type="text" name="name" placeholder="John Doe"
                className="form-input" value={form.name} onChange={handleChange} required />
            </div>

            <div>
              <label className="form-label">Email address</label>
              <input id="reg-email" type="email" name="email" placeholder="you@example.com"
                className="form-input" value={form.email} onChange={handleChange} required />
            </div>

            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <input id="reg-password" type={showPassword ? 'text' : 'password'} name="password" placeholder="Min. 6 characters"
                  className="form-input pr-20" value={form.password} onChange={handleChange} required minLength={6} />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/60 hover:text-white transition-colors"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <p className="text-xs text-white/45">New accounts are registered as patient users.</p>

            <button id="reg-submit" type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-white/40 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
