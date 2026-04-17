const router = require('express').Router();
const appointmentController = require('../controllers/appointment.controller');

// GET /api/appointments
// Query params: patientId, doctorId, status
router.get('/', appointmentController.getAppointments);

// GET /api/appointments/:id
router.get('/:id', appointmentController.getAppointmentById);

// POST /api/appointments/book
// Prevents double-booking: same doctor + same date + same time slot
router.post('/book', appointmentController.bookAppointment);

// PATCH /api/appointments/:id/status
router.patch('/:id/status', appointmentController.updateAppointmentStatus);

// PUT /api/appointments/:id/status — alias for integrations
router.put('/:id/status', appointmentController.updateAppointmentStatus);

// PUT /api/appointments/:id — update full appointment
router.put('/:id', appointmentController.updateAppointment);

// DELETE /api/appointments/admin/:id — hard delete (for admin dashboard)
router.delete('/admin/:id', appointmentController.deleteAppointment);

// DELETE /api/appointments/:id — cancel appointment (soft delete)
router.delete('/:id', appointmentController.cancelAppointment);

module.exports = router;
