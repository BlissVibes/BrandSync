/**
 * API entry point.
 *
 * Automatically switches between the real HTTP API and the embedded mock API:
 *   - Local dev / Vercel     → realApi (proxied or VITE_API_URL)
 *   - GitHub Pages (no VITE_API_URL set) → mockApi (in-memory seed data)
 *
 * Vite resolves `import.meta.env.*` at build time, so the unused branch
 * is tree-shaken out of the final bundle.
 */

import * as realApis from './realApi';
import * as mockApis from './mockApi';

// True when building for production without a backend URL (GitHub Pages)
export const IS_MOCK_MODE =
  import.meta.env.PROD && !import.meta.env.VITE_API_URL;

const impl = IS_MOCK_MODE ? mockApis : realApis;

export const clientsApi       = impl.clientsApi;
export const brandsApi        = impl.brandsApi;
export const relationshipsApi = impl.relationshipsApi;
export const controversiesApi = impl.controversiesApi;
export const seoApi           = impl.seoApi;
export const vetApi           = impl.vetApi;
export const sponsorshipsApi  = impl.sponsorshipsApi;
