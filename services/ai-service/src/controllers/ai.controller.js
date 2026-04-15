const { analyzeSymptoms, getSymptomCatalog } = require('../services/analyzer.service');
const { getExternalSuggestion, getProviderStatus } = require('../services/externalProvider.service');

async function symptomCheck(req, res) {
  try {
    const result = analyzeSymptoms(req.body || {});
    const externalSuggestion = await getExternalSuggestion(result.symptomsAnalyzed || []);
    if (externalSuggestion && (externalSuggestion.preliminarySuggestion || externalSuggestion.recommendedSpecialties?.length)) {
      result.externalSuggestion = externalSuggestion;
    }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ message: 'AI analysis failed', error: err.message });
  }
}

function listSymptoms(_req, res) {
  try {
    return res.json({
      count: getSymptomCatalog().length,
      symptoms: getSymptomCatalog(),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load symptom catalog', error: err.message });
  }
}

function providerStatus(_req, res) {
  return res.json({
    message: 'AI provider status loaded',
    providers: getProviderStatus(),
  });
}

module.exports = {
  symptomCheck,
  listSymptoms,
  providerStatus,
};
