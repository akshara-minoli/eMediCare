const router = require('express').Router();
const Payment = require('../models/payment.model');

// ── POST /api/payments/pay ────────────────────────────────────
router.post('/pay', async (req, res) => {
  try {
    const { patientId, appointmentId, amount, method } = req.body;

    // Simulate payment processing (replace with Stripe/Razorpay SDK)
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const payment = await Payment.create({
      patientId,
      appointmentId,
      amount,
      method: method || 'card',
      transactionId,
      status: 'success',
    });

    res.status(201).json({ message: 'Payment successful', payment });
  } catch (err) {
    res.status(500).json({ message: 'Payment failed', error: err.message });
  }
});

// ── GET /api/payments/:patientId ──────────────────────────────
router.get('/:patientId', async (req, res) => {
  try {
    const payments = await Payment.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
