/**
 * Image Service
 * Uses Google Custom Search API (searchType=image) to fetch profile images.
 * Falls back to stub URLs when API key is not configured.
 */

const fetch = require('node-fetch');

const FALLBACK_IMAGES = {
  willneff: 'https://static-cdn.jtvnw.net/jtv_user_pictures/willneff-profile_image-3f6e5e8c0f7a5b7b-300x300.jpeg',
  'will neff': 'https://static-cdn.jtvnw.net/jtv_user_pictures/willneff-profile_image-3f6e5e8c0f7a5b7b-300x300.jpeg',
  pokimane: 'https://static-cdn.jtvnw.net/jtv_user_pictures/pokimane-profile_image-6b1ddd3d7d81a8c0-300x300.jpeg',
  'imane anys': 'https://static-cdn.jtvnw.net/jtv_user_pictures/pokimane-profile_image-6b1ddd3d7d81a8c0-300x300.jpeg',
  valkyrae: 'https://yt3.googleusercontent.com/ytc/APkrFKb3e-t0s7pNq5j5y8sZ5lWjSO9h0tMjQvZK-NzA=s240-c-k-c0x00ffffff-no-rj',
  'rachell hofstetter': 'https://yt3.googleusercontent.com/ytc/APkrFKb3e-t0s7pNq5j5y8sZ5lWjSO9h0tMjQvZK-NzA=s240-c-k-c0x00ffffff-no-rj',
};

async function fetchImageForEntity(name) {
  const nameLower = name.toLowerCase().trim();

  // Use fallback for known streamers
  if (FALLBACK_IMAGES[nameLower]) {
    return FALLBACK_IMAGES[nameLower];
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || apiKey === 'your_google_api_key_here' || !cx || cx === 'your_search_engine_id_here') {
    return null; // No API key configured
  }

  try {
    const query = encodeURIComponent(`${name} streamer`);
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${query}&searchType=image&num=1&safe=active`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      return data.items[0].link;
    }
  } catch (err) {
    console.error('Image fetch error:', err.message);
  }

  return null;
}

module.exports = { fetchImageForEntity };
