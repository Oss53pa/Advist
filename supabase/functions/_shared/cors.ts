const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  // Domaine de production reel (absent de la liste initiale : toute reponse
  // renvoyait alors l'origine localhost, donc un rejet CORS par le navigateur).
  'https://advist.atlas-studio.org',
  'https://advist.atlasstudio.app',
  'https://advist.app',
  'https://atlas-studio.org',
];

// Sous-domaines legitimes non enumerables a l'avance :
// - *.atlas-studio.org : domaines applicatifs Atlas Studio
// - *.vercel.app       : deploiements de preview (une URL par commit)
// Coherent avec la CSP frame-ancestors de vercel.json.
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/[a-z0-9-]+\.atlas-studio\.org$/,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
];

function isAllowedOrigin(origin: string): boolean {
  return ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin));
}

export function getCorsHeaders(origin: string): Record<string, string> {
  const allowed = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };
}

export function jsonResponse(data: unknown, status = 200, origin = ''): Response {
  const headers = getCorsHeaders(origin);
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

export function errorResponse(message: string, status = 500, origin = ''): Response {
  return jsonResponse({ error: message }, status, origin);
}

export function optionsResponse(origin: string): Response {
  return new Response('ok', { headers: getCorsHeaders(origin) });
}
