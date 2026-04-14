const {
  SYMPTOM_ALIASES,
  EMERGENCY_SYMPTOMS,
  CONDITION_KB,
} = require('../data/symptomKnowledge');

const aliasToCanonical = Object.entries(SYMPTOM_ALIASES).reduce((acc, [canonical, aliases]) => {
  aliases.forEach((value) => {
    acc[value.toLowerCase().trim()] = canonical;
  });
  return acc;
}, {});

function normalizeSymptoms(symptoms) {
  const normalized = [];
  const unknown = [];

  symptoms.forEach((raw) => {
    const clean = String(raw || '').toLowerCase().trim();
    if (!clean) return;

    const canonical = aliasToCanonical[clean] || clean;
    if (SYMPTOM_ALIASES[canonical]) {
      if (!normalized.includes(canonical)) normalized.push(canonical);
    } else if (!unknown.includes(clean)) {
      unknown.push(clean);
    }
  });

  return { normalized, unknown };
}

function computeConfidence(matchedCount, totalSignals) {
  if (!totalSignals) return 0;
  const ratio = matchedCount / totalSignals;
  return Math.round(ratio * 100);
}

function buildLikelyConditions(normalizedSymptoms) {
  const results = CONDITION_KB.map((condition) => {
    const matched = condition.symptoms.filter((symptom) => normalizedSymptoms.includes(symptom));
    const confidence = computeConfidence(matched.length, condition.symptoms.length);
    return {
      condition: condition.name,
      category: condition.category,
      confidence,
      matchedSymptoms: matched,
      recommendation: condition.recommendation,
    };
  })
    .filter((item) => item.confidence >= 25)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 4);

  return results;
}

function detectTriage(normalizedSymptoms, likelyConditions) {
  const emergencyFlags = normalizedSymptoms.filter((symptom) => EMERGENCY_SYMPTOMS.includes(symptom));

  if (emergencyFlags.length > 0) {
    return {
      level: 'emergency',
      reason: 'High-risk symptoms detected',
      emergencyFlags,
    };
  }

  const topConfidence = likelyConditions[0]?.confidence || 0;
  if (normalizedSymptoms.includes('shortness_of_breath') || topConfidence >= 80) {
    return {
      level: 'urgent',
      reason: 'Symptoms suggest prompt medical review',
      emergencyFlags: [],
    };
  }

  return {
    level: 'routine',
    reason: 'No immediate high-risk signal identified',
    emergencyFlags: [],
  };
}

function analyzeSymptoms(payload) {
  const symptoms = Array.isArray(payload?.symptoms) ? payload.symptoms : [];
  const { normalized, unknown } = normalizeSymptoms(symptoms);

  const likelyConditions = buildLikelyConditions(normalized);
  const triage = detectTriage(normalized, likelyConditions);

  const nextActions =
    triage.level === 'emergency'
      ? [
          'Seek emergency care immediately.',
          'Do not self-medicate for severe chest pain or breathing difficulty.',
          'Call local emergency services if symptoms worsen suddenly.',
        ]
      : triage.level === 'urgent'
        ? [
            'Book a doctor appointment within 24 hours.',
            'Track temperature, breathing, and hydration.',
            'Visit urgent care if symptoms escalate.',
          ]
        : [
            'Monitor symptoms for 24-48 hours.',
            'Stay hydrated and rest.',
            'Book a routine consultation if symptoms persist.',
          ];

  return {
    message: 'AI analysis complete',
    symptomsReceived: symptoms,
    symptomsAnalyzed: normalized,
    unknownSymptoms: unknown,
    triage,
    likelyConditions,
    recommendation:
      'This result is an AI-supported triage aid and not a medical diagnosis. Always consult a licensed doctor.',
    disclaimer:
      'If you have severe chest pain, breathing trouble, confusion, or fainting, seek emergency medical care immediately.',
    nextActions,
    generatedAt: new Date().toISOString(),
  };
}

function getSymptomCatalog() {
  return Object.entries(SYMPTOM_ALIASES).map(([canonical, aliases]) => ({
    canonical,
    aliases,
  }));
}

module.exports = {
  analyzeSymptoms,
  getSymptomCatalog,
};
