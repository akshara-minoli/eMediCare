const Admin = require('../models/admin.model');

// Get all admins
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get admin by ID
exports.getAdminById = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select('-password');
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    res.json(admin);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create new admin
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, role, permissions } = req.body;
    const admin = new Admin({ name, email, role, permissions });
    const savedAdmin = await admin.save();
    res.status(201).json(savedAdmin);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update admin
exports.updateAdmin = async (req, res) => {
  try {
    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!updatedAdmin) return res.status(404).json({ message: 'Admin not found' });
    res.json(updatedAdmin);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Deactivate/Delete admin
exports.deleteAdmin = async (req, res) => {
  try {
    const deletedAdmin = await Admin.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );
    if (!deletedAdmin) return res.status(404).json({ message: 'Admin not found' });
    res.json({ message: 'Admin deactivated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
