const Session = require('../models/session.model');

function buildJoinUrl(roomId) {
  return `https://meet.jit.si/eMediCare-${roomId}`;
}

function serializeSession(sessionDoc) {
  const session = sessionDoc.toObject ? sessionDoc.toObject() : sessionDoc;
  return {
    ...session,
    joinUrl: buildJoinUrl(session.roomId),
    embedUrl: `https://meet.jit.si/${encodeURIComponent(`eMediCare-${session.roomId}`)}`,
  };
}

function sendBadRequest(res, message) {
  return res.status(400).json({ message });
}

async function createSession(req, res) {
  try {
    const appointmentId = String(req.body.appointmentId || '').trim();
    const doctorId = String(req.body.doctorId || '').trim();
    const patientId = String(req.body.patientId || '').trim();
    const scheduledAtRaw = req.body.scheduledAt;
    const type = req.body.type === 'audio' ? 'audio' : 'video';
    const roomPrefix = String(req.body.roomPrefix || 'eMediCare').trim() || 'eMediCare';

    if (!appointmentId) return sendBadRequest(res, 'appointmentId is required');
    if (!doctorId) return sendBadRequest(res, 'doctorId is required');
    if (!patientId) return sendBadRequest(res, 'patientId is required');
    if (!scheduledAtRaw) return sendBadRequest(res, 'scheduledAt is required');

    const scheduledAt = new Date(scheduledAtRaw);
    if (Number.isNaN(scheduledAt.getTime())) {
      return sendBadRequest(res, 'scheduledAt is invalid');
    }

    const existing = await Session.findOne({ appointmentId });
    if (existing) {
      return res.status(200).json({
        message: 'Telemedicine session already exists for this appointment',
        session: serializeSession(existing),
      });
    }

    const roomId = `${roomPrefix}-${Date.now()}-${appointmentId.slice(-6)}`;
    const session = await Session.create({
      appointmentId,
      doctorId,
      patientId,
      roomId,
      scheduledAt,
      type,
      status: 'scheduled',
    });

    return res.status(201).json({
      message: 'Telemedicine session created',
      session: serializeSession(session),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create session', error: err.message });
  }
}

async function createSessionFromAppointment(req, res) {
  try {
    const appointmentId = String(req.params.appointmentId || '').trim();
    const doctorId = String(req.body.doctorId || '').trim();
    const patientId = String(req.body.patientId || '').trim();
    const scheduledAtRaw = req.body.scheduledAt;
    const type = req.body.type === 'audio' ? 'audio' : 'video';

    if (!appointmentId) return sendBadRequest(res, 'appointmentId is required');
    if (!doctorId) return sendBadRequest(res, 'doctorId is required');
    if (!patientId) return sendBadRequest(res, 'patientId is required');
    if (!scheduledAtRaw) return sendBadRequest(res, 'scheduledAt is required');

    const scheduledAt = new Date(scheduledAtRaw);
    if (Number.isNaN(scheduledAt.getTime())) {
      return sendBadRequest(res, 'scheduledAt is invalid');
    }

    const existing = await Session.findOne({ appointmentId });
    if (existing) {
      return res.status(200).json({
        message: 'Telemedicine session already exists for this appointment',
        session: serializeSession(existing),
      });
    }

    const roomId = `eMediCare-${Date.now()}-${appointmentId.slice(-6)}`;
    const session = await Session.create({
      appointmentId,
      doctorId,
      patientId,
      roomId,
      scheduledAt,
      type,
      status: 'scheduled',
    });

    return res.status(201).json({
      message: 'Telemedicine session created from appointment',
      session: serializeSession(session),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create session', error: err.message });
  }
}

async function listSessions(req, res) {
  try {
    const filter = {};
    if (req.query.doctorId) filter.doctorId = String(req.query.doctorId).trim();
    if (req.query.patientId) filter.patientId = String(req.query.patientId).trim();
    if (req.query.status) filter.status = String(req.query.status).trim();
    if (req.query.appointmentId) filter.appointmentId = String(req.query.appointmentId).trim();

    const sessions = await Session.find(filter).sort({ scheduledAt: -1, createdAt: -1 });

    return res.json({
      count: sessions.length,
      sessions: sessions.map(serializeSession),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch sessions', error: err.message });
  }
}

async function getSessionById(req, res) {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    return res.json({ session: serializeSession(session) });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch session', error: err.message });
  }
}

async function getSessionByRoom(req, res) {
  try {
    const roomId = String(req.params.roomId || '').trim();
    const session = await Session.findOne({ roomId });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    return res.json({ session: serializeSession(session) });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch session by room', error: err.message });
  }
}

async function markWaiting(req, res) {
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { status: 'waiting' },
      { new: true }
    );
    if (!session) return res.status(404).json({ message: 'Session not found' });

    return res.json({ message: 'Session moved to waiting', session: serializeSession(session) });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update status', error: err.message });
  }
}

async function startSession(req, res) {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    session.status = 'active';
    if (!session.startedAt) session.startedAt = new Date();
    await session.save();

    return res.json({ message: 'Session started', session: serializeSession(session) });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to start session', error: err.message });
  }
}

async function getJoinInfo(req, res) {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    return res.json({
      message: 'Join details loaded',
      session: serializeSession(session),
      joinUrl: buildJoinUrl(session.roomId),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load join info', error: err.message });
  }
}

async function endSession(req, res) {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const endedAt = new Date();
    const durationMinutes = session.startedAt
      ? Math.max(0, Math.round((endedAt.getTime() - session.startedAt.getTime()) / 60000))
      : 0;

    session.status = 'ended';
    session.endedAt = endedAt;
    session.durationMinutes = durationMinutes;

    if (typeof req.body.notes === 'string') session.notes = req.body.notes.trim();
    if (typeof req.body.prescription === 'string') session.prescription = req.body.prescription.trim();

    await session.save();

    return res.json({ message: 'Session ended', session: serializeSession(session) });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to end session', error: err.message });
  }
}

module.exports = {
  buildJoinUrl,
  serializeSession,
  createSession,
  createSessionFromAppointment,
  listSessions,
  getSessionById,
  getSessionByRoom,
  markWaiting,
  startSession,
  getJoinInfo,
  endSession,
};