const express = require('express');
const multer = require('multer');
const { classifyImage } = require('../analyzers/router');
const { runStub } = require('../analyzers/stubs');
const { analyzeReceipt } = require('../analyzers/receipt');
const { analyzeFood } = require('../analyzers/food');
const { analyzeWaste } = require('../analyzers/waste');
const { analyzeMath } = require('../analyzers/math');
const { analyzePlant } = require('../analyzers/plant');
const { analyzeCarDamage } = require('../analyzers/car_damage');
const { analyzeRoom } = require('../analyzers/room');
const cache = require('../lib/cache');

const router = express.Router();

// Store uploads in memory (never write to disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB max
  fileFilter: (_req, file, cb) => {
    // Only allow image MIME types — full signature check happens in classifyImage
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  }
});

/**
 * POST /api/analyze
 * Accepts: multipart/form-data with field "photo"
 * Returns: { category, confidence, result }
 */
router.post('/analyze', upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided. Please upload a photo.' });
    }

    // Check cache first — same image = no API call
    const cached = cache.get(req.file.buffer);
    if (cached) {
      return res.json({ ...cached, from_cache: true });
    }

    // Classify the image using Claude Vision
    const { category, confidence, mediaType } = await classifyImage(req.file.buffer);

    // Route to real analyzer or stub
    let result;
    if (category === 'receipt') {
      result = await analyzeReceipt(req.file.buffer, mediaType);
    } else if (category === 'food') {
      result = await analyzeFood(req.file.buffer, mediaType);
    } else if (category === 'waste') {
      result = await analyzeWaste(req.file.buffer, mediaType);
    } else if (category === 'math') {
      result = await analyzeMath(req.file.buffer, mediaType, 'claude-sonnet-4-6');
    } else if (category === 'plant') {
      result = await analyzePlant(req.file.buffer, mediaType);
    } else if (category === 'car_damage') {
      result = await analyzeCarDamage(req.file.buffer, mediaType);
    } else if (category === 'room') {
      result = await analyzeRoom(req.file.buffer, mediaType);
    } else {
      result = runStub(category);
    }

    const response = { category, confidence, result };

    // Save to cache for future uploads of the same image
    cache.set(req.file.buffer, response);

    return res.json(response);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
