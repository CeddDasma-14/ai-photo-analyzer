const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const EXTRACTION_PROMPT = `You are an expert automotive damage assessor with experience in collision repair, insurance claims, and vehicle appraisal.

Carefully examine this vehicle image and assess all visible damage.

Return ONLY valid JSON with no extra text, no markdown fences, no explanation:
{
  "vehicle": {
    "make": "manufacturer name e.g. Toyota, Honda — or null if unidentifiable",
    "model": "model name e.g. Vios, Civic — or null if unidentifiable",
    "color": "vehicle color",
    "type": "sedan | SUV | pickup | van | hatchback | motorcycle | truck | other"
  },
  "damage_areas": [
    {
      "part": "specific part name e.g. front bumper, hood, driver door, windshield",
      "damage_type": "dent | scratch | crack | shatter | broken | missing | paint_damage | deformation",
      "severity": "minor | moderate | severe",
      "description": "one sentence describing the specific damage visible"
    }
  ],
  "overall_severity": "minor | moderate | severe | total_loss",
  "repair_estimate": {
    "min": <number, repair cost low estimate in USD>,
    "max": <number, repair cost high estimate in USD>,
    "note": "Estimates are in USD and are approximate — actual costs vary by location, shop, and parts availability."
  },
  "is_driveable": true,
  "airbags_deployed": false,
  "summary": "2–3 sentence plain-English summary of the overall damage and the most urgent repair needed"
}

Severity guide:
- minor: surface-level scratches, small dents, no structural damage — cosmetic only
- moderate: visible dents/cracks affecting panels, broken lights or glass, partial deformation
- severe: major structural damage, crumpled panels, multiple systems affected
- total_loss: damage so extensive that repair cost likely exceeds vehicle value

Driveability guide:
- true: vehicle appears safe to drive with the visible damage
- false: damage affects critical systems (brakes, steering, suspension, lights, airbags, frame)
- null: cannot determine from the image

Repair estimate guide (USD ranges):
- Light scratch touch-up: $100–$400
- Deep scratch / paint damage per panel: $300–$900
- Minor dent (paintless dent repair): $150–$500
- Moderate dent with paint damage: $500–$1,500
- Bumper repair/replacement: $500–$2,000
- Hood repair/replacement: $500–$2,500
- Door panel repair/replacement: $500–$2,500
- Windshield replacement: $200–$600
- Headlight/taillight replacement: $200–$800
- Fender repair/replacement: $500–$1,500
- Side mirror replacement: $150–$500
- Frame damage: $1,000–$10,000+
- Airbag replacement (per bag): $1,000–$3,000

Rules:
- List every damaged part you can see as a separate entry in damage_areas
- damage_areas must be [] if no damage is visible
- repair_estimate min and max must be numbers, not strings
- is_driveable and airbags_deployed must be boolean or null
- Do not include any text outside the JSON object`;

/**
 * Analyzes a vehicle image for damage and repair estimates.
 * @param {Buffer} imageBuffer
 * @param {string} mediaType
 * @returns {{ module, title, status, data }}
 */
async function analyzeCarDamage(imageBuffer, mediaType) {
  const base64Image = imageBuffer.toString('base64');

  let response;
  try {
    response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Image } },
          { type: 'text', text: EXTRACTION_PROMPT }
        ]
      }]
    });
  } catch (apiError) {
    const err = new Error('Car damage analysis failed. Please try again.');
    err.status = 502;
    err.cause = apiError;
    throw err;
  }

  let extracted;
  try {
    const text = response.content[0]?.text?.trim() ?? '';
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    extracted = JSON.parse(cleaned);
  } catch {
    extracted = {
      vehicle: { make: null, model: null, color: null, type: null },
      damage_areas: [],
      overall_severity: null,
      repair_estimate: { min: null, max: null, note: null },
      is_driveable: null,
      airbags_deployed: null,
      summary: null,
      parse_error: true
    };
  }

  return {
    module: 'car_damage',
    title: 'Car Damage Estimator',
    status: 'success',
    data: {
      vehicle: {
        make:  extracted.vehicle?.make  ?? null,
        model: extracted.vehicle?.model ?? null,
        color: extracted.vehicle?.color ?? null,
        type:  extracted.vehicle?.type  ?? null,
      },
      damage_areas: Array.isArray(extracted.damage_areas) ? extracted.damage_areas : [],
      overall_severity: extracted.overall_severity ?? null,
      repair_estimate: {
        min:  typeof extracted.repair_estimate?.min === 'number' ? extracted.repair_estimate.min : null,
        max:  typeof extracted.repair_estimate?.max === 'number' ? extracted.repair_estimate.max : null,
        note: extracted.repair_estimate?.note ?? null,
      },
      is_driveable:     extracted.is_driveable    ?? null,
      airbags_deployed: extracted.airbags_deployed ?? null,
      summary:          extracted.summary ?? null,
      ...(extracted.parse_error ? { note: 'Could not fully read the image — results may be incomplete.' } : {})
    }
  };
}

module.exports = { analyzeCarDamage };
