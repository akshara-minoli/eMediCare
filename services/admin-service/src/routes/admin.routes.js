const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

// ── Admin Routes ──────────────────────────────────────────────

// GET: List all admins
router.get('/', adminController.getAllAdmins);

// GET: Get admin detail by ID
router.get('/:id', adminController.getAdminById);

// POST: Create a new admin
router.post('/', adminController.createAdmin);

// PUT: Update admin profile
router.put('/:id', adminController.updateAdmin);

// DELETE: Deactivate admin
router.delete('/:id', adminController.deleteAdmin);

module.exports = router;
