import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.98.0';
import { getCorsHeaders, optionsResponse } from '../_shared/cors.ts';

serve(async (req: Request) => {
  const origin = req.headers.get('origin') || '';

  if (req.method === 'OPTIONS') {
    return optionsResponse(origin);
  }

  const cors = getCorsHeaders(origin);

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization')!;
    const {
      data: { user },
    } = await createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    }).auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_API_TOKEN');
    const WHATSAPP_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_ID');

    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
      return new Response(JSON.stringify({ error: 'WhatsApp not configured' }), {
        status: 503,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Fetch templates from Meta Graph API
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || 'APPROVED';
    const limit = url.searchParams.get('limit') || '20';

    const graphUrl = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/message_templates?status=${status}&limit=${limit}`;

    const response = await fetch(graphUrl, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch templates',
          details: result.error?.message || 'Unknown error',
        }),
        {
          status: response.status,
          headers: { ...cors, 'Content-Type': 'application/json' },
        }
      );
    }

    // Map templates to a cleaner format
    const templates = (result.data || []).map((t: Record<string, unknown>) => ({
      id: t.id,
      name: t.name,
      status: t.status,
      category: t.category,
      language: t.language,
      components: t.components,
    }));

    return new Response(
      JSON.stringify({
        templates,
        paging: result.paging || null,
        total: templates.length,
      }),
      {
        headers: { ...cors, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
