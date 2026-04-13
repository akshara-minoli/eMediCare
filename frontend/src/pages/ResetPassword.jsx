import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Reset token is missing. Use the reset link from forgot password.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/reset-password', {
        token,
        password: form.password,
      });
      setSuccess(data?.message || 'Password updated successfully');
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-hero flex items-center justify-center px-4">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-up">
        <div className="glass rounded-2xl p-8">
          <div className="text-center mb-8">
            <span className="text-4xl">🔑</span>
            <h1 className="text-2xl font-heading font-bold mt-2">Reset Password</h1>
            <p className="text-white/50 text-sm mt-1">Set your new account password.</p>
          </div>

          {error && <div className="alert-error mb-5">{error}</div>}
          {success && (
            <div className="border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 rounded-xl px-4 py-3 text-sm mb-5">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="form-label">New password</label>
              <input
                type="password"
                className="form-input"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="form-label">Confirm new password</label>
              <input
                type="password"
                className="form-input"
                value={form.confirmPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Reset Password'}
            </button>
          </form>

          <p className="text-center text-sm text-white/40 mt-6">
            <Link to="/login" className="text-primary hover:underline font-medium">Back to login</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
