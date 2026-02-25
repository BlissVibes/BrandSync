const { initSchema, getDb } = require('./schema');

// Category taxonomy
const CATEGORY_TAXONOMY = {
  Food: ['Meal Kits', 'Food Delivery', 'Snacks & Food', 'Restaurants', 'Grocery', 'Beverages'],
  Beauty: ['Skincare', 'Makeup', 'Health & Beauty', 'Personal Care', 'Haircare', 'Fragrance'],
  Gaming: ['Gaming Peripherals', 'Gaming Chairs', 'Game Publishers', 'Esports', 'Streaming Tools'],
  Tech: ['Software', 'Hardware', 'Streaming Platforms', 'Apps', 'E-Commerce', 'Subscription Services'],
  Lifestyle: ['Clothing', 'Fitness', 'Home Goods', 'Athleisure', 'Travel'],
  Health: ['Supplements', 'Wellness', 'Health & Wellness', 'Personal Care', 'Energy Drinks'],
  Fashion: ['Clothing', 'Accessories', 'Athleisure', 'Luxury Goods'],
  Finance: ['Financial Services', 'Crypto', 'Investing', 'Banking'],
  Entertainment: ['Media', 'Music', 'Film', 'Events'],
};

function deriveParentCategories(categories) {
  const parents = new Set();
  for (const cat of categories) {
    for (const [parent, subcats] of Object.entries(CATEGORY_TAXONOMY)) {
      if (subcats.includes(cat)) {
        parents.add(parent);
      }
    }
  }
  return [...parents];
}

