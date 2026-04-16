const router = require('express').Router();
const Notification = require('../models/notification.model');

// ── GET /api/notifications/:recipient ─────────────────────────
// Fetches notifications for a specific recipient email or 'all'
router.get('/:recipient', async (req, res) => {
  try {
    const { recipient } = req.params;
    const notifications = await Notification.find({
      $or: [{ recipient: recipient }, { recipient: 'all' }]
    }).sort({ createdAt: -1 });
    
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notifications', error: err.message });
  }
});

// ── POST /api/notifications/send ──────────────────────────────
router.post('/send', async (req, res) => {
  try {
    const { type, recipient, message, channel } = req.body;
    
    const recipients = Array.isArray(recipient) ? recipient : [recipient];
    
    // Save each notification to the database
    const savePromises = recipients.map(target => {
      const newNotif = new Notification({
        type: type || 'ADMIN_ANNOUNCEMENT',
        recipient: target,
        message,
        channel: channel || 'system'
      });
      return newNotif.save();
    });

    await Promise.all(savePromises);

    console.log(`[Notification] Saved and "sent" to ${recipients.length} recipient(s): ${message}`);

    res.status(200).json({
      message: 'Notification(s) sent and saved successfully',
      details: { type, recipientCount: recipients.length, channel }
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to process notification', error: err.message });
  }
});

module.exports = router;
