const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const VALID_CATEGORIES = ['food', 'plant', 'receipt', 'room', 'math', 'car_damage', 'waste'];

const CLASSIFICATION_PROMPT = `You are an image classifier. Look at this image and classify it into exactly one category.

Categories:
- food: meals, ingredients, snacks, drinks, any food item
- plant: plants, flowers, trees, leaves, garden
- receipt: receipts, invoices, bills, printed paper with prices
- room: indoor spaces, rooms, furniture, interior
- math: equations, handwritten or printed math problems, formulas
- car_damage: vehicles with dents, scratches, or damage
- waste: trash, garbage, recyclables, waste materials

Respond with ONLY valid JSON in this exact format:
{"category": "<one of the categories above>", "confidence": <0.0 to 1.0>}

Do not include any other text.`;

/**
 * Validates that the image buffer is a real image by checking magic bytes.
 * Supports JPEG, PNG, GIF, WebP.
 */
function validateImageSignature(buffer) {
  if (!buffer || buffer.length < 4) return false;

  const jpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  const png = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  const gif = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
  const webp = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;

  return jpeg || png || gif || webp;
}

/**
 * Detects the media type from the buffer magic bytes.
 */
function detectMediaType(buffer) {
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'image/png';
  if (buffer[0] === 0x47 && buffer[1] === 0x49) return 'image/gif';
  if (buffer[0] === 0x52 && buffer[1] === 0x49) return 'image/webp';
  return 'image/jpeg'; // fallback
}

/**
 * Classifies the image using Claude Vision.
 * @param {Buffer} imageBuffer
 * @returns {{ category: string, confidence: number }}
 */
async function classifyImage(imageBuffer) {
  if (!validateImageSignature(imageBuffer)) {
    const err = new Error('Invalid image file. Please upload a JPEG, PNG, GIF, or WebP image.');
    err.status = 400;
    throw err;
  }

  const mediaType = detectMediaType(imageBuffer);
  const base64Image = imageBuffer.toString('base64');

  let response;
  try {
    response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64Image }
            },
            { type: 'text', text: CLASSIFICATION_PROMPT }
          ]
        }
      ]
    });
  } catch (apiError) {
    const err = new Error('AI analysis failed. Please try again.');
    err.status = 502;
    err.cause = apiError;
    throw err;
  }

  let parsed;
  try {
    const text = response.content[0]?.text?.trim() ?? '';
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    const err = new Error('Unexpected response from AI. Please try again.');
    err.status = 502;
    throw err;
  }

  const category = parsed.category?.toLowerCase();
  const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0;

  if (!VALID_CATEGORIES.includes(category)) {
    const err = new Error('Could not confidently identify the image. Try a clearer photo.');
    err.status = 422;
    throw err;
  }

  return { category, confidence, mediaType };
}

module.exports = { classifyImage };
