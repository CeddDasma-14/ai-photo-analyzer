'use strict';

const { IncomingForm } = require('formidable');
const fs = require('fs/promises');
const { classifyImage }   = require('../backend/src/analyzers/router');
const { analyzeReceipt }  = require('../backend/src/analyzers/receipt');
const { analyzeFood }     = require('../backend/src/analyzers/food');
const { analyzeWaste }    = require('../backend/src/analyzers/waste');
const { analyzeMath }     = require('../backend/src/analyzers/math');
const { analyzePlant }    = require('../backend/src/analyzers/plant');
const { analyzeCarDamage }= require('../backend/src/analyzers/car_damage');
const { analyzeRoom }     = require('../backend/src/analyzers/room');
const { runStub }         = require('../backend/src/analyzers/stubs');

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB (safe under Vercel's 4.5MB limit)

module.exports = async function handler(req, res) {
  // Rate limiting headers (Vercel handles DDoS at edge level)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const form = new IncomingForm({
      maxFileSize: MAX_FILE_SIZE,
      maxFiles: 1,
      filter: ({ mimetype }) => !!mimetype?.startsWith('image/'),
    });

    const [, files] = await form.parse(req);
    const file = files.photo?.[0];

    if (!file) {
      return res.status(400).json({ error: 'No image provided. Please upload a photo.' });
    }

    const buffer   = await fs.readFile(file.filepath);
    const { category, confidence, mediaType } = await classifyImage(buffer);

    let result;
    if      (category === 'receipt')    result = await analyzeReceipt(buffer, mediaType);
    else if (category === 'food')       result = await analyzeFood(buffer, mediaType);
    else if (category === 'waste')      result = await analyzeWaste(buffer, mediaType);
    else if (category === 'math')       result = await analyzeMath(buffer, mediaType, 'claude-sonnet-4-6');
    else if (category === 'plant')      result = await analyzePlant(buffer, mediaType);
    else if (category === 'car_damage') result = await analyzeCarDamage(buffer, mediaType);
    else if (category === 'room')       result = await analyzeRoom(buffer, mediaType);
    else                                result = runStub(category);

    return res.json({ category, confidence, result });
  } catch (err) {
    console.error('[analyze]', err.message);
    if (err.code === 1009 || err.message?.includes('maxFileSize')) {
      return res.status(413).json({ error: 'File too large. Maximum size is 4MB when using the hosted version.' });
    }
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

module.exports.config = {
  api: { bodyParser: false },
};