function seed() {
  initSchema();
  const db = getDb();

  // Clear existing data
  db.exec(`
    DELETE FROM sponsorship_history;
    DELETE FROM controversies;
    DELETE FROM seo_data;
    DELETE FROM client_brand_relationships;
    DELETE FROM brands;
    DELETE FROM clients;
    DELETE FROM sqlite_sequence WHERE name IN ('clients','brands','client_brand_relationships','seo_data','controversies','sponsorship_history');
  `);

  console.log('Seeding clients...');

  // --- CLIENTS ---
  const insertClient = db.prepare(`
    INSERT INTO clients (name, display_name, image_url, category, platform, org, added_date, notes)
    VALUES (@name, @display_name, @image_url, @category, @platform, @org, @added_date, @notes)
  `);

  const willneff = insertClient.run({
    name: 'WillNeff',
    display_name: 'Will Neff',
    image_url: 'https://static-cdn.jtvnw.net/jtv_user_pictures/willneff-profile_image-3f6e5e8c0f7a5b7b-300x300.jpeg',
    category: 'Gaming/Entertainment',
    platform: 'Twitch',
    org: '100 Thieves',
    added_date: '2021-01-01',
    notes: 'Known for variety streaming, comedy, and strong ethical stances on brand partnerships.',
  });

  const pokimane = insertClient.run({
    name: 'Pokimane',
    display_name: 'Pokimane (Imane Anys)',
    image_url: 'https://static-cdn.jtvnw.net/jtv_user_pictures/pokimane-profile_image-6b1ddd3d7d81a8c0-300x300.jpeg',
    category: 'Gaming/Lifestyle',
    platform: 'Both',
    org: null,
    added_date: '2020-01-01',
    notes: 'One of the most-followed female streamers. Founded Myna Snacks (now defunct). Broad appeal across gaming and lifestyle.',
  });

  const valkyrae = insertClient.run({
    name: 'Valkyrae',
    display_name: 'Valkyrae (Rachell Hofstetter)',
    image_url: 'https://yt3.googleusercontent.com/ytc/APkrFKb3e-t0s7pNq5j5y8sZ5lWjSO9h0tMjQvZK-NzA=s240-c-k-c0x00ffffff-no-rj',
    category: 'Gaming/Lifestyle',
    platform: 'YouTube',
    org: '100 Thieves',
    added_date: '2020-06-01',
    notes: 'Co-owner of 100 Thieves. YouTube exclusive. RFLCT skincare controversy (2021). Later became Gymshark ambassador.',
  });

  const willneffId = willneff.lastInsertRowid;
  const pokimaneId = pokimane.lastInsertRowid;
  const valkyraeId = valkyrae.lastInsertRowid;

  console.log('Seeding brands...');

  // --- BRANDS ---
  const insertBrand = db.prepare(`
    INSERT INTO brands (name, logo_url, categories, parent_categories, primary_category, added_date)
    VALUES (@name, @logo_url, @categories, @parent_categories, @primary_category, @added_date)
  `);

  const hellofreshCats = ['Meal Kits', 'Food Delivery', 'Grocery', 'Subscription Services', 'E-Commerce'];
  const hellofreshParents = deriveParentCategories(hellofreshCats);
  const hellofresh = insertBrand.run({
    name: 'HelloFresh',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/HelloFresh_Logo.svg/320px-HelloFresh_Logo.svg.png',
    categories: JSON.stringify(hellofreshCats),
    parent_categories: JSON.stringify(hellofreshParents),
    primary_category: 'Meal Kits',
    added_date: '2020-06-01',
  });

  const mynaCats = ['Snacks & Food', 'E-Commerce'];
  const mynaParents = deriveParentCategories(mynaCats);
  const mynaSnacks = insertBrand.run({
    name: 'Myna Snacks',
    logo_url: '',
    categories: JSON.stringify(mynaCats),
    parent_categories: JSON.stringify(mynaParents),
    primary_category: 'Snacks & Food',
    added_date: '2023-11-01',
  });

  const rflctCats = ['Skincare', 'Health & Beauty', 'Personal Care'];
  const rflctParents = deriveParentCategories(rflctCats);
  const rflct = insertBrand.run({
    name: 'RFLCT',
    logo_url: '',
    categories: JSON.stringify(rflctCats),
    parent_categories: JSON.stringify(rflctParents),
    primary_category: 'Skincare',
    added_date: '2021-10-01',
  });

  const gymsharkCats = ['Fitness', 'Clothing', 'Athleisure', 'Health & Wellness'];
  const gymsharkParents = deriveParentCategories(gymsharkCats);
  const gymshark = insertBrand.run({
    name: 'Gymshark',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Gymshark_logo.svg/320px-Gymshark_logo.svg.png',
    categories: JSON.stringify(gymsharkCats),
    parent_categories: JSON.stringify(gymsharkParents),
    primary_category: 'Fitness',
    added_date: '2023-01-01',
  });

  const gfuelCats = ['Energy Drinks', 'Gaming Peripherals', 'Supplements', 'Snacks & Food'];
  const gfuelParents = deriveParentCategories(gfuelCats);
  const gfuel = insertBrand.run({
    name: 'GFuel',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/G_FUEL_logo.svg/320px-G_FUEL_logo.svg.png',
    categories: JSON.stringify(gfuelCats),
    parent_categories: JSON.stringify(gfuelParents),
    primary_category: 'Energy Drinks',
    added_date: '2020-01-01',
  });

  const hellofreshId = hellofresh.lastInsertRowid;
  const mynaSnacksId = mynaSnacks.lastInsertRowid;
  const rflctId = rflct.lastInsertRowid;
  const gymsharkId = gymshark.lastInsertRowid;
  const gfuelId = gfuel.lastInsertRowid;

  console.log('Seeding relationships...');

  // --- RELATIONSHIPS ---
  const insertRel = db.prepare(`
    INSERT INTO client_brand_relationships
      (client_id, brand_id, status, start_date, end_date, end_reason, end_reason_source_url, is_public_end, ended_by)
    VALUES
      (@client_id, @brand_id, @status, @start_date, @end_date, @end_reason, @end_reason_source_url, @is_public_end, @ended_by)
  `);

  // WillNeff + HelloFresh (ENDED)
  insertRel.run({
    client_id: willneffId,
    brand_id: hellofreshId,
    status: 'ended',
    start_date: '2021-01-01',
    end_date: '2021-11-01',
    end_reason: "WillNeff publicly ended partnership after learning about HelloFresh's anti-union labor practices, including spending thousands per day on union-busting consultants at their warehouses. Workers in Aurora, CO and Richmond, CA had been organizing with UNITE-HERE.",
    end_reason_source_url: 'https://dotesports.com/streaming/news/will-neff-ends-partnership-with-hellofresh-over-labor-concerns',
    is_public_end: 1,
    ended_by: 'client',
  });

  // Pokimane + Myna Snacks (ENDED)
  insertRel.run({
    client_id: pokimaneId,
    brand_id: mynaSnacksId,
    status: 'ended',
    start_date: '2023-11-01',
    end_date: '2025-01-01',
    end_reason: 'Myna Snacks quietly shut down by late 2025. Products became unavailable, CEO moved to Jones Soda Co. Brand was controversial from launch due to price comparisons with similar Costco products.',
    end_reason_source_url: '',
    is_public_end: 0,
    ended_by: 'unknown',
  });

  // Pokimane + GFuel (ACTIVE)
  insertRel.run({
    client_id: pokimaneId,
    brand_id: gfuelId,
    status: 'active',
    start_date: '2020-03-01',
    end_date: null,
    end_reason: null,
    end_reason_source_url: null,
    is_public_end: 0,
    ended_by: 'unknown',
  });

  // Valkyrae + RFLCT (ENDED)
  insertRel.run({
    client_id: valkyraeId,
    brand_id: rflctId,
    status: 'ended',
    start_date: '2021-10-01',
    end_date: '2021-10-14',
    end_reason: 'RFLCT skincare brand shut down less than 2 weeks after launch amid scientific community backlash over unsubstantiated blue-light skin damage claims. Pulled from 400+ Ulta Beauty stores. Valkyrae publicly separated from the brand.',
    end_reason_source_url: '',
    is_public_end: 1,
    ended_by: 'mutual',
  });

  // Valkyrae + Gymshark (ACTIVE)
  insertRel.run({
    client_id: valkyraeId,
    brand_id: gymsharkId,
    status: 'active',
    start_date: '2023-03-01',
    end_date: null,
    end_reason: null,
    end_reason_source_url: null,
    is_public_end: 0,
    ended_by: 'unknown',
  });

  console.log('Seeding controversies...');

  // --- CONTROVERSIES ---
  const insertControversy = db.prepare(`
    INSERT INTO controversies
      (client_id, brand_id, title, summary, source_url, date_found, date_occurred, severity, category, relevance_to_brands)
    VALUES
      (@client_id, @brand_id, @title, @summary, @source_url, @date_found, @date_occurred, @severity, @category, @relevance_to_brands)
  `);

  // WillNeff / HelloFresh labor controversy
  insertControversy.run({
    client_id: willneffId,
    brand_id: hellofreshId,
    title: 'HelloFresh Anti-Union Labor Practices',
    summary: "WillNeff ended his HelloFresh partnership after discovering the company was spending thousands per day on union-busting consultants at their warehouses. Workers at facilities in Aurora, CO and Richmond, CA had been organizing with UNITE-HERE. WillNeff cited this as ethically incompatible with his values. Hasan Piker and H3H3 Leftovers podcast also cut ties around the same time for the same reason.",
    source_url: 'https://dotesports.com/streaming/news/will-neff-ends-partnership-with-hellofresh-over-labor-concerns',
    date_found: '2021-11-01',
    date_occurred: '2021-11-01',
    severity: 'high',
    category: 'Meal Kits',
    relevance_to_brands: JSON.stringify(['Meal Kits', 'Food Delivery', 'Grocery', 'Subscription Services']),
  });

  // Pokimane / Myna Snacks controversy
  insertControversy.run({
    client_id: pokimaneId,
    brand_id: mynaSnacksId,
    title: 'Myna Snacks / Midnight Mini Cookies Rebrand Controversy',
    summary: "Pokimane launched Myna Snacks in November 2023, selling 'Midnight Mini Cookies' at $28 for 4 bags. Critics pointed out the product appeared to be a rebranded version of Toatzy Midnight Mini Cookies sold at Costco for $9.99 for a larger quantity — both made by Creation Foods. When fans called out the pricing, Pokimane called critics 'broke boys' on stream, then later issued an apology. The brand appeared to quietly shut down by late 2025, with products becoming unavailable and the CEO moving to Jones Soda Co.",
    source_url: '',
    date_found: '2023-11-01',
    date_occurred: '2023-11-01',
    severity: 'high',
    category: 'Snacks & Food',
    relevance_to_brands: JSON.stringify(['Snacks & Food', 'Food Delivery', 'Meal Kits', 'Grocery', 'Beverages']),
  });

  // Valkyrae / RFLCT controversy
  insertControversy.run({
    client_id: valkyraeId,
    brand_id: rflctId,
    title: 'RFLCT Skincare Blue-Light Scam Controversy',
    summary: "In October 2021, Valkyrae launched RFLCT, a skincare line claiming to protect against blue light from screens. Scientists and dermatologists widely disputed the premise, stating there is no credible evidence that screen blue light causes skin damage. The community called it a scam. Valkyrae admitted she 'never been to the lab' and had 'just seen the research.' RFLCT refused to publish their studies. The brand was pulled from 400+ Ulta Beauty stores and shut down less than 2 weeks after launch. Valkyrae publicly separated from the brand, later stating she was misled about the science.",
    source_url: '',
    date_found: '2021-10-01',
    date_occurred: '2021-10-01',
    severity: 'critical',
    category: 'Skincare',
    relevance_to_brands: JSON.stringify(['Skincare', 'Makeup', 'Health & Beauty', 'Personal Care', 'Haircare', 'Fragrance']),
  });

  console.log('Seeding SEO data...');

  // --- SEO DATA ---
  const insertSEO = db.prepare(`
    INSERT INTO seo_data (entity_id, entity_type, keyword, search_volume, trend_data, last_updated)
    VALUES (@entity_id, @entity_type, @keyword, @search_volume, @trend_data, @last_updated)
  `);

  function generateTrend(base, volatility, months = 24) {
    const data = [];
    let current = base;
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      current = Math.max(10, current + (Math.random() - 0.45) * volatility);
      data.push({ month, value: Math.round(current) });
    }
    return data;
  }

  // Pokimane - highest search volume
  insertSEO.run({
    entity_id: pokimaneId,
    entity_type: 'client',
    keyword: 'Pokimane',
    search_volume: 2200000,
    trend_data: JSON.stringify(generateTrend(85, 12)),
    last_updated: new Date().toISOString(),
  });
  insertSEO.run({
    entity_id: pokimaneId,
    entity_type: 'client',
    keyword: 'Pokimane stream',
    search_volume: 450000,
    trend_data: JSON.stringify(generateTrend(70, 15)),
    last_updated: new Date().toISOString(),
  });
  insertSEO.run({
    entity_id: pokimaneId,
    entity_type: 'client',
    keyword: 'Pokimane Myna Snacks',
    search_volume: 90000,
    trend_data: JSON.stringify(generateTrend(30, 20)),
    last_updated: new Date().toISOString(),
  });

  // Valkyrae - medium search volume
  insertSEO.run({
    entity_id: valkyraeId,
    entity_type: 'client',
    keyword: 'Valkyrae',
    search_volume: 880000,
    trend_data: JSON.stringify(generateTrend(62, 14)),
    last_updated: new Date().toISOString(),
  });
  insertSEO.run({
    entity_id: valkyraeId,
    entity_type: 'client',
    keyword: 'Valkyrae 100 Thieves',
    search_volume: 180000,
    trend_data: JSON.stringify(generateTrend(50, 12)),
    last_updated: new Date().toISOString(),
  });
  insertSEO.run({
    entity_id: valkyraeId,
    entity_type: 'client',
    keyword: 'Valkyrae RFLCT',
    search_volume: 55000,
    trend_data: JSON.stringify(generateTrend(20, 25)),
    last_updated: new Date().toISOString(),
  });

  // WillNeff - lower search volume
  insertSEO.run({
    entity_id: willneffId,
    entity_type: 'client',
    keyword: 'WillNeff',
    search_volume: 210000,
    trend_data: JSON.stringify(generateTrend(42, 18)),
    last_updated: new Date().toISOString(),
  });
  insertSEO.run({
    entity_id: willneffId,
    entity_type: 'client',
    keyword: 'Will Neff stream',
    search_volume: 48000,
    trend_data: JSON.stringify(generateTrend(35, 20)),
    last_updated: new Date().toISOString(),
  });

  // Brands SEO
  insertSEO.run({
    entity_id: hellofreshId,
    entity_type: 'brand',
    keyword: 'HelloFresh',
    search_volume: 1500000,
    trend_data: JSON.stringify(generateTrend(75, 10)),
    last_updated: new Date().toISOString(),
  });
  insertSEO.run({
    entity_id: gfuelId,
    entity_type: 'brand',
    keyword: 'GFuel',
    search_volume: 550000,
    trend_data: JSON.stringify(generateTrend(60, 12)),
    last_updated: new Date().toISOString(),
  });
  insertSEO.run({
    entity_id: gymsharkId,
    entity_type: 'brand',
    keyword: 'Gymshark',
    search_volume: 1200000,
    trend_data: JSON.stringify(generateTrend(72, 8)),
    last_updated: new Date().toISOString(),
  });

  console.log('Seeding sponsorship history...');

  // --- SPONSORSHIP HISTORY ---
  const insertSponsor = db.prepare(`
    INSERT INTO sponsorship_history
      (client_id, brand_name, brand_category, status, start_date, end_date, end_reason, source_url, is_verified)
    VALUES
      (@client_id, @brand_name, @brand_category, @status, @start_date, @end_date, @end_reason, @source_url, @is_verified)
  `);

  // WillNeff
  insertSponsor.run({ client_id: willneffId, brand_name: 'HelloFresh', brand_category: 'Meal Kits', status: 'ended', start_date: '2021-01-01', end_date: '2021-11-01', end_reason: 'Client ended over anti-union labor practices', source_url: 'https://dotesports.com/streaming/news/will-neff-ends-partnership-with-hellofresh-over-labor-concerns', is_verified: 1 });
  insertSponsor.run({ client_id: willneffId, brand_name: 'Battlefy', brand_category: 'Esports', status: 'ended', start_date: '2020-06-01', end_date: '2022-01-01', end_reason: 'Ended publicly — reason not cited', source_url: '', is_verified: 1 });
  insertSponsor.run({ client_id: willneffId, brand_name: 'Ridge Wallet', brand_category: 'Accessories', status: 'ended', start_date: '2021-03-01', end_date: '2022-06-01', end_reason: 'Status unknown', source_url: '', is_verified: 0 });

  // Pokimane
  insertSponsor.run({ client_id: pokimaneId, brand_name: 'Postmates', brand_category: 'Food Delivery', status: 'ended', start_date: '2019-01-01', end_date: '2021-12-01', end_reason: 'Postmates acquired by Uber Eats, partnership dissolved', source_url: '', is_verified: 1 });
  insertSponsor.run({ client_id: pokimaneId, brand_name: 'GFuel', brand_category: 'Energy Drinks', status: 'active', start_date: '2020-03-01', end_date: null, end_reason: null, source_url: '', is_verified: 1 });
  insertSponsor.run({ client_id: pokimaneId, brand_name: 'Myna Snacks', brand_category: 'Snacks & Food', status: 'ended', start_date: '2023-11-01', end_date: '2025-01-01', end_reason: 'Brand shut down, products unavailable', source_url: '', is_verified: 1 });
  insertSponsor.run({ client_id: pokimaneId, brand_name: 'Amazon', brand_category: 'E-Commerce', status: 'active', start_date: '2020-01-01', end_date: null, end_reason: null, source_url: '', is_verified: 1 });

  // Valkyrae
  insertSponsor.run({ client_id: valkyraeId, brand_name: 'RFLCT', brand_category: 'Skincare', status: 'ended', start_date: '2021-10-01', end_date: '2021-10-14', end_reason: 'Brand shut down amid scientific community backlash over unsubstantiated blue-light claims', source_url: '', is_verified: 1 });
  insertSponsor.run({ client_id: valkyraeId, brand_name: 'Gymshark', brand_category: 'Fitness', status: 'active', start_date: '2023-03-01', end_date: null, end_reason: null, source_url: '', is_verified: 1 });
  insertSponsor.run({ client_id: valkyraeId, brand_name: 'Logitech', brand_category: 'Gaming Peripherals', status: 'ended', start_date: '2020-01-01', end_date: '2023-01-01', end_reason: 'Ended publicly — reason not cited', source_url: '', is_verified: 1 });
  insertSponsor.run({ client_id: valkyraeId, brand_name: 'Dollar Shave Club', brand_category: 'Personal Care', status: 'ended', start_date: '2021-01-01', end_date: '2022-01-01', end_reason: 'Status unknown', source_url: '', is_verified: 0 });

  console.log('✅ Seed complete!');
}

seed();
