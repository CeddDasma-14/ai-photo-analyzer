const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const EXTRACTION_PROMPT = `Analyze this food image carefully. Study the actual shape, color, texture, and cooking context of each ingredient before naming it. This is likely Filipino or Asian cuisine.

PHILIPPINE VEGETABLE & INGREDIENT REFERENCE — use this to identify correctly:

Vegetables:
- Talong (eggplant) — long purple or dark, sliced into rounds or halved
- Kalabasa (squash/pumpkin) — orange/yellow chunks, often in coconut broth
- Malunggay (moringa) — tiny round dark-green leaves on thin stems
- Ampalaya (bitter melon) — bumpy green, sliced into rings
- Kangkong (water spinach) — long hollow stems, dark green leaves
- Sitaw (string beans/yard-long beans) — very long thin green pods
- Okra — ridged green pods, hexagonal cross-section
- Pechay (bok choy) — white stems, large dark green leaves
- Repolyo (cabbage) — tightly layered pale green leaves
- Labanos (radish) — white, thick, sliced into rounds or half-moons
- Patola (sponge gourd) — ridged green, cylindrical
- Upo (bottle gourd) — pale green, large, chunky
- Sayote (chayote) — pale green, pear-shaped, wrinkled center
- Gabi (taro) — brown outside, white/purple inside, chunky
- Kamote (sweet potato) — orange flesh, roasted or boiled
- Mais (corn) — yellow kernels on cob or cut off
- Saging na saba (cooking banana) — thick, green or yellow
- Puso ng saging (banana blossom) — purple layered, shredded

Aromatics & seasonings:
- Sibuyas (onion) — white or red, sliced or whole
- Bawang (garlic) — white cloves, minced or whole
- Luya (ginger) — tan/brown knobby root, sliced
- Siling haba (long green chili) — long thin green pepper
- Siling labuyo (bird's eye chili) — tiny red or green chili
- Pandan leaves — long flat bright-green leaves
- Tanglad (lemongrass) — pale yellow-green stalks
- Dahon ng laurel (bay leaf) — dried brown oval leaf

Proteins often paired with vegetables:
- Baboy (pork) — pale pink meat, various cuts
- Manok (chicken) — bone-in pieces, browned or stewed
- Isda (fish) — whole or fillets, often fried golden
- Hipon (shrimp) — pink/orange curved
- Alimango/Alimasag (crab) — whole or claws
- Tokwa (tofu) — white/fried golden cubes
- Itlog (egg) — whole boiled, fried, or sliced

Common dish contexts:
- Ginataang gulay — vegetables in white coconut milk broth
- Sinigang — sour soup, clear broth with vegetables
- Pinakbet — dry mixed vegetables with bagoong (shrimp paste)
- Adobo — dark soy-vinegar sauce
- Nilaga — clear broth boiled meat and vegetables
- Kare-kare — thick orange peanut sauce
- Dinengdeng — light fish sauce-based vegetable soup
- Pakbet — Ilocano mixed vegetables

Identify every food item visible and estimate nutritional values.
Return ONLY valid JSON with no extra text:
{
  "items": [
    {
      "name": "food item name with local name if applicable e.g. Eggplant (Talong)",
      "portion": "estimated portion e.g. 1 cup, 200g, 3 slices",
      "calories": 0,
      "protein_g": 0.0,
      "carbs_g": 0.0,
      "fat_g": 0.0
    }
  ],
  "total_calories": 0,
  "total_protein_g": 0.0,
  "total_carbs_g": 0.0,
  "total_fat_g": 0.0,
  "meal_type": "breakfast, lunch, dinner, or snack — or null if unclear"
}

Rules:
- Use the reference above to identify Filipino ingredients correctly
- Always include the local name in parentheses if applicable
- All numbers must be integers or decimals, not strings
- List every visible food item separately
- Do not include any text outside the JSON object`;

/**
 * Analyzes a food image and returns nutritional breakdown.
 * @param {Buffer} imageBuffer - Already validated image buffer
 * @param {string} mediaType - e.g. 'image/jpeg'
 * @returns {{ module, title, status, data }}
 */
async function analyzeFood(imageBuffer, mediaType) {
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
    const err = new Error('Food analysis failed. Please try again.');
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
      items: [],
      total_calories: null,
      total_protein_g: null,
      total_carbs_g: null,
      total_fat_g: null,
      meal_type: null,
      parse_error: true
    };
  }

  return {
    module: 'food',
    title: 'Food Calorie Counter',
    status: 'success',
    data: {
      meal_type: extracted.meal_type ?? null,
      items: Array.isArray(extracted.items) ? extracted.items : [],
      total_calories: extracted.total_calories ?? null,
      total_protein_g: extracted.total_protein_g ?? null,
      total_carbs_g: extracted.total_carbs_g ?? null,
      total_fat_g: extracted.total_fat_g ?? null,
      ...(extracted.parse_error ? { note: 'Could not fully read the image — results may be incomplete.' } : {})
    }
  };
}

module.exports = { analyzeFood };
