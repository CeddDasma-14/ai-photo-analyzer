const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const EXTRACTION_PROMPT = `Analyze this image and identify all waste or garbage items visible.
Return ONLY valid JSON with no extra text:
{
  "items": [
    {
      "name": "item name",
      "material": "plastic, glass, metal, paper, cardboard, organic, electronic, textile, rubber, or hazardous",
      "waste_type": "recyclable, biodegradable, hazardous, or residual",
      "disposal": "specific disposal instruction in one sentence",
      "bin_color": "which bin to use e.g. blue, green, yellow, red, black — or null if not applicable"
    }
  ],
  "summary": "overall disposal recommendation for all items combined",
  "environmental_note": "brief note on environmental impact or recycling benefit"
}

Waste type definitions:
- recyclable: can be processed and reused (plastic bottles, glass, metal cans, paper, cardboard)
- biodegradable: breaks down naturally (food scraps, leaves, wood, natural fabrics)
- hazardous: dangerous to health or environment (batteries, chemicals, paint, medicine, e-waste)
- residual: none of the above, goes to general waste (styrofoam, contaminated packaging, diapers)

Rules:
- Identify every visible waste item separately
- Be specific about material type
- Disposal instructions must be practical and actionable
- Do not include any text outside the JSON object`;

/**
 * Analyzes a waste/garbage image and returns classification + disposal guide.
 * @param {Buffer} imageBuffer
 * @param {string} mediaType
 * @returns {{ module, title, status, data }}
 */
async function analyzeWaste(imageBuffer, mediaType) {
  const base64Image = imageBuffer.toString('base64');

  let response;
  try {
    response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64Image }
            },
            { type: 'text', text: EXTRACTION_PROMPT }
          ]
        }
      ]
    });
  } catch (apiError) {
    const err = new Error('Waste analysis failed. Please try again.');
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
    extracted = { items: [], summary: null, environmental_note: null, parse_error: true };
  }

  return {
    module: 'waste',
    title: 'Waste Classifier',
    status: 'success',
    data: {
      items: Array.isArray(extracted.items) ? extracted.items : [],
      summary: extracted.summary ?? null,
      environmental_note: extracted.environmental_note ?? null,
      ...(extracted.parse_error ? { note: 'Could not fully read the image — results may be incomplete.' } : {})
    }
  };
}

module.exports = { analyzeWaste };
