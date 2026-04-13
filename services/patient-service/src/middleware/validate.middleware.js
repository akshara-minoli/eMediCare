const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const validateUserIdParam = (req, res, next) => {
  if (!req.params.userId || typeof req.params.userId !== 'string' || !req.params.userId.trim()) {
    return res.status(400).json({ success: false, message: 'Valid userId parameter is required' });
  }

  req.params.userId = req.params.userId.trim();
  return next();
};

const validateCreatePatientBody = (req, res, next) => {
  const { userId, name, email } = req.body;

  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    return res.status(400).json({ success: false, message: 'userId is required' });
  }

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ success: false, message: 'name is required' });
  }

  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ success: false, message: 'email is required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ success: false, message: 'email format is invalid' });
  }

  if (req.body.address && !isObject(req.body.address)) {
    return res.status(400).json({ success: false, message: 'address must be an object' });
  }

  if (req.body.emergencyContact && !isObject(req.body.emergencyContact)) {
    return res.status(400).json({ success: false, message: 'emergencyContact must be an object' });
  }

  if (req.body.allergies && !Array.isArray(req.body.allergies)) {
    return res.status(400).json({ success: false, message: 'allergies must be an array of strings' });
  }

  if (req.body.currentMedications && !Array.isArray(req.body.currentMedications)) {
    return res.status(400).json({ success: false, message: 'currentMedications must be an array of strings' });
  }

  req.body.userId = userId.trim();
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();

  return next();
};

const validateUpdatePatientBody = (req, res, next) => {
  if (!req.body || !isObject(req.body)) {
    return res.status(400).json({ success: false, message: 'Update payload must be an object' });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'userId')) {
    return res.status(400).json({ success: false, message: 'userId cannot be updated' });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'medicalHistory')) {
    return res.status(400).json({
      success: false,
      message: 'Use PATCH /:userId/history to add medical history entries',
    });
  }

  return next();
};

const validateMedicalHistoryBody = (req, res, next) => {
  const { condition, diagnosedAt } = req.body;

  if (!condition || typeof condition !== 'string' || !condition.trim()) {
    return res.status(400).json({ success: false, message: 'condition is required' });
  }

  if (diagnosedAt) {
    const date = new Date(diagnosedAt);
    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({ success: false, message: 'diagnosedAt must be a valid date' });
    }
  }

  return next();
};

module.exports = {
  validateUserIdParam,
  validateCreatePatientBody,
  validateUpdatePatientBody,
  validateMedicalHistoryBody,
};
