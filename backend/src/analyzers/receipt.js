const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const EXTRACTION_PROMPT = `Extract the following fields from this receipt image. Return ONLY valid JSON with no extra text:
{
  "merchant": "store or business name, or null",
  "address": "store address if visible, or null",
  "date": "full date and time as printed on receipt, or null",
  "tn_number": "TN# value, or null",
  "invoice_number": "INV# value, or null",
  "cashier": "cashier name, or null",
  "customer_number": number or null,
  "items": [
    { "name": "item description", "qty": 1, "price": 0.00 }
  ],
  "total": 0.00,
  "cash": 0.00,
  "change": 0.00,
  "vat_sales": 0.00,
  "vat_amount": 0.00,
  "amount_payable": 0.00,
  "transaction_number": "Transaction# value, or null",
  "currency": "currency code detected (e.g. PHP, USD)"
}

Rules:
- If a field is not visible, use null
- items array must always be present (empty array [] if no items)
- All numeric values must be numbers, not strings
- Do not include any text outside the JSON object`;

/**
 * Analyzes a receipt image and extracts structured data.
 * @param {Buffer} imageBuffer - Already validated image buffer
 * @param {string} mediaType - e.g. 'image/jpeg'
 * @returns {{ module, title, status, data }}
 */
async function analyzeReceipt(imageBuffer, mediaType) {
  const base64Image = imageBuffer.toString('base64');

  let response;
  try {
    response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
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
    const err = new Error('Receipt analysis failed. Please try again.');
    err.status = 502;
    err.cause = apiError;
    throw err;
  }

  let extracted;
  try {
    const text = response.content[0]?.text?.trim() ?? '';
    // Strip markdown code fences if Claude wraps the JSON
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    extracted = JSON.parse(cleaned);
  } catch {
    // Return best-effort result if JSON parsing fails
    extracted = {
      merchant: null,
      date: null,
      items: [],
      subtotal: null,
      tax: null,
      total: null,
      payment_method: null,
      currency: null,
      parse_error: true
    };
  }

  return {
    module: 'receipt',
    title: 'Receipt Scanner',
    status: 'success',
    data: {
      merchant: extracted.merchant ?? null,
      address: extracted.address ?? null,
      date: extracted.date ?? null,
      tn_number: extracted.tn_number ?? null,
      invoice_number: extracted.invoice_number ?? null,
      cashier: extracted.cashier ?? null,
      customer_number: extracted.customer_number ?? null,
      items: Array.isArray(extracted.items) ? extracted.items : [],
      total: extracted.total ?? null,
      cash: extracted.cash ?? null,
      change: extracted.change ?? null,
      vat_sales: extracted.vat_sales ?? null,
      vat_amount: extracted.vat_amount ?? null,
      amount_payable: extracted.amount_payable ?? null,
      transaction_number: extracted.transaction_number ?? null,
      currency: extracted.currency ?? null,
      ...(extracted.parse_error ? { note: 'Could not fully read receipt — results may be incomplete.' } : {})
    }
  };
}

module.exports = { analyzeReceipt };
