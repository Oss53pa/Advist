const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://advist.atlasstudio.app',
  'https://advist.app',
  'https://atlas-studio.org',
];

export function getCorsHeaders(origin: string): Record<string, string> {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
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
