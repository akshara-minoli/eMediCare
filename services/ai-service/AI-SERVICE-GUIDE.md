# AI Service Guide

## Overview
This AI service is now a complete symptom triage module for your assignment.

It supports:
- symptom normalization and alias matching
- condition confidence scoring
- triage levels (`routine`, `urgent`, `emergency`)
- emergency symptom detection
- safe next-action recommendations
- frontend integration through `/api/ai/symptom-check`

No paid API key is required for this version.

## Files
- [src/index.js](src/index.js)
- [src/routes/ai.routes.js](src/routes/ai.routes.js)
- [src/controllers/ai.controller.js](src/controllers/ai.controller.js)
- [src/middleware/validate.middleware.js](src/middleware/validate.middleware.js)
- [src/services/analyzer.service.js](src/services/analyzer.service.js)
- [src/data/symptomKnowledge.js](src/data/symptomKnowledge.js)
- [.env.example](.env.example)

## API Endpoints
1. `GET /api/ai/symptoms`
- Returns supported symptom catalog.

2. `POST /api/ai/symptom-check`
- Body:
```json
{
  "symptoms": ["fever", "cough", "fatigue"]
}
```

- Response contains:
- `triage`
- `likelyConditions`
- `nextActions`
- `recommendation`
- `disclaimer`

## Run with Docker
From project root:

```powershell
docker compose up -d --build ai-service api-gateway frontend
```

## Quick Test
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/ai/symptom-check" -Method Post -ContentType "application/json" -Body '{"symptoms":["fever","cough","fatigue"]}'
```

## Optional Free API Providers (if needed later)
- OpenRouter free-tier models
- Hugging Face free inference tiers

Current implementation is fully usable without external API keys.

## Free API key setup (optional)

### Option 1: OpenRouter (recommended free path)
1. Create account at OpenRouter.
2. Generate API key.
3. Add to `services/ai-service/.env`:

```env
OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=mistralai/mistral-7b-instruct:free
```

### Option 2: Hugging Face (fallback)
1. Create account at Hugging Face.
2. Create access token.
3. Add to `services/ai-service/.env`:

```env
HUGGINGFACE_API_KEY=your_key_here
HUGGINGFACE_MODEL=google/flan-t5-base
```

### Verify provider config
```powershell
Invoke-RestMethod http://localhost:8080/api/ai/provider-status | ConvertTo-Json -Depth 6
```
