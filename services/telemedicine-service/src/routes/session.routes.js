const router = require('express').Router();
const {
  createSession,
  createSessionFromAppointment,
  listSessions,
  getSessionById,
  getSessionByRoom,
  markWaiting,
  startSession,
  getJoinInfo,
  endSession,
} = require('../controllers/session.controller');
const {
  validateCreateSessionBody,
  validateSessionIdParam,
  validateRoomIdParam,
  validateEndSessionBody,
} = require('../middleware/validate.middleware');

// Session CRUD and lifecycle endpoints.
router.post('/sessions', validateCreateSessionBody, createSession);
router.get('/sessions', listSessions);
router.get('/sessions/:id', validateSessionIdParam, getSessionById);
router.get('/sessions/room/:roomId', validateRoomIdParam, getSessionByRoom);

// Appointment-driven session creation endpoint.
router.post('/appointments/:appointmentId/session', createSessionFromAppointment);

// Session state transition endpoints.
router.patch('/sessions/:id/waiting', validateSessionIdParam, markWaiting);
router.patch('/sessions/:id/start', validateSessionIdParam, startSession);
router.get('/sessions/:id/join', validateSessionIdParam, getJoinInfo);
router.patch('/sessions/:id/end', validateSessionIdParam, validateEndSessionBody, endSession);

module.exports = router;
