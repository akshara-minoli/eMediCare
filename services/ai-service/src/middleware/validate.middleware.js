function validateSymptomCheckBody(req, res, next) {
  const symptoms = req.body?.symptoms;

  if (!Array.isArray(symptoms)) {
    return res.status(400).json({ message: 'symptoms must be an array' });
  }

  const cleaned = symptoms
    .map((item) => String(item || '').trim())
    .filter(Boolean);

  if (cleaned.length === 0) {
    return res.status(400).json({ message: 'Please provide at least one symptom' });
  }

  if (cleaned.length > 20) {
    return res.status(400).json({ message: 'Please provide 20 symptoms or fewer' });
  }

  req.body.symptoms = cleaned;
  next();
}

module.exports = {
  validateSymptomCheckBody,
};
