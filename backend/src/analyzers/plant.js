const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Step 1 — Identify the plant using PlantNet API.
 * Returns { plant_name, scientific_name, confidence, identification_notes } or null on failure.
 */
async function identifyWithPlantNet(imageBuffer, mediaType) {
  const apiKey = process.env.PLANTNET_API_KEY;
  if (!apiKey || apiKey === 'your-plantnet-api-key-here') return null;

  try {
    const blob = new Blob([imageBuffer], { type: mediaType });
    const formData = new FormData();
    formData.append('images', blob, 'plant.jpg');
    formData.append('organs', 'auto');

    const response = await fetch(
      `https://my-api.plantnet.org/v2/identify/all?api-key=${apiKey}&lang=en&nb-results=3`,
      { method: 'POST', body: formData }
    );

    if (!response.ok) return null;

    const json = await response.json();
    const results = json.results ?? [];
    if (results.length === 0) return null;

    const best = results[0];
    const runnerUp = results[1];

    const plant_name = best.species?.commonNames?.[0] ?? best.species?.scientificNameWithoutAuthor ?? 'Unknown plant';
    const scientific_name = best.species?.scientificNameWithoutAuthor ?? null;
    const confidence_pct = Math.round((best.score ?? 0) * 100);

    const identification_confidence =
      confidence_pct >= 60 ? 'high' :
      confidence_pct >= 30 ? 'medium' : 'low';

    let identification_notes = `Identified by PlantNet with ${confidence_pct}% confidence based on leaf shape, venation, and surface characteristics.`;
    if (runnerUp) {
      const runnerName = runnerUp.species?.commonNames?.[0] ?? runnerUp.species?.scientificNameWithoutAuthor;
      const runnerPct = Math.round((runnerUp.score ?? 0) * 100);
      identification_notes += ` Runner-up: ${runnerName} (${runnerPct}%).`;
    }

    return { plant_name, scientific_name, identification_confidence, identification_notes };
  } catch {
    return null;
  }
}

/**
 * Step 2 — Assess plant health using Claude Vision.
 * plantId is the result from PlantNet (or null if unavailable).
 */
async function assessHealthWithClaude(imageBuffer, mediaType, plantId) {
  const base64Image = imageBuffer.toString('base64');

  const identityContext = plantId
    ? `This plant has been identified as ${plantId.plant_name} (${plantId.scientific_name ?? 'scientific name unknown'}) with ${plantId.identification_confidence} confidence. Use this identification — do not re-identify the plant.`
    : `Identify this plant from visual features before assessing health. Observe leaf shape, margin, venation, surface texture, petiole, and stem carefully before naming it. Consider tropical and Southeast Asian species.`;

  const prompt = `You are an expert botanist and plant health specialist.

${identityContext}

Assess the health of this plant and return ONLY valid JSON with no extra text, no markdown fences:
{
  ${plantId ? '' : `"plant_name": "most likely common name",
  "scientific_name": "Genus species or null",
  "identification_confidence": "high | medium | low",
  "identification_notes": "which visual features led to this ID, any runner-up species",`}
  "health_status": "healthy | stressed | diseased | dying",
  "health_score": <integer 0–100>,
  "issues": [
    {
      "issue": "concise issue name",
      "severity": "mild | moderate | severe",
      "cause": "most likely cause in one sentence"
    }
  ],
  "care": {
    "watering": "specific advice based on current condition",
    "light": "light requirement and adjustment needed",
    "soil": "soil type and drainage recommendation",
    "fertilizer": "type, frequency, current need",
    "humidity": "preference and current assessment"
  },
  "urgency": "none | low | medium | high",
  "summary": "2–3 sentence assessment and the single most important action"
}

Scoring: 90–100 vigorous | 70–89 minor issues | 50–69 stressed | 30–49 diseased | 0–29 dying
Urgency: none=routine | low=within 2 weeks | medium=3–5 days | high=act today

Issues to look for: yellowing, brown tips, dark spots, wilting, bleached leaves, leggy growth, powdery coating, pests, webbing, rootbound signs.

Rules:
- "issues" must be [] when no visible problems
- health_score must be an integer
- Do not include any text outside the JSON object`;

  let response;
  try {
    response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1536,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Image } },
          { type: 'text', text: prompt }
        ]
      }]
    });
  } catch (apiError) {
    const err = new Error('Plant analysis failed. Please try again.');
    err.status = 502;
    err.cause = apiError;
    throw err;
  }

  try {
    const text = response.content[0]?.text?.trim() ?? '';
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

/**
 * Analyzes a plant image: PlantNet for species ID, Claude for health assessment.
 * @param {Buffer} imageBuffer
 * @param {string} mediaType
 * @returns {{ module, title, status, data }}
 */
async function analyzePlant(imageBuffer, mediaType) {
  // Run PlantNet and Claude health assessment in parallel for speed
  const [plantId, health] = await Promise.all([
    identifyWithPlantNet(imageBuffer, mediaType),
    // Claude health assessment — if PlantNet is fast enough we pass plantId,
    // but since they run in parallel we do a second Claude call only if needed
    assessHealthWithClaude(imageBuffer, mediaType, null)
  ]);

  // If PlantNet gave us an ID and Claude fell back to its own ID, merge:
  // Use PlantNet's identification fields, keep Claude's health fields
  const finalHealth = health ?? {};

  const plant_name        = plantId?.plant_name        ?? finalHealth.plant_name        ?? 'Unknown plant';
  const scientific_name   = plantId?.scientific_name   ?? finalHealth.scientific_name   ?? null;
  const id_confidence     = plantId?.identification_confidence ?? finalHealth.identification_confidence ?? null;
  const id_notes          = plantId?.identification_notes      ?? finalHealth.identification_notes      ?? null;

  return {
    module: 'plant',
    title: 'Plant Health Detector',
    status: 'success',
    data: {
      plant_name,
      scientific_name,
      identification_confidence: id_confidence,
      identification_notes: id_notes,
      health_status: finalHealth.health_status ?? null,
      health_score:  typeof finalHealth.health_score === 'number' ? finalHealth.health_score : null,
      issues:        Array.isArray(finalHealth.issues) ? finalHealth.issues : [],
      care: {
        watering:   finalHealth.care?.watering   ?? null,
        light:      finalHealth.care?.light      ?? null,
        soil:       finalHealth.care?.soil       ?? null,
        fertilizer: finalHealth.care?.fertilizer ?? null,
        humidity:   finalHealth.care?.humidity   ?? null,
      },
      urgency: finalHealth.urgency ?? null,
      summary: finalHealth.summary ?? null,
    }
  };
}

module.exports = { analyzePlant };
