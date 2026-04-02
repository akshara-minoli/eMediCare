const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const Session = require('../models/session.model');

// ── POST /api/telemedicine/sessions — Create session ─────────
router.post('/sessions', async (req, res) => {
  try {
    const { appointmentId, doctorId, patientId, scheduledAt, type } = req.body;

    // Generate a unique room ID for WebRTC
    const roomId = `room-${uuidv4()}`;

    const session = await Session.create({
      appointmentId,
      doctorId,
      patientId,
      roomId,
      scheduledAt,
      type: type || 'video',
    });

    res.status(201).json({
      message: 'Telemedicine session created',
      session,
      joinUrl: `/telemedicine/join/${roomId}`,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create session', error: err.message });
  }
});

// ── GET /api/telemedicine/sessions/:id — Get session ─────────
router.get('/sessions/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json({ session });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /api/telemedicine/sessions/room/:roomId — Get by room
router.get('/sessions/room/:roomId', async (req, res) => {
  try {
    const session = await Session.findOne({ roomId: req.params.roomId });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json({ session });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /api/telemedicine/sessions?doctorId=&patientId= ──────
router.get('/sessions', async (req, res) => {
  try {
    const { doctorId, patientId, status } = req.query;
    const filter = {};
    if (doctorId)  filter.doctorId  = doctorId;
    if (patientId) filter.patientId = patientId;
    if (status)    filter.status    = status;

    const sessions = await Session.find(filter).sort({ scheduledAt: -1 });
    res.json({ count: sessions.length, sessions });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── PATCH /api/telemedicine/sessions/:id/start — Start call ──
router.patch('/sessions/:id/start', async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { status: 'active', startedAt: new Date() },
      { new: true }
    );
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json({ message: 'Session started', session });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── PATCH /api/telemedicine/sessions/:id/end — End call ──────
router.patch('/sessions/:id/end', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const endedAt = new Date();
    const durationMinutes = session.startedAt
      ? Math.round((endedAt - session.startedAt) / 60000)
      : 0;

    const updated = await Session.findByIdAndUpdate(
      req.params.id,
      {
        status: 'ended',
        endedAt,
        durationMinutes,
        notes:        req.body.notes        || session.notes,
        prescription: req.body.prescription || session.prescription,
      },
      { new: true }
    );

    res.json({ message: 'Session ended', session: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
