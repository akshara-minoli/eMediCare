const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user.model');
const LegacyUser = require('../models/legacy-user.model');

function requireAdmin(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'Admin access only' });

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// ── POST /api/auth/register ───────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedRole = role || 'patient';
    const fallbackName = normalizedEmail ? normalizedEmail.split('@')[0] : 'doctor';
    const resolvedName = name || (normalizedRole === 'doctor' ? fallbackName : 'Patient User');

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    if (normalizedRole !== 'doctor' && !name) {
      return res.status(400).json({ message: 'name is required for patient registration' });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name: resolvedName, email: normalizedEmail, password: hashed, role: normalizedRole });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registered successfully',
      userId: user._id,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── POST /api/auth/users (admin-only user provisioning) ─────
router.post('/users', requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!name || !normalizedEmail || !password || !role) {
      return res.status(400).json({ message: 'name, email, password and role are required' });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email: normalizedEmail, password: hashed, role });

    res.status(201).json({
      message: 'User created',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── DELETE /api/auth/users/:id (admin-only rollback) ────────
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /api/auth/users/by-email?email=... (admin-only lookup) ─
router.get('/users/by-email', requireAdmin, async (req, res) => {
  try {
    const normalizedEmail = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : '';
    if (!normalizedEmail) {
      return res.status(400).json({ message: 'email is required' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';

    if (!normalizedEmail || !password) {
      console.warn(`[Auth] Failed login: reason=missing_credentials email=${normalizedEmail || 'unknown'} ip=${clientIp}`);
      return res.status(400).json({ message: 'Email and password are required' });
    }

    let user = await User.findOne({ email: normalizedEmail });
    let isMatch = user ? await bcrypt.compare(password, user.password) : false;

    // Fall back to legacy users collection so older doctor/patient accounts still work.
    if (!isMatch) {
      const legacyUser = await LegacyUser.findOne({ email: normalizedEmail });
      if (legacyUser && await bcrypt.compare(password, legacyUser.password)) {
        isMatch = true;

        user = await User.findOneAndUpdate(
          { email: normalizedEmail },
          {
            $set: {
              name: legacyUser.name,
              email: legacyUser.email,
              password: legacyUser.password,
              role: legacyUser.role,
              avatar: legacyUser.avatar || '',
              isVerified: Boolean(legacyUser.isVerified),
            },
          },
          { upsert: true, new: true, runValidators: true }
        );

        console.info(`[Auth] Legacy login synced for email=${normalizedEmail} ip=${clientIp}`);
      }
    }

    if (!user) {
      console.warn(`[Auth] Failed login: reason=user_not_found email=${normalizedEmail} ip=${clientIp}`);
      return res.status(404).json({ message: 'User not found' });
    }

    if (!isMatch) {
      console.warn(`[Auth] Failed login: reason=invalid_password email=${normalizedEmail} ip=${clientIp}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    console.info(`[Auth] Login successful: user=${user._id} role=${user.role} email=${user.email} ip=${clientIp}`);
    res.json({ message: 'Login successful', token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── POST /api/auth/forgot-password ───────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const normalizedEmail = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!normalizedEmail) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: normalizedEmail }).select('+resetPasswordToken +resetPasswordExpires');
    if (!user) {
      return res.json({ message: 'If an account exists for that email, a reset link has been generated.' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 30);
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

    console.info(`[Auth] Password reset link generated for ${normalizedEmail}: ${resetUrl}`);

    if ((process.env.NODE_ENV || '').toLowerCase() !== 'production') {
      return res.json({
        message: 'Password reset link generated.',
        resetUrl,
      });
    }

    return res.json({ message: 'If an account exists for that email, a reset link has been generated.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── POST /api/auth/reset-password ────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'token and password are required' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const hashedToken = crypto.createHash('sha256').update(String(token)).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = '';
    user.resetPasswordExpires = null;
    await user.save();

    return res.json({ message: 'Password reset successful. Please login with your new password.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.id).select('-password');

    res.json({ user });
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
});

module.exports = router;
