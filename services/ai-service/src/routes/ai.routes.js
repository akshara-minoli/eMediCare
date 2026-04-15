const router = require('express').Router();
const { symptomCheck, listSymptoms, providerStatus } = require('../controllers/ai.controller');
const { validateSymptomCheckBody } = require('../middleware/validate.middleware');

router.get('/symptoms', listSymptoms);
router.get('/provider-status', providerStatus);
router.post('/symptom-check', validateSymptomCheckBody, symptomCheck);

module.exports = router;
