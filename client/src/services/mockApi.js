/**
 * Mock API — used on GitHub Pages / static deployments where no backend is available.
 * All mutations (create/update/delete) are applied in-memory and persist for the session.
 * Auto-enabled when VITE_API_URL is not set in a production build.
 */

import { CLIENTS, BRANDS, RELATIONSHIPS, CONTROVERSIES, SPONSORSHIPS, SEO_DATA } from './mockData';
import { deriveParentCategories, getCategoryOverlap, getMatchLevel } from '../utils/categoryUtils';

// In-memory stores (cloned from seed data so mutations work in-session)
let clients = CLIENTS.map(c => ({ ...c }));
let brands = BRANDS.map(b => ({ ...b }));
let relationships = RELATIONSHIPS.map(r => ({ ...r }));
let controversies = CONTROVERSIES.map(c => ({ ...c }));
let sponsorships = SPONSORSHIPS.map(s => ({ ...s }));
let nextId = { client: 100, brand: 100, relationship: 100, controversy: 100, sponsorship: 100 };

function pearson(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const x = xs.slice(0, n), y = ys.slice(0, n);
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - mx) * (y[i] - my);
    dx2 += (x[i] - mx) ** 2;
    dy2 += (y[i] - my) ** 2;
  }
  const d = Math.sqrt(dx2 * dy2);
  return d === 0 ? 0 : parseFloat((num / d).toFixed(3));
}

function computeRisk(coeff, flags) {
  let score = 0;
  if (coeff !== null) {
    if (coeff >= 0.6) score += 30;
    else if (coeff >= 0.2) score += 15;
    else if (coeff >= -0.2) score += 5;
    else if (coeff >= -0.5) score -= 10;
    else score -= 25;
  }
  const c = flags.filter(f => f.severity === 'critical').length;
  const h = flags.filter(f => f.severity === 'high').length;
  const m = flags.filter(f => f.severity === 'medium').length;
  if (c) score -= 50;
  if (h) score -= 25;
  if (m) score -= 10;
  if (!flags.length) score += 20;

  const reasons = [];
  if (coeff !== null) {
    if (coeff >= 0.6) reasons.push('Strong positive SEO correlation');
    else if (coeff >= 0.2) reasons.push('Moderate SEO correlation');
    else if (coeff >= -0.2) reasons.push('Neutral SEO correlation');
    else reasons.push('Negative SEO correlation');
  }
  if (c) reasons.push(`${c} critical controversy in this category`);
  if (h) reasons.push(`${h} high-severity controversy in this category`);
  if (!flags.length) reasons.push('No relevant controversies found');

  let recommendation;
  if (score >= 40) recommendation = 'Strong Fit';
  else if (score >= 15) recommendation = 'Proceed with Caution';
  else if (score >= -10) recommendation = 'High Risk';
  else recommendation = 'Do Not Recommend';

  return { score, recommendation, reasons };
}

function mockTrend(name) {
  const base = 30 + (name.length * 7 % 50);
  const data = [];
  let cur = base;
  const now = new Date(2026, 1, 1);
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const r = (Math.sin(base * 9.3 + i * 0.9) + 1) / 2;
    cur = Math.max(10, cur + (r - 0.45) * 15);
    data.push({ month, value: Math.round(cur) });
  }
  return data;
}

// ─── Clients ─────────────────────────────────────────────────────────────────
export const clientsApi = {
  list: async () => clients.map(c => {
    const active = relationships.filter(r => r.client_id === c.id && r.status === 'active').length;
    const ctv = controversies.filter(r => r.client_id === c.id);
    const order = ['critical','high','medium','low'];
    let worst = null;
    for (const sev of order) { if (ctv.find(r => r.severity === sev)) { worst = sev; break; } }
    return { ...c, activeBrandCount: active, controversyCount: ctv.length, worstSeverity: worst };
  }),

  get: async (id) => {
    const client = clients.find(c => c.id === parseInt(id));
    if (!client) throw new Error('Client not found');
    const rels = relationships.filter(r => r.client_id === client.id)
      .sort((a, b) => (a.status === 'active' ? -1 : 1));
    const ctv = controversies.filter(c => c.client_id === client.id);
    const seo = SEO_DATA.client[client.id] || [];
    const spon = sponsorships.filter(s => s.client_id === client.id);
    return { ...client, relationships: rels, controversies: ctv, seoData: seo, sponsorships: spon };
  },

  create: async (data) => {
    const id = ++nextId.client;
    const client = { id, name: data.name, display_name: data.display_name || data.name, image_url: null, category: data.category || '', platform: data.platform || 'Both', org: data.org || null, notes: data.notes || null, added_date: new Date().toISOString().slice(0, 10) };
    clients.push(client);
    return client;
  },

  update: async (id, data) => {
    const idx = clients.findIndex(c => c.id === parseInt(id));
    if (idx < 0) throw new Error('Not found');
    clients[idx] = { ...clients[idx], ...data };
    return clients[idx];
  },

  delete: async (id) => {
    clients = clients.filter(c => c.id !== parseInt(id));
    return { success: true };
  },

  fetchImage: async (id) => ({ image_url: null }),
};

// ─── Brands ──────────────────────────────────────────────────────────────────
export const brandsApi = {
  list: async () => brands,

  get: async (id) => {
    const brand = brands.find(b => b.id === parseInt(id));
    if (!brand) throw new Error('Brand not found');
    const rels = relationships.filter(r => r.brand_id === brand.id);
    const seo = SEO_DATA.brand[brand.id] || [];
    return { ...brand, clients: rels, seoData: seo };
  },

  taxonomy: async () => ({
    taxonomy: {
      Food: ['Meal Kits','Food Delivery','Snacks & Food','Restaurants','Grocery','Beverages'],
      Beauty: ['Skincare','Makeup','Health & Beauty','Personal Care','Haircare','Fragrance'],
      Gaming: ['Gaming Peripherals','Gaming Chairs','Game Publishers','Esports','Streaming Tools'],
      Tech: ['Software','Hardware','Streaming Platforms','Apps','E-Commerce','Subscription Services'],
      Lifestyle: ['Clothing','Fitness','Home Goods','Athleisure','Travel'],
      Health: ['Supplements','Wellness','Health & Wellness','Personal Care','Energy Drinks'],
      Fashion: ['Clothing','Accessories','Athleisure','Luxury Goods'],
      Finance: ['Financial Services','Crypto','Investing','Banking'],
      Entertainment: ['Media','Music','Film','Events'],
    },
  }),

  create: async (data) => {
    const id = ++nextId.brand;
    const cats = Array.isArray(data.categories) ? data.categories : [];
    const brand = { id, name: data.name, logo_url: data.logo_url || '', categories: cats, parent_categories: deriveParentCategories(cats), primary_category: data.primary_category || cats[0] || '', added_date: new Date().toISOString().slice(0, 10) };
    brands.push(brand);
    return brand;
  },

  update: async (id, data) => {
    const idx = brands.findIndex(b => b.id === parseInt(id));
    if (idx < 0) throw new Error('Not found');
    const cats = Array.isArray(data.categories) ? data.categories : brands[idx].categories;
    brands[idx] = { ...brands[idx], ...data, categories: cats, parent_categories: deriveParentCategories(cats) };
    return brands[idx];
  },

  delete: async (id) => {
    brands = brands.filter(b => b.id !== parseInt(id));
    return { success: true };
  },
};

// ─── Relationships ────────────────────────────────────────────────────────────
export const relationshipsApi = {
  create: async (data) => {
    const id = ++nextId.relationship;
    const brand = brands.find(b => b.id === parseInt(data.brand_id));
    const rel = { id, client_id: parseInt(data.client_id), brand_id: parseInt(data.brand_id), brand_name: brand?.name || '', logo_url: brand?.logo_url || '', categories: brand?.categories || [], parent_categories: brand?.parent_categories || [], primary_category: brand?.primary_category || '', status: data.status || 'active', start_date: data.start_date || null, end_date: data.end_date || null, end_reason: data.end_reason || null, end_reason_source_url: data.end_reason_source_url || null, is_public_end: data.is_public_end ? 1 : 0, ended_by: data.ended_by || 'unknown' };
    relationships.push(rel);
    const c = clients.find(cl => cl.id === rel.client_id);
    if (c && rel.status === 'active') c.activeBrandCount = (c.activeBrandCount || 0) + 1;
    return rel;
  },

  update: async (id, data) => {
    const idx = relationships.findIndex(r => r.id === parseInt(id));
    if (idx < 0) throw new Error('Not found');
    relationships[idx] = { ...relationships[idx], ...data };
    return relationships[idx];
  },

  delete: async (id) => {
    relationships = relationships.filter(r => r.id !== parseInt(id));
    return { success: true };
  },
};

// ─── Controversies ────────────────────────────────────────────────────────────
export const controversiesApi = {
  list: async (params = {}) => {
    let rows = controversies;
    if (params.client_id) rows = rows.filter(c => c.client_id === parseInt(params.client_id));
    if (params.brand_id) rows = rows.filter(c => c.brand_id === parseInt(params.brand_id));
    return rows;
  },

  get: async (id) => {
    const row = controversies.find(c => c.id === parseInt(id));
    if (!row) throw new Error('Not found');
    return row;
  },

  create: async (data) => {
    const id = ++nextId.controversy;
    const row = { id, client_id: data.client_id || null, brand_id: data.brand_id || null, title: data.title, summary: data.summary || null, source_url: data.source_url || null, date_found: new Date().toISOString().slice(0, 10), date_occurred: data.date_occurred || null, severity: data.severity || 'medium', category: data.category || null, relevance_to_brands: Array.isArray(data.relevance_to_brands) ? data.relevance_to_brands : [] };
    controversies.push(row);
    return row;
  },

  update: async (id, data) => {
    const idx = controversies.findIndex(c => c.id === parseInt(id));
    if (idx < 0) throw new Error('Not found');
    controversies[idx] = { ...controversies[idx], ...data };
    return controversies[idx];
  },

  delete: async (id) => {
    controversies = controversies.filter(c => c.id !== parseInt(id));
    return { success: true };
  },
};

// ─── SEO ──────────────────────────────────────────────────────────────────────
export const seoApi = {
  entity: async (type, id) => (SEO_DATA[type]?.[parseInt(id)] || []),

  correlation: async (clientId, brandId) => {
    const cid = parseInt(clientId), bid = parseInt(brandId);
    const client = clients.find(c => c.id === cid);
    const brand = brands.find(b => b.id === bid);
    if (!client || !brand) throw new Error('Not found');

    const clientSeo = SEO_DATA.client[cid]?.[0];
    const brandSeo = SEO_DATA.brand[bid]?.[0];
    const clientData = clientSeo?.trend_data || [];
    const brandData = brandSeo?.trend_data || [];
    const coefficient = pearson(clientData.map(d => d.value), brandData.map(d => d.value));

    const ctv = controversies.filter(c => c.client_id === cid);
    const flags = ctv.filter(c => getMatchLevel(c.relevance_to_brands, brand.categories) !== null)
      .map(c => ({ ...c, categoryOverlap: getCategoryOverlap(c.relevance_to_brands, brand.categories) }));

    return { client: { id: client.id, name: client.name, display_name: client.display_name }, brand: { id: brand.id, name: brand.name, categories: brand.categories, primary_category: brand.primary_category }, correlation: { coefficient, clientData, brandData, months: clientData.map(d => d.month) }, controversyFlags: flags, riskAssessment: computeRisk(coefficient, flags) };
  },

  adhocCorrelation: async (data) => {
    const cd = mockTrend(data.client_name), bd = mockTrend(data.brand_name);
    const coefficient = pearson(cd.map(d => d.value), bd.map(d => d.value));
    return { client: { name: data.client_name }, brand: { name: data.brand_name, categories: data.brand_categories || [] }, correlation: { coefficient, clientData: cd, brandData: bd }, riskAssessment: computeRisk(coefficient, []) };
  },

  seedEntity: async () => ({ id: 0 }),
};

// ─── Vet ──────────────────────────────────────────────────────────────────────
export const vetApi = {
  vet: async ({ client_name, client_id }) => {
    const clientSeo = mockTrend(client_name);
    const ctv = client_id ? controversies.filter(c => c.client_id === parseInt(client_id)) : [];

    const matrix = brands.map(brand => {
      const brandSeo = SEO_DATA.brand[brand.id]?.[0];
      const brandData = brandSeo?.trend_data || mockTrend(brand.name);
      const coefficient = pearson(clientSeo.map(d => d.value), brandData.map(d => d.value));

      const flags = ctv.filter(c => getMatchLevel(c.relevance_to_brands, brand.categories) !== null);

      const categoryChips = brand.categories.map(cat => {
        if (ctv.some(c => c.relevance_to_brands.includes(cat))) return { category: cat, status: 'red' };
        const bParents = deriveParentCategories([cat]);
        if (ctv.some(c => deriveParentCategories(c.relevance_to_brands).some(p => bParents.includes(p)))) return { category: cat, status: 'yellow' };
        return { category: cat, status: 'green' };
      });

      const risk = computeRisk(coefficient, flags);
      return { brand: { id: brand.id, name: brand.name, logo_url: brand.logo_url, primary_category: brand.primary_category, categories: brand.categories }, coefficient, categoryChips, overlapCount: categoryChips.filter(c => c.status === 'red').length, adjacentCount: categoryChips.filter(c => c.status === 'yellow').length, controversyFlags: flags, riskScore: risk.score, recommendation: risk.recommendation, brandTrendData: brandData, clientTrendData: clientSeo };
    });

    matrix.sort((a, b) => b.riskScore - a.riskScore);
    const strongFit = matrix.filter(r => r.recommendation === 'Strong Fit').length;

    return { clientName: client_name, clientSeo: { keyword: client_name, search_volume: 200000 + client_name.length * 5000, trend_data: clientSeo }, image_url: null, matrix, summary: { strongFit, totalBrands: matrix.length, label: `${client_name} is a strong fit for ${strongFit} of ${matrix.length} brands` } };
  },
};

// ─── Sponsorships ─────────────────────────────────────────────────────────────
export const sponsorshipsApi = {
  list: async (clientId) => sponsorships.filter(s => s.client_id === parseInt(clientId)),

  create: async (data) => {
    const id = ++nextId.sponsorship;
    const row = { id, ...data };
    sponsorships.push(row);
    return row;
  },

  delete: async (id) => {
    sponsorships = sponsorships.filter(s => s.id !== parseInt(id));
    return { success: true };
  },
};
