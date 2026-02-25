// Embedded seed data for demo / GitHub Pages static mode.
// Mirrors server/db/seed.js output exactly.

function makeTrend(base, volatility, months = 24) {
  const data = [];
  let current = base;
  const now = new Date(2026, 1, 1); // fixed date for reproducibility
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    // deterministic pseudo-random using index
    const r = ((Math.sin(base * 9.301 + i * 0.9) + 1) / 2);
    current = Math.max(10, current + (r - 0.45) * volatility);
    data.push({ month, value: Math.round(current) });
  }
  return data;
}

export const CLIENTS = [
  {
    id: 1, name: 'WillNeff', display_name: 'Will Neff',
    image_url: 'https://static-cdn.jtvnw.net/jtv_user_pictures/willneff-profile_image-3f6e5e8c0f7a5b7b-300x300.jpeg',
    category: 'Gaming/Entertainment', platform: 'Twitch', org: '100 Thieves',
    added_date: '2021-01-01',
    notes: 'Known for variety streaming, comedy, and strong ethical stances on brand partnerships.',
    activeBrandCount: 0, controversyCount: 1, worstSeverity: 'high',
  },
  {
    id: 2, name: 'Pokimane', display_name: 'Pokimane (Imane Anys)',
    image_url: 'https://static-cdn.jtvnw.net/jtv_user_pictures/pokimane-profile_image-6b1ddd3d7d81a8c0-300x300.jpeg',
    category: 'Gaming/Lifestyle', platform: 'Both', org: null,
    added_date: '2020-01-01',
    notes: 'One of the most-followed female streamers. Founded Myna Snacks (now defunct).',
    activeBrandCount: 2, controversyCount: 1, worstSeverity: 'high',
  },
  {
    id: 3, name: 'Valkyrae', display_name: 'Valkyrae (Rachell Hofstetter)',
    image_url: 'https://yt3.googleusercontent.com/ytc/APkrFKb3e-t0s7pNq5j5y8sZ5lWjSO9h0tMjQvZK-NzA=s240-c-k-c0x00ffffff-no-rj',
    category: 'Gaming/Lifestyle', platform: 'YouTube', org: '100 Thieves',
    added_date: '2020-06-01',
    notes: 'Co-owner of 100 Thieves. RFLCT skincare controversy (2021). Later became Gymshark ambassador.',
    activeBrandCount: 1, controversyCount: 1, worstSeverity: 'critical',
  },
];

export const BRANDS = [
  {
    id: 1, name: 'HelloFresh', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/HelloFresh_Logo.svg/320px-HelloFresh_Logo.svg.png',
    categories: ['Meal Kits','Food Delivery','Grocery','Subscription Services','E-Commerce'],
    parent_categories: ['Food','Tech'], primary_category: 'Meal Kits', added_date: '2020-06-01',
  },
  {
    id: 2, name: 'Myna Snacks', logo_url: '',
    categories: ['Snacks & Food','E-Commerce'],
    parent_categories: ['Food','Tech'], primary_category: 'Snacks & Food', added_date: '2023-11-01',
  },
  {
    id: 3, name: 'RFLCT', logo_url: '',
    categories: ['Skincare','Health & Beauty','Personal Care'],
    parent_categories: ['Beauty','Health'], primary_category: 'Skincare', added_date: '2021-10-01',
  },
  {
    id: 4, name: 'Gymshark', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Gymshark_logo.svg/320px-Gymshark_logo.svg.png',
    categories: ['Fitness','Clothing','Athleisure','Health & Wellness'],
    parent_categories: ['Lifestyle','Health','Fashion'], primary_category: 'Fitness', added_date: '2023-01-01',
  },
  {
    id: 5, name: 'GFuel', logo_url: '',
    categories: ['Energy Drinks','Gaming Peripherals','Supplements','Snacks & Food'],
    parent_categories: ['Health','Gaming','Food'], primary_category: 'Energy Drinks', added_date: '2020-01-01',
  },
];

export const RELATIONSHIPS = [
  { id: 1, client_id: 1, brand_id: 1, brand_name: 'HelloFresh', logo_url: BRANDS[0].logo_url, categories: BRANDS[0].categories, parent_categories: BRANDS[0].parent_categories, primary_category: 'Meal Kits', status: 'ended', start_date: '2021-01-01', end_date: '2021-11-01', end_reason: "WillNeff publicly ended partnership after learning about HelloFresh's anti-union labor practices, including spending thousands per day on union-busting consultants at their warehouses. Workers in Aurora, CO and Richmond, CA had been organizing with UNITE-HERE.", end_reason_source_url: 'https://dotesports.com/streaming/news/will-neff-ends-partnership-with-hellofresh-over-labor-concerns', is_public_end: 1, ended_by: 'client' },
  { id: 2, client_id: 2, brand_id: 2, brand_name: 'Myna Snacks', logo_url: '', categories: BRANDS[1].categories, parent_categories: BRANDS[1].parent_categories, primary_category: 'Snacks & Food', status: 'ended', start_date: '2023-11-01', end_date: '2025-01-01', end_reason: 'Myna Snacks quietly shut down by late 2025. Products became unavailable, CEO moved to Jones Soda Co.', end_reason_source_url: '', is_public_end: 0, ended_by: 'unknown' },
  { id: 3, client_id: 2, brand_id: 5, brand_name: 'GFuel', logo_url: '', categories: BRANDS[4].categories, parent_categories: BRANDS[4].parent_categories, primary_category: 'Energy Drinks', status: 'active', start_date: '2020-03-01', end_date: null, end_reason: null, end_reason_source_url: null, is_public_end: 0, ended_by: 'unknown' },
  { id: 4, client_id: 3, brand_id: 3, brand_name: 'RFLCT', logo_url: '', categories: BRANDS[2].categories, parent_categories: BRANDS[2].parent_categories, primary_category: 'Skincare', status: 'ended', start_date: '2021-10-01', end_date: '2021-10-14', end_reason: 'RFLCT skincare brand shut down less than 2 weeks after launch amid scientific community backlash over unsubstantiated blue-light skin damage claims. Pulled from 400+ Ulta Beauty stores.', end_reason_source_url: '', is_public_end: 1, ended_by: 'mutual' },
  { id: 5, client_id: 3, brand_id: 4, brand_name: 'Gymshark', logo_url: BRANDS[3].logo_url, categories: BRANDS[3].categories, parent_categories: BRANDS[3].parent_categories, primary_category: 'Fitness', status: 'active', start_date: '2023-03-01', end_date: null, end_reason: null, end_reason_source_url: null, is_public_end: 0, ended_by: 'unknown' },
];

export const CONTROVERSIES = [
  {
    id: 1, client_id: 1, brand_id: 1,
    title: 'HelloFresh Anti-Union Labor Practices',
    summary: "WillNeff ended his HelloFresh partnership after discovering the company was spending thousands per day on union-busting consultants at their warehouses. Workers at facilities in Aurora, CO and Richmond, CA had been organizing with UNITE-HERE. Hasan Piker and H3H3 Leftovers podcast also cut ties around the same time.",
    source_url: 'https://dotesports.com/streaming/news/will-neff-ends-partnership-with-hellofresh-over-labor-concerns',
    date_found: '2021-11-01', date_occurred: '2021-11-01', severity: 'high',
    category: 'Meal Kits',
    relevance_to_brands: ['Meal Kits','Food Delivery','Grocery','Subscription Services'],
  },
  {
    id: 2, client_id: 2, brand_id: 2,
    title: 'Myna Snacks / Midnight Mini Cookies Rebrand Controversy',
    summary: "Pokimane launched Myna Snacks in November 2023, selling 'Midnight Mini Cookies' at $28 for 4 bags. Critics pointed out the product appeared to be a rebranded version of Toatzy Midnight Mini Cookies sold at Costco for $9.99 — both made by Creation Foods. When fans called out the pricing, Pokimane called critics 'broke boys' on stream, then later issued an apology. The brand quietly shut down by late 2025.",
    source_url: '', date_found: '2023-11-01', date_occurred: '2023-11-01', severity: 'high',
    category: 'Snacks & Food',
    relevance_to_brands: ['Snacks & Food','Food Delivery','Meal Kits','Grocery','Beverages'],
  },
  {
    id: 3, client_id: 3, brand_id: 3,
    title: 'RFLCT Skincare Blue-Light Scam Controversy',
    summary: "In October 2021, Valkyrae launched RFLCT, a skincare line claiming to protect against blue light from screens. Scientists and dermatologists widely disputed the premise. The community called it a scam. Valkyrae admitted she 'never been to the lab.' RFLCT refused to publish their studies. The brand was pulled from 400+ Ulta Beauty stores and shut down less than 2 weeks after launch.",
    source_url: '', date_found: '2021-10-01', date_occurred: '2021-10-01', severity: 'critical',
    category: 'Skincare',
    relevance_to_brands: ['Skincare','Makeup','Health & Beauty','Personal Care','Haircare','Fragrance'],
  },
];

export const SPONSORSHIPS = [
  { id: 1, client_id: 1, brand_name: 'HelloFresh', brand_category: 'Meal Kits', status: 'ended', start_date: '2021-01-01', end_date: '2021-11-01', end_reason: 'Client ended over anti-union labor practices', source_url: 'https://dotesports.com/streaming/news/will-neff-ends-partnership-with-hellofresh-over-labor-concerns', is_verified: 1 },
  { id: 2, client_id: 1, brand_name: 'Battlefy', brand_category: 'Esports', status: 'ended', start_date: '2020-06-01', end_date: '2022-01-01', end_reason: 'Ended publicly — reason not cited', source_url: '', is_verified: 1 },
  { id: 3, client_id: 1, brand_name: 'Ridge Wallet', brand_category: 'Accessories', status: 'ended', start_date: '2021-03-01', end_date: '2022-06-01', end_reason: 'Status unknown', source_url: '', is_verified: 0 },
  { id: 4, client_id: 2, brand_name: 'Postmates', brand_category: 'Food Delivery', status: 'ended', start_date: '2019-01-01', end_date: '2021-12-01', end_reason: 'Postmates acquired by Uber Eats, partnership dissolved', source_url: '', is_verified: 1 },
  { id: 5, client_id: 2, brand_name: 'GFuel', brand_category: 'Energy Drinks', status: 'active', start_date: '2020-03-01', end_date: null, end_reason: null, source_url: '', is_verified: 1 },
  { id: 6, client_id: 2, brand_name: 'Myna Snacks', brand_category: 'Snacks & Food', status: 'ended', start_date: '2023-11-01', end_date: '2025-01-01', end_reason: 'Brand shut down, products unavailable', source_url: '', is_verified: 1 },
  { id: 7, client_id: 2, brand_name: 'Amazon', brand_category: 'E-Commerce', status: 'active', start_date: '2020-01-01', end_date: null, end_reason: null, source_url: '', is_verified: 1 },
  { id: 8, client_id: 3, brand_name: 'RFLCT', brand_category: 'Skincare', status: 'ended', start_date: '2021-10-01', end_date: '2021-10-14', end_reason: 'Brand shut down amid scientific community backlash over unsubstantiated blue-light claims', source_url: '', is_verified: 1 },
  { id: 9, client_id: 3, brand_name: 'Gymshark', brand_category: 'Fitness', status: 'active', start_date: '2023-03-01', end_date: null, end_reason: null, source_url: '', is_verified: 1 },
  { id: 10, client_id: 3, brand_name: 'Logitech', brand_category: 'Gaming Peripherals', status: 'ended', start_date: '2020-01-01', end_date: '2023-01-01', end_reason: 'Ended publicly — reason not cited', source_url: '', is_verified: 1 },
];

export const SEO_DATA = {
  client: {
    1: [{ id: 1, entity_id: 1, entity_type: 'client', keyword: 'WillNeff', search_volume: 210000, trend_data: makeTrend(42, 18) }, { id: 2, entity_id: 1, entity_type: 'client', keyword: 'Will Neff stream', search_volume: 48000, trend_data: makeTrend(35, 20) }],
    2: [{ id: 3, entity_id: 2, entity_type: 'client', keyword: 'Pokimane', search_volume: 2200000, trend_data: makeTrend(85, 12) }, { id: 4, entity_id: 2, entity_type: 'client', keyword: 'Pokimane stream', search_volume: 450000, trend_data: makeTrend(70, 15) }, { id: 5, entity_id: 2, entity_type: 'client', keyword: 'Pokimane Myna Snacks', search_volume: 90000, trend_data: makeTrend(30, 20) }],
    3: [{ id: 6, entity_id: 3, entity_type: 'client', keyword: 'Valkyrae', search_volume: 880000, trend_data: makeTrend(62, 14) }, { id: 7, entity_id: 3, entity_type: 'client', keyword: 'Valkyrae 100 Thieves', search_volume: 180000, trend_data: makeTrend(50, 12) }, { id: 8, entity_id: 3, entity_type: 'client', keyword: 'Valkyrae RFLCT', search_volume: 55000, trend_data: makeTrend(20, 25) }],
  },
  brand: {
    1: [{ id: 9, entity_id: 1, entity_type: 'brand', keyword: 'HelloFresh', search_volume: 1500000, trend_data: makeTrend(75, 10) }],
    2: [{ id: 10, entity_id: 2, entity_type: 'brand', keyword: 'Myna Snacks', search_volume: 90000, trend_data: makeTrend(40, 22) }],
    3: [{ id: 11, entity_id: 3, entity_type: 'brand', keyword: 'RFLCT', search_volume: 55000, trend_data: makeTrend(25, 30) }],
    4: [{ id: 12, entity_id: 4, entity_type: 'brand', keyword: 'Gymshark', search_volume: 1200000, trend_data: makeTrend(72, 8) }],
    5: [{ id: 13, entity_id: 5, entity_type: 'brand', keyword: 'GFuel', search_volume: 550000, trend_data: makeTrend(60, 12) }],
  },
};
