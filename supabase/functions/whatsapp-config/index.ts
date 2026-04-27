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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

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

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return new Response(JSON.stringify({ error: 'No organization found' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'GET') {
      // Return current WhatsApp configuration status
      const { data: settings } = await supabase
        .from('organization_settings')
        .select('whatsapp_phone_id, whatsapp_configured, whatsapp_status')
        .eq('organization_id', profile.organization_id)
        .single();

      const phoneId = Deno.env.get('WHATSAPP_PHONE_ID');
      const hasToken = !!Deno.env.get('WHATSAPP_API_TOKEN');

      return new Response(
        JSON.stringify({
          configured: hasToken && !!phoneId,
          phone_id: phoneId || settings?.whatsapp_phone_id || null,
          status: settings?.whatsapp_status || (hasToken ? 'active' : 'inactive'),
          has_token: hasToken,
        }),
        {
          headers: { ...cors, 'Content-Type': 'application/json' },
        }
      );
    }

    if (req.method === 'POST') {
      // Save/update WhatsApp configuration
      const { phone_id, api_token } = await req.json();

      if (!phone_id) {
        return new Response(JSON.stringify({ error: 'phone_id is required' }), {
          status: 400,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      // Verify the token works by making a test call to the Graph API
      const testToken = api_token || Deno.env.get('WHATSAPP_API_TOKEN');
      if (testToken) {
        const verifyResponse = await fetch(`https://graph.facebook.com/v18.0/${phone_id}`, {
          headers: { Authorization: `Bearer ${testToken}` },
        });

        if (!verifyResponse.ok) {
          return new Response(
            JSON.stringify({
              error: 'Invalid WhatsApp configuration',
              details: 'Could not verify phone_id with the provided token',
            }),
            {
              status: 400,
              headers: { ...cors, 'Content-Type': 'application/json' },
            }
          );
        }
      }

      // Upsert organization settings
      const { error: upsertError } = await supabase.from('organization_settings').upsert(
        {
          organization_id: profile.organization_id,
          whatsapp_phone_id: phone_id,
          whatsapp_configured: true,
          whatsapp_status: 'active',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id' }
      );

      if (upsertError) throw upsertError;

      return new Response(
        JSON.stringify({
          success: true,
          message: 'WhatsApp configuration saved',
          phone_id,
          status: 'active',
        }),
        {
          headers: { ...cors, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
