const axios = require('axios');

let cachedFreeModels = [];
let cachedAt = 0;
const CACHE_MS = 10 * 60 * 1000;

function tryParseJsonBlock(text) {
  if (!text) return null;

  const trimmed = String(text).trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

async function callOpenRouter(symptoms) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const modelCandidates = await getOpenRouterModelCandidates(apiKey);

  const prompt = [
    'You are a medical triage assistant for preliminary suggestions only.',
    'Return strict JSON only with keys: preliminarySuggestion, recommendedSpecialties, riskNote.',
    `Symptoms: ${symptoms.join(', ')}`,
  ].join('\n');

  let lastError = null;

  for (const model of modelCandidates) {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'eMediCare AI Service',
          },
          timeout: 20000,
        }
      );

      const content = response.data?.choices?.[0]?.message?.content || '';
      const parsed = tryParseJsonBlock(content);
      if (!parsed) {
        return {
          provider: 'openrouter',
          model,
          preliminarySuggestion: content || 'No provider response text.',
          recommendedSpecialties: [],
          riskNote: 'Provider response could not be parsed as structured JSON.',
        };
      }

      return {
        provider: 'openrouter',
        model,
        preliminarySuggestion: parsed.preliminarySuggestion || '',
        recommendedSpecialties: Array.isArray(parsed.recommendedSpecialties)
          ? parsed.recommendedSpecialties
          : [],
        riskNote: parsed.riskNote || '',
      };
    } catch (err) {
      const status = err.response?.status;
      // Free models can be temporarily unavailable or rate-limited; try next model.
      if (status === 404 || status === 429 || status === 503) {
        lastError = err;
        continue;
      }
      lastError = err;
    }
  }

  if (!lastError) return null;
  return null;
}

async function getOpenRouterModelCandidates(apiKey) {
  const envModel = process.env.OPENROUTER_MODEL;

  const now = Date.now();
  if (cachedFreeModels.length > 0 && now - cachedAt < CACHE_MS) {
    return [envModel, ...cachedFreeModels].filter(Boolean);
  }

  try {
    const response = await axios.get('https://openrouter.ai/api/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 15000,
    });

    const freeModels = (response.data?.data || [])
      .map((item) => item.id)
      .filter((id) => typeof id === 'string' && id.endsWith(':free'))
      .slice(0, 12);

    cachedFreeModels = freeModels;
    cachedAt = now;

    return [envModel, ...freeModels].filter(Boolean);
  } catch {
    return [
      envModel,
      'google/gemma-4-26b-a4b-it:free',
      'meta-llama/llama-3.1-8b-instruct:free',
      'mistralai/mistral-7b-instruct:free',
      'microsoft/phi-3-mini-128k-instruct:free',
    ].filter(Boolean);
  }
}

async function callHuggingFace(symptoms) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) return null;

  const model = process.env.HUGGINGFACE_MODEL || 'google/flan-t5-base';
  const prompt = `Symptoms: ${symptoms.join(', ')}. Provide preliminary health suggestion and recommended doctor specialties in short text.`;

  const response = await axios.post(
    `https://api-inference.huggingface.co/models/${model}`,
    { inputs: prompt },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 25000,
    }
  );

  const generated = Array.isArray(response.data)
    ? response.data[0]?.generated_text
    : response.data?.generated_text;

  return {
    provider: 'huggingface',
    model,
    preliminarySuggestion: generated || 'No provider response text.',
    recommendedSpecialties: [],
    riskNote: 'Provider output is unstructured text; review clinically.',
  };
}

async function getExternalSuggestion(symptoms) {
  try {
    const openrouter = await callOpenRouter(symptoms);
    if (openrouter) return openrouter;

    const huggingface = await callHuggingFace(symptoms);
    if (huggingface) return huggingface;

    return null;
  } catch (err) {
    return null;
  }
}

function getProviderStatus() {
  return {
    openrouterConfigured: Boolean(process.env.OPENROUTER_API_KEY),
    openrouterModel: process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct:free',
    huggingfaceConfigured: Boolean(process.env.HUGGINGFACE_API_KEY),
    huggingfaceModel: process.env.HUGGINGFACE_MODEL || 'google/flan-t5-base',
  };
}

module.exports = {
  getExternalSuggestion,
  getProviderStatus,
};