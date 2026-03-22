const https = require('https');

// In-memory cache for price lookups — avoids duplicate Serpapi calls
const priceCache = new Map();

/**
 * Search Google Shopping PH via Serpapi for real Philippine market prices.
 * @param {string} query - item name/brand/model to search
 * @returns {{ min_php, max_php, avg_php, top_result } | null}
 */
async function searchPHPrice(query) {
  if (!process.env.SERPAPI_KEY) return null;
  if (!query || query.trim().length < 3) return null;

  const cacheKey = query.toLowerCase().trim();
  if (priceCache.has(cacheKey)) return priceCache.get(cacheKey);

  const params = new URLSearchParams({
    engine:   'google_shopping',
    q:        query,
    gl:       'ph',   // Philippines locale
    hl:       'en',
    api_key:  process.env.SERPAPI_KEY,
    num:      '5',
  });

  return new Promise((resolve) => {
    const url = `https://serpapi.com/search.json?${params}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const results = json.shopping_results || [];

          if (results.length === 0) {
            priceCache.set(cacheKey, null);
            return resolve(null);
          }

          // Extract numeric prices (already in PHP from Google PH)
          const prices = results
            .filter(r => r.price)
            .map(r => parseFloat(r.price.replace(/[^0-9.]/g, '')))
            .filter(p => !isNaN(p) && p > 0);

          if (prices.length === 0) {
            priceCache.set(cacheKey, null);
            return resolve(null);
          }

          const min = Math.min(...prices);
          const max = Math.max(...prices);
          const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

          const top = results[0];
          const result = {
            min_php: Math.round(min),
            max_php: Math.round(max),
            avg_php: Math.round(avg),
            source:  'Google Shopping PH',
            top_result: top ? {
              title:  top.title,
              price:  top.price,
              store:  top.source,
              link:   top.link ?? null,
              thumbnail: top.thumbnail ?? null,
            } : null,
          };

          priceCache.set(cacheKey, result);
          resolve(result);
        } catch {
          priceCache.set(cacheKey, null);
          resolve(null);
        }
      });
    }).on('error', () => {
      resolve(null);
    });
  });
}

module.exports = { searchPHPrice };
