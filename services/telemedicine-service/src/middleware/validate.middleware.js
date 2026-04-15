function validateCreateSessionBody(req, res, next) {
  const appointmentId = String(req.body.appointmentId || '').trim();
  const doctorId = String(req.body.doctorId || '').trim();
  const patientId = String(req.body.patientId || '').trim();
  const scheduledAt = req.body.scheduledAt;

  if (!appointmentId) return res.status(400).json({ message: 'appointmentId is required' });
  if (!doctorId) return res.status(400).json({ message: 'doctorId is required' });
  if (!patientId) return res.status(400).json({ message: 'patientId is required' });
  if (!scheduledAt) return res.status(400).json({ message: 'scheduledAt is required' });

  const parsedDate = new Date(scheduledAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({ message: 'scheduledAt is invalid' });
  }

  next();
}

function validateSessionIdParam(req, res, next) {
  const sessionId = String(req.params.id || '').trim();
  if (!sessionId) return res.status(400).json({ message: 'Session id is required' });
  next();
}

function validateRoomIdParam(req, res, next) {
  const roomId = String(req.params.roomId || '').trim();
  if (!roomId) return res.status(400).json({ message: 'Room id is required' });
  next();
}

function validateStatusBody(req, res, next) {
  const status = String(req.body.status || '').trim();
  if (!status) return res.status(400).json({ message: 'status is required' });

  const allowed = ['scheduled', 'waiting', 'active', 'ended', 'missed'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: `status must be one of: ${allowed.join(', ')}` });
  }

  next();
}

function validateEndSessionBody(req, res, next) {
  const notes = req.body.notes;
  const prescription = req.body.prescription;

  if (notes !== undefined && typeof notes !== 'string') {
    return res.status(400).json({ message: 'notes must be a string when provided' });
  }

  if (prescription !== undefined && typeof prescription !== 'string') {
    return res.status(400).json({ message: 'prescription must be a string when provided' });
  }

  next();
}

module.exports = {
  validateCreateSessionBody,
  validateSessionIdParam,
  validateRoomIdParam,
  validateStatusBody,
  validateEndSessionBody,
};