/**
 * API Service — Supabase-only (BaaS)
 *
 * All API access goes through the Supabase client.
 * Import supabase and invokeEdgeFunction from '../lib/supabase' directly.
 *
 * This re-export exists only for backward compatibility during migration.
 * Services still importing `api` should be migrated to use Supabase directly.
 */
export { supabase, invokeEdgeFunction } from '../lib/supabase';

import { logger } from '../utils/logger';

// Stub for legacy services that still import `api` as an HTTP client.
// These will throw in development to surface migration needs.
const notImplemented = (method: string, path: string) => {
  const message = `[api] ${method} ${path} — migrate to Supabase direct queries`;
  logger.warn(message);

  if (import.meta.env.DEV) {
    throw new Error(message);
  }

  return Promise.reject(new Error(message));
};

export const api = {
  get: (path: string, _config?: unknown) => notImplemented('GET', path),
  post: (path: string, _data?: unknown, _config?: unknown) => notImplemented('POST', path),
  put: (path: string, _data?: unknown, _config?: unknown) => notImplemented('PUT', path),
  patch: (path: string, _data?: unknown, _config?: unknown) => notImplemented('PATCH', path),
  delete: (path: string, _config?: unknown) => notImplemented('DELETE', path),
};

export default api;
