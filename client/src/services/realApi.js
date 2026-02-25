const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// Clients
export const clientsApi = {
  list: () => request('/clients'),
  get: (id) => request(`/clients/${id}`),
  create: (data) => request('/clients', { method: 'POST', body: data }),
  update: (id, data) => request(`/clients/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/clients/${id}`, { method: 'DELETE' }),
  fetchImage: (id) => request(`/clients/${id}/fetch-image`, { method: 'POST' }),
};

// Brands
export const brandsApi = {
  list: () => request('/brands'),
  get: (id) => request(`/brands/${id}`),
  taxonomy: () => request('/brands/taxonomy'),
  create: (data) => request('/brands', { method: 'POST', body: data }),
  update: (id, data) => request(`/brands/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/brands/${id}`, { method: 'DELETE' }),
};

// Relationships
export const relationshipsApi = {
  create: (data) => request('/relationships', { method: 'POST', body: data }),
  update: (id, data) => request(`/relationships/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/relationships/${id}`, { method: 'DELETE' }),
};

// Controversies
export const controversiesApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/controversies${qs ? `?${qs}` : ''}`);
  },
  get: (id) => request(`/controversies/${id}`),
  create: (data) => request('/controversies', { method: 'POST', body: data }),
  update: (id, data) => request(`/controversies/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/controversies/${id}`, { method: 'DELETE' }),
};

// SEO
export const seoApi = {
  entity: (type, id) => request(`/seo/entity/${type}/${id}`),
  correlation: (clientId, brandId) => request(`/seo/correlation?client_id=${clientId}&brand_id=${brandId}`),
  adhocCorrelation: (data) => request('/seo/correlation/adhoc', { method: 'POST', body: data }),
  seedEntity: (data) => request('/seo/seed-entity', { method: 'POST', body: data }),
};

// Vet
export const vetApi = {
  vet: (data) => request('/vet', { method: 'POST', body: data }),
};

// Sponsorships
export const sponsorshipsApi = {
  list: (clientId) => request(`/sponsorships?client_id=${clientId}`),
  create: (data) => request('/sponsorships', { method: 'POST', body: data }),
  delete: (id) => request(`/sponsorships/${id}`, { method: 'DELETE' }),
};
