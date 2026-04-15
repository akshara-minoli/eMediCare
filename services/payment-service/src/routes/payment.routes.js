const router = require('express').Router();
const Payment = require('../models/payment.model');

// ── Initialise Stripe (lazy – only used if STRIPE_SECRET_KEY is set) ────────
const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

const SUCCESS_URL = process.env.STRIPE_SUCCESS_URL || 'http://localhost:3000/payment/success';
const CANCEL_URL  = process.env.STRIPE_CANCEL_URL  || 'http://localhost:3000/payment/cancel';

// ── POST /api/payments/create-checkout-session ──────────────────────────────
// Creates a Stripe Checkout Session and returns the redirect URL.
router.post('/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ message: 'Stripe is not configured on the server.' });
  }

  try {
    const {
      patientId,
      appointmentId,
      amount = 100,
      patientName = '',
      patientEmail = '',
      doctorName = '',
      appointmentDate = '',
      appointmentTime = '',
    } = req.body;

    if (!patientId || !appointmentId) {
      return res.status(400).json({ message: 'patientId and appointmentId are required.' });
    }

    // Prevent double-payment: check if a successful payment already exists
    const existing = await Payment.findOne({ appointmentId, status: 'success' });
    if (existing) {
      return res.status(409).json({ message: 'This appointment has already been paid.' });
    }

    // Amount in cents (Stripe uses smallest currency unit)
    const unitAmount = Math.round(Number(amount) * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'eMediCare Consultation Fee',
              description: `Appointment with Dr. ${doctorName || 'Doctor'} on ${appointmentDate || 'N/A'}`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: patientEmail || undefined,
      success_url: `${SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: CANCEL_URL,
      metadata: {
        patientId,
        appointmentId,
        patientName,
        patientEmail,
        doctorName,
        appointmentDate,
        appointmentTime,
        amount: String(amount),
      },
    });

    // Create a pending Payment record immediately so we can track it
    await Payment.create({
      patientId,
      appointmentId,
      amount: Number(amount),
      method: 'stripe',
      stripeSessionId: session.id,
      status: 'pending',
      patientName,
      patientEmail,
      doctorName,
      appointmentDate,
      appointmentTime,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('[Payment] create-checkout-session error:', err.message);
    res.status(500).json({ message: 'Failed to create checkout session', error: err.message });
  }
});

// ── POST /api/payments/confirm-success ──────────────────────────────────────
// Called by the frontend after Stripe redirects back with ?session_id=
router.post('/confirm-success', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ message: 'Stripe is not configured on the server.' });
  }

  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required.' });
    }

    // Retrieve session from Stripe to verify payment_status
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(402).json({ message: 'Payment has not been completed yet.' });
    }

    // Find the pending payment record we created during checkout-session
    const payment = await Payment.findOne({ stripeSessionId: sessionId });
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found.' });
    }

    if (payment.status === 'success') {
      // Already confirmed — return existing record (idempotent)
      return res.json({ message: 'Payment already confirmed.', payment });
    }

    // Generate a transaction ID and mark as success
    const transactionId = session.payment_intent || `STRIPE-${sessionId.slice(-12).toUpperCase()}`;
    payment.status = 'success';
    payment.transactionId = transactionId;
    payment.method = 'stripe';
    await payment.save();

    res.json({ message: 'Payment confirmed successfully.', payment });
  } catch (err) {
    console.error('[Payment] confirm-success error:', err.message);
    res.status(500).json({ message: 'Failed to confirm payment', error: err.message });
  }
});

// ── POST /api/payments/webhook ───────────────────────────────────────────────
// Stripe webhook — receives events from Stripe (production / Stripe CLI tunnel)
// NOTE: This route requires raw body; see index.js for the raw-body middleware.
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    if (stripe && webhookSecret && webhookSecret !== 'whsec_placeholder_replace_in_production') {
      event = stripe.webhooks.constructEvent(req.rawBody || req.body, sig, webhookSecret);
    } else {
      // No verified webhook in dev — parse body as JSON
      event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    }
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err.message);
    return res.status(400).json({ message: `Webhook error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    try {
      const payment = await Payment.findOne({ stripeSessionId: session.id });
      if (payment && payment.status !== 'success') {
        payment.status = 'success';
        payment.transactionId = session.payment_intent || `STRIPE-${session.id.slice(-12).toUpperCase()}`;
        await payment.save();
        console.log(`[Webhook] Payment confirmed for session: ${session.id}`);
      }
    } catch (err) {
      console.error('[Webhook] DB update failed:', err.message);
    }
  }

  res.json({ received: true });
});

// ── GET /api/payments/appointment/:appointmentId ─────────────────────────────
// Returns the payment record for a specific appointment (used by dashboards)
router.get('/appointment/:appointmentId', async (req, res) => {
  try {
    const payment = await Payment.findOne({
      appointmentId: req.params.appointmentId,
      status: 'success',
    }).sort({ createdAt: -1 });

    res.json({ payment: payment || null });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /api/payments — all transactions (admin) ─────────────────────────────
router.get('/', async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.json({ count: payments.length, payments });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── POST /api/payments/pay — legacy stub (kept for backward compatibility) ───
router.post('/pay', async (req, res) => {
  try {
    const { patientId, appointmentId, amount, method } = req.body;
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

// ── GET /api/payments/patient/:patientId ─────────────────────────────────────
router.get('/patient/:patientId', async (req, res) => {
  try {
    const payments = await Payment.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /api/payments/:patientId (alias kept for legacy api.js call) ──────────
router.get('/:patientId', async (req, res) => {
  // Guard against accidentally hitting this for specific named routes
  const reserved = ['create-checkout-session', 'confirm-success', 'webhook', 'appointment', 'patient'];
  if (reserved.includes(req.params.patientId)) {
    return res.status(404).json({ message: 'Route not found' });
  }
  try {
    const payments = await Payment.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── PUT /api/payments/:id ─────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json({ message: 'Payment updated', payment });
  } catch (err) {
    res.status(400).json({ message: 'Update failed', error: err.message });
  }
});

// ── DELETE /api/payments/:id ──────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
