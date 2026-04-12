const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');

// 1. Search doctors by specialty
router.get('/doctors', (req, res) => {
    const { specialty } = req.query;
    const doctors = [
        { id: 'doc1', name: 'Dr. Perera', specialty: 'cardiology' },
        { id: 'doc2', name: 'Dr. Silva', specialty: 'neurology' },
        { id: 'doc3', name: 'Dr. Fernando', specialty: 'cardiology' },
    ];
    const filtered = specialty
        ? doctors.filter(d => d.specialty === specialty)
        : doctors;
    res.json(filtered);
});

// 2. Book appointment
router.post('/appointments/book', async (req, res) => {
    try {
        const { patientId, doctorId, specialty, date, timeSlot } = req.body;
        const existing = await Appointment.findOne({ doctorId, date, timeSlot });
        if (existing) {
            return res.status(409).json({ message: 'This slot is already booked!' });
        }
        const appointment = new Appointment({ patientId, doctorId, specialty, date, timeSlot });
        await appointment.save();
        res.status(201).json(appointment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// Get all appointments for a patient
router.get('/appointments', async (req, res) => {
    try {
        const { patientId } = req.query;
        const appointments = await Appointment.find(patientId ? { patientId } : {});
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// 3. Get appointment by ID
router.get('/appointments/:id', async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return res.status(404).json({ message: 'Not found' });
        res.json(appointment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 4. Update appointment
router.put('/appointments/:id', async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!appointment) return res.status(404).json({ message: 'Not found' });
        res.json(appointment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 5. Cancel appointment
router.delete('/appointments/:id', async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status: 'cancelled' },
            { new: true }
        );
        if (!appointment) return res.status(404).json({ message: 'Not found' });
        res.json({ message: 'Appointment cancelled', appointment });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;