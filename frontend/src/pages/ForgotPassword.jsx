import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetUrl, setResetUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setResetUrl('');
    setLoading(true);

    try {
      const { data } = await axios.post('/api/auth/forgot-password', { email });
      setSuccess(data?.message || 'Password reset request processed.');
      if (data?.resetUrl) setResetUrl(data.resetUrl);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process request');
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
            <span className="text-4xl">🔐</span>
            <h1 className="text-2xl font-heading font-bold mt-2">Forgot Password</h1>
            <p className="text-white/50 text-sm mt-1">Enter your account email to generate a reset link.</p>
          </div>

          {error && <div className="alert-error mb-5">{error}</div>}
          {success && (
            <div className="border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 rounded-xl px-4 py-3 text-sm mb-5">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="form-label">Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Send Reset Link'}
            </button>
          </form>

          {resetUrl && (
            <div className="mt-5 text-sm">
              <p className="text-white/60 mb-1">Reset link (dev):</p>
              <a href={resetUrl} className="text-primary underline break-all" target="_blank" rel="noreferrer">{resetUrl}</a>
            </div>
          )}

          <p className="text-center text-sm text-white/40 mt-6">
            Remember your password?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">Back to login</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
