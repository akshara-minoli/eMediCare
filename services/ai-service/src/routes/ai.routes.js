const router = require('express').Router();

// Symptom → Condition mapping (simplified rule-based engine)
// In production: replace with a trained ML model or OpenAI API call
const symptomMap = {
  fever: ['Common Cold', 'Flu', 'COVID-19', 'Malaria'],
  headache: ['Migraine', 'Tension Headache', 'Hypertension'],
  cough: ['Common Cold', 'Bronchitis', 'COVID-19', 'Asthma'],
  fatigue: ['Anemia', 'Diabetes', 'Flu', 'Thyroid Disorder'],
  'chest pain': ['Angina', 'Heart Attack', 'GERD', 'Anxiety'],
  'shortness of breath': ['Asthma', 'COPD', 'Pneumonia', 'COVID-19'],
  nausea: ['Food Poisoning', 'Gastritis', 'Pregnancy', 'Migraine'],
};

// ── POST /api/ai/symptom-check ────────────────────────────────
router.post('/symptom-check', (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ message: 'Please provide a list of symptoms' });
    }

    const possibleConditions = new Set();
    const matched = [];

    symptoms.forEach((symptom) => {
      const key = symptom.toLowerCase().trim();
      if (symptomMap[key]) {
        matched.push(key);
        symptomMap[key].forEach((c) => possibleConditions.add(c));
      }
    });

    if (possibleConditions.size === 0) {
      return res.json({
        message: 'No matching conditions found. Please consult a doctor.',
        conditions: [],
        recommendation: 'Book an appointment with a General Physician.',
      });
    }

    res.json({
      message: 'Analysis complete',
      symptomsAnalyzed: matched,
      possibleConditions: Array.from(possibleConditions),
      recommendation: 'These are possible suggestions only. Please consult a licensed doctor for diagnosis.',
      disclaimer: 'This AI tool is not a substitute for professional medical advice.',
    });
  } catch (err) {
    res.status(500).json({ message: 'AI analysis failed', error: err.message });
  }
});

module.exports = router;
