const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const EXTRACTION_PROMPT = `You are a math tutor. Look at this image and read the math problem or equation shown.
Solve it completely, showing every step clearly.
Return ONLY valid JSON with no extra text:
{
  "problem": "the exact equation or problem as written in the image",
  "problem_type": "arithmetic, algebra, geometry, trigonometry, calculus, statistics, word problem, or other",
  "steps": [
    {
      "step": 1,
      "description": "plain English explanation of what we are doing in this step",
      "expression": "the mathematical expression or result at this step"
    }
  ],
  "answer": "the final answer as a value or expression",
  "answer_unit": "unit of measurement if applicable e.g. cm, m², kg — or null",
  "explanation": "2-3 sentence plain English summary of the overall solution approach"
}

Rules:
- Read the problem exactly as written, even if handwritten
- Show every step — do not skip steps
- Each step must have both a plain English description AND the math expression
- If the image has multiple problems, solve only the first/main one
- If the problem cannot be read clearly, set problem to what you can see and explain in steps
- Do not include any text outside the JSON object`;

/**
 * Analyzes a math problem image and returns step-by-step solution.
 * @param {Buffer} imageBuffer
 * @param {string} mediaType
 * @returns {{ module, title, status, data }}
 */
async function analyzeMath(imageBuffer, mediaType, model = 'claude-haiku-4-5-20251001') {
  const base64Image = imageBuffer.toString('base64');

  let response;
  try {
    response = await client.messages.create({
      model,
      max_tokens: 2048,
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
    const err = new Error('Math analysis failed. Please try again.');
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
      problem: null,
      problem_type: null,
      steps: [],
      answer: null,
      answer_unit: null,
      explanation: null,
      parse_error: true
    };
  }

  return {
    module: 'math',
    title: 'Math Problem Solver',
    status: 'success',
    data: {
      problem: extracted.problem ?? null,
      problem_type: extracted.problem_type ?? null,
      steps: Array.isArray(extracted.steps) ? extracted.steps : [],
      answer: extracted.answer ?? null,
      answer_unit: extracted.answer_unit ?? null,
      explanation: extracted.explanation ?? null,
      ...(extracted.parse_error ? { note: 'Could not fully read the problem — results may be incomplete.' } : {})
    }
  };
}

module.exports = { analyzeMath };
