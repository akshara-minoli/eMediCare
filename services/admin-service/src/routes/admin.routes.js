const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const adminAuth = require('../middleware/adminAuth.middleware');

// Secure all admin endpoints with JWT + role check.
router.use(adminAuth);

// Dashboard
router.get('/overview', adminController.getOverview);

// Doctors
router.get('/doctors', adminController.getDoctors);
router.get('/doctors/pending', adminController.getPendingDoctors);
router.put('/doctors/:id/status', adminController.updateDoctorStatus);
router.put('/doctors/:id', adminController.updateDoctor);
router.delete('/doctors/:id', adminController.deleteDoctor);
router.patch('/doctors/:id/block', adminController.blockDoctor);
router.post('/create-doctor', adminController.createDoctor);
router.post('/doctors', adminController.createDoctor);

// Patients
router.get('/patients', adminController.getPatients);
router.put('/patients/:userId', adminController.updatePatient);
router.patch('/patients/:userId/block', adminController.blockPatient);
router.delete('/patients/:userId', adminController.deletePatient);

// Monitoring
router.get('/appointments', adminController.getAppointments);
router.put('/appointments/:id', adminController.updateAppointment);
router.delete('/appointments/:id', adminController.deleteAppointment);
router.get('/payments', adminController.getPayments);
router.put('/payments/:id', adminController.updatePayment);
router.delete('/payments/:id', adminController.deletePayment);

module.exports = router;
