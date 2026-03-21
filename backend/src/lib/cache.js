const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(__dirname, '../../.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'results.json');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function load() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    }
  } catch {
    // Corrupt cache — start fresh
  }
  return {};
}

function save(store) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(store, null, 2));
  } catch {
    // Non-fatal — cache write failure just means no saving this time
  }
}

/**
 * Returns a SHA256 hash of the image buffer plus an optional salt string.
 * Salt is used to differentiate results for the same image with different options (e.g. math model).
 */
function hashImage(buffer, salt = '') {
  return crypto.createHash('sha256').update(buffer).update(salt).digest('hex');
}

/**
 * Get a cached result by image hash. Returns null if not found.
 * @param {Buffer} imageBuffer
 * @param {string} [salt] - optional string to vary the cache key (e.g. model name)
 */
function get(imageBuffer, salt = '') {
  const hash = hashImage(imageBuffer, salt);
  const store = load();
  return store[hash] ?? null;
}

/**
 * Save a result to cache keyed by image hash.
 * @param {Buffer} imageBuffer
 * @param {*} result
 * @param {string} [salt] - must match the salt used in get()
 */
function set(imageBuffer, result, salt = '') {
  const hash = hashImage(imageBuffer, salt);
  const store = load();
  store[hash] = { ...result, cached_at: new Date().toISOString() };
  save(store);
}

module.exports = { get, set };
