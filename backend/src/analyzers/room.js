const Anthropic = require('@anthropic-ai/sdk');
const { searchPHPrice } = require('../lib/pricingService');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const EXTRACTION_PROMPT = `You are an expert interior designer and real estate appraiser with deep knowledge of furniture, decor, room layouts, and home renovation costs.

Carefully examine this room image and provide a complete interior assessment.

Return ONLY valid JSON with no extra text, no markdown fences, no explanation:
{
  "room_type": "living room | bedroom | kitchen | bathroom | dining room | home office | hallway | garage | other",
  "style": "modern | minimalist | traditional | industrial | scandinavian | bohemian | mid-century | rustic | contemporary | eclectic | other",
  "condition": "excellent | good | fair | poor",
  "design_score": <integer 0–100>,
  "color_palette": ["primary color", "secondary color", "accent color"],
  "items": [
    {
      "name": "item name e.g. sofa, dining table, ceiling light",
      "brand_model": "brand and model if identifiable e.g. Acer Predator Helios Neo 16, IKEA KALLAX, Samsung 55-inch QLED — or null if generic",
      "search_query": "optimized Google Shopping search query e.g. 'Acer Predator Helios Neo 16 laptop Philippines' or 'fabric sofa 3-seater Philippines'",
      "category": "furniture | lighting | decor | appliance | electronics | flooring | window treatment | storage | other",
      "condition": "excellent | good | fair | poor",
      "estimated_value_usd": <number>
    }
  ],
  "total_estimated_value_usd": <number, sum of all items>,
  "strengths": [
    "one sentence describing a positive aspect of the room"
  ],
  "improvements": [
    {
      "suggestion": "specific actionable improvement",
      "priority": "high | medium | low",
      "estimated_cost_usd": <number>
    }
  ],
  "natural_light": "abundant | moderate | limited | none",
  "measurements": {
    "estimated_length_m": <number or null>,
    "estimated_width_m": <number or null>,
    "estimated_height_m": <number or null>,
    "estimated_area_sqm": <number or null>,
    "confidence": "high | medium | low",
    "reference_used": "brief explanation of which visible objects were used as measurement references",
    "elements": [
      {
        "element": "descriptive name e.g. left window, main door, south wall",
        "type": "window | door | wall | ceiling | floor | archway | other",
        "width_m": <number or null>,
        "height_m": <number or null>,
        "area_sqm": <number or null>,
        "location": "where in the room e.g. left wall, facing the camera, behind sofa",
        "notes": "material, style, or construction notes relevant for renovation e.g. sliding window, solid wood door, load-bearing wall"
      }
    ]
  },
  "summary": "2–3 sentence plain-English assessment of the room's overall look, feel, and the single most impactful improvement"
}

Design score guide:
- 90–100: magazine-worthy, cohesive and well-styled
- 70–89: well-designed with minor issues
- 50–69: functional but needs styling attention
- 30–49: dated or mismatched, significant improvement needed
- 0–29: poor condition or very bare

Condition guide:
- excellent: like new, no visible wear
- good: minor wear, well maintained
- fair: noticeable wear, functional but aging
- poor: significant damage or deterioration

Item value guide (USD):
- Sofa/sectional: $300–$3,000
- Dining table: $200–$2,000
- Bed frame + mattress: $300–$3,000
- Wardrobe/closet: $200–$1,500
- Coffee table: $100–$800
- TV + stand: $300–$2,000
- Refrigerator: $500–$2,500
- Washing machine: $400–$1,500
- Ceiling light/chandelier: $50–$1,000
- Curtains/blinds: $50–$500
- Rug: $50–$800
- Decorative items: $20–$200 each

Improvement cost guide (USD):
- Repainting a room: $200–$800
- New rug: $50–$300
- New lighting fixture: $50–$400
- New curtains: $50–$300
- Decluttering/organizing: $0–$100
- New throw pillows/cushions: $30–$150
- Wall art: $20–$300
- Full furniture set replacement: $1,000–$10,000

Element measurement guide:
For every visible window, door, wall, or architectural feature, add an entry to "elements" with estimated dimensions.
- Window types: casement, sliding, awning, fixed, louvered, jalousie
- Door types: solid wood, hollow core, sliding, folding, glass panel
- Wall notes: if a wall appears to be structural/load-bearing, mention it
- Area = width × height for windows and doors; length × height for walls
- "elements" must be [] if no individual architectural elements can be measured

Measurement estimation guide:
Use visible reference objects to estimate room dimensions. Standard references:
- Interior door: 2.1m tall × 0.8m wide
- Standard ceiling height: 2.4–2.7m (low), 2.7–3.0m (standard), 3.0m+ (high)
- Standard sofa: 0.85m tall × 2.0–2.5m wide × 0.9m deep
- Single bed: 0.9m × 1.9m | Double: 1.35m × 1.9m | Queen: 1.5m × 2.0m | King: 1.8m × 2.0m
- Standard dining chair: 0.9m tall × 0.45m wide
- Standard dining table: 0.75m tall, width/length varies
- Kitchen countertop height: 0.9m
- Window: typical 1.0–1.2m tall
- Floor tile: often 0.3m × 0.3m or 0.6m × 0.6m (count tiles if visible)
- Person in frame: average adult 1.7m tall
Estimate length and width of the room floor, ceiling height, and area (length × width).
If the image is a close-up or perspective makes estimation impossible, set all measurement values to null and explain in reference_used.
Confidence guide: high = multiple clear references visible, medium = one reference, low = perspective/angle makes it difficult.

Rules:
- List every clearly visible item in the room under "items"
- "items" must be [] if no identifiable items are visible
- "strengths" must have at least 1 entry if design_score >= 50, or [] if very poor
- "improvements" must have at least 2–4 actionable suggestions
- "color_palette" should have 2–4 colors maximum
- All numeric values must be numbers, not strings
- Do not include any text outside the JSON object`;

