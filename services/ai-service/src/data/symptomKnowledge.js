const SYMPTOM_ALIASES = {
  fever: ['fever', 'high temperature', 'temperature'],
  headache: ['headache', 'head pain', 'migraine'],
  cough: ['cough', 'dry cough', 'wet cough'],
  fatigue: ['fatigue', 'tiredness', 'weakness', 'exhaustion'],
  sore_throat: ['sore throat', 'throat pain'],
  runny_nose: ['runny nose', 'blocked nose', 'nasal congestion'],
  body_ache: ['body ache', 'muscle pain', 'joint pain'],
  shortness_of_breath: ['shortness of breath', 'breathing difficulty', 'breathlessness'],
  chest_pain: ['chest pain', 'chest tightness'],
  nausea: ['nausea', 'vomiting feeling'],
  vomiting: ['vomiting', 'throwing up'],
  diarrhea: ['diarrhea', 'loose motion'],
  abdominal_pain: ['abdominal pain', 'stomach pain', 'belly pain'],
  dizziness: ['dizziness', 'lightheadedness'],
  loss_of_taste_smell: ['loss of taste', 'loss of smell'],
  rash: ['rash', 'skin rash'],
};

const EMERGENCY_SYMPTOMS = [
  'chest_pain',
  'shortness_of_breath',
  'severe_headache',
  'confusion',
  'fainting',
  'uncontrolled_bleeding',
];

const CONDITION_KB = [
  {
    name: 'Common Cold',
    category: 'Respiratory',
    symptoms: ['cough', 'sore_throat', 'runny_nose', 'fatigue'],
    recommendation: 'Hydrate, rest, and monitor symptoms for 48 hours.',
  },
  {
    name: 'Flu (Influenza)',
    category: 'Respiratory',
    symptoms: ['fever', 'cough', 'body_ache', 'fatigue', 'headache'],
    recommendation: 'Rest, maintain fluids, and consult doctor if high fever persists.',
  },
  {
    name: 'COVID-19',
    category: 'Respiratory',
    symptoms: ['fever', 'cough', 'fatigue', 'shortness_of_breath', 'loss_of_taste_smell'],
    recommendation: 'Isolate, test early, and seek clinical guidance especially for breathing issues.',
  },
  {
    name: 'Migraine',
    category: 'Neurology',
    symptoms: ['headache', 'nausea', 'vomiting', 'dizziness'],
    recommendation: 'Rest in a dark room, avoid triggers, and consult if attacks are frequent.',
  },
  {
    name: 'Gastritis / Indigestion',
    category: 'Gastrointestinal',
    symptoms: ['nausea', 'abdominal_pain', 'vomiting'],
    recommendation: 'Avoid spicy food, hydrate, and consult if pain is severe or persistent.',
  },
  {
    name: 'Food Poisoning',
    category: 'Gastrointestinal',
    symptoms: ['nausea', 'vomiting', 'diarrhea', 'abdominal_pain', 'fever'],
    recommendation: 'Use oral rehydration and seek urgent care if dehydration signs appear.',
  },
  {
    name: 'Possible Asthma Exacerbation',
    category: 'Respiratory',
    symptoms: ['shortness_of_breath', 'cough', 'chest_pain'],
    recommendation: 'Use prescribed inhaler and seek urgent doctor review for persistent breathing difficulty.',
  },
];

module.exports = {
  SYMPTOM_ALIASES,
  EMERGENCY_SYMPTOMS,
  CONDITION_KB,
};