/**
 * Analyzes a room image for interior design assessment and value estimation.
 * @param {Buffer} imageBuffer
 * @param {string} mediaType
 * @returns {{ module, title, status, data }}
 */
async function analyzeRoom(imageBuffer, mediaType, itemHints = '') {
  const base64Image = imageBuffer.toString('base64');

  const hintsBlock = itemHints.trim()
    ? `\n\nUSER-PROVIDED ITEM DETAILS (use these for accurate brand/model identification and search_query generation):\n"${itemHints.trim()}"\nPrioritize these exact brand names and models in your search_query fields.`
    : '';

  let response;
  try {
    response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Image } },
          { type: 'text', text: EXTRACTION_PROMPT + hintsBlock }
        ]
      }]
    });
  } catch (apiError) {
    const err = new Error('Room analysis failed. Please try again.');
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
      room_type: null,
      style: null,
      condition: null,
      design_score: null,
      color_palette: [],
      items: [],
      total_estimated_value_usd: null,
      strengths: [],
      improvements: [],
      natural_light: null,
      measurements: { estimated_length_m: null, estimated_width_m: null, estimated_height_m: null, estimated_area_sqm: null, confidence: null, reference_used: null, elements: [] },
      summary: null,
      parse_error: true
    };
  }

  // If user provided hints, parse them into named items and search directly
  // This overrides Claude's generic names (e.g. "Gaming Laptop" → "Acer Predator Helios 16")
  const hintItems = itemHints.trim()
    ? itemHints.split(',').map(h => h.trim()).filter(Boolean).slice(0, 5)
    : [];

  const rawItems = Array.isArray(extracted.items) ? extracted.items : [];

  let pricedItems;

  if (hintItems.length > 0) {
    // Search Serpapi using user-provided brand names directly
    const hintPrices = await Promise.all(
      hintItems.map(hint => searchPHPrice(`${hint} Philippines`))
    );

    // Replace top N Claude items with hint-named items + real prices
    const hintedItems = hintItems.map((hint, i) => {
      const ph = hintPrices[i];
      // Try to match a Claude item by index for condition/category
      const claudeItem = rawItems[i] ?? {};
      return {
        name: hint,
        brand_model: hint,
        category: claudeItem.category ?? 'electronics',
        condition: claudeItem.condition ?? null,
        estimated_value_usd: claudeItem.estimated_value_usd ?? null,
        ...(ph ? { ph_price: { min_php: ph.min_php, max_php: ph.max_php, avg_php: ph.avg_php, source: ph.source, top_result: ph.top_result } } : {})
      };
    });

    // Append remaining Claude items (beyond hint count) without pricing
    const remainingItems = rawItems.slice(hintItems.length).map(item => ({
      name: item.name ?? null,
      brand_model: item.brand_model ?? null,
      category: item.category ?? null,
      condition: item.condition ?? null,
      estimated_value_usd: typeof item.estimated_value_usd === 'number' ? item.estimated_value_usd : null,
    }));

    pricedItems = [...hintedItems, ...remainingItems];
  } else {
    // No hints — fall back to Claude's item names + Serpapi search
    const itemsToPrice = rawItems
      .filter(item => item.search_query || item.name)
      .sort((a, b) => (b.estimated_value_usd || 0) - (a.estimated_value_usd || 0))
      .slice(0, 5);

    const priceResults = await Promise.all(
      itemsToPrice.map(item => searchPHPrice(item.search_query || `${item.name} Philippines`))
    );

    pricedItems = rawItems.map(item => {
      const idx = itemsToPrice.findIndex(i => i.name === item.name);
      const ph = idx !== -1 ? priceResults[idx] : null;
      return {
        name: item.name ?? null,
        brand_model: item.brand_model ?? null,
        category: item.category ?? null,
        condition: item.condition ?? null,
        estimated_value_usd: typeof item.estimated_value_usd === 'number' ? item.estimated_value_usd : null,
        ...(ph ? { ph_price: { min_php: ph.min_php, max_php: ph.max_php, avg_php: ph.avg_php, source: ph.source, top_result: ph.top_result } } : {})
      };
    });
  }

  // Compute total in PHP from real prices where available
  const totalPhp = pricedItems.reduce((sum, item) => {
    return sum + (item.ph_price?.avg_php ?? (item.estimated_value_usd ? Math.round(item.estimated_value_usd * 56) : 0));
  }, 0);

  return {
    module: 'room',
    title: 'Room Interior Estimator',
    status: 'success',
    data: {
      room_type:   extracted.room_type   ?? null,
      style:       extracted.style       ?? null,
      condition:   extracted.condition   ?? null,
      design_score: typeof extracted.design_score === 'number' ? extracted.design_score : null,
      color_palette: Array.isArray(extracted.color_palette) ? extracted.color_palette : [],
      items: pricedItems,
      total_estimated_value_usd: typeof extracted.total_estimated_value_usd === 'number' ? extracted.total_estimated_value_usd : null,
      total_estimated_value_php: totalPhp || null,
      pricing_source: process.env.SERPAPI_KEY ? 'Google Shopping PH (real market prices)' : 'AI estimate only',
      strengths:    Array.isArray(extracted.strengths)    ? extracted.strengths    : [],
      improvements: Array.isArray(extracted.improvements) ? extracted.improvements : [],
      natural_light: extracted.natural_light ?? null,
      measurements: {
        estimated_length_m: typeof extracted.measurements?.estimated_length_m === 'number' ? extracted.measurements.estimated_length_m : null,
        estimated_width_m:  typeof extracted.measurements?.estimated_width_m  === 'number' ? extracted.measurements.estimated_width_m  : null,
        estimated_height_m: typeof extracted.measurements?.estimated_height_m === 'number' ? extracted.measurements.estimated_height_m : null,
        estimated_area_sqm: typeof extracted.measurements?.estimated_area_sqm === 'number' ? extracted.measurements.estimated_area_sqm : null,
        confidence:     extracted.measurements?.confidence     ?? null,
        reference_used: extracted.measurements?.reference_used ?? null,
        elements: Array.isArray(extracted.measurements?.elements) ? extracted.measurements.elements : [],
      },
      summary: extracted.summary ?? null,
      ...(extracted.parse_error ? { note: 'Could not fully read the image — results may be incomplete.' } : {})
    }
  };
}

module.exports = { analyzeRoom };
