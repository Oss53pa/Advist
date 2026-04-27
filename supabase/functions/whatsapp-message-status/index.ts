import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.98.0';
import { getCorsHeaders, optionsResponse } from '../_shared/cors.ts';

serve(async (req: Request) => {
  const origin = req.headers.get('origin') || '';

  if (req.method === 'OPTIONS') {
    return optionsResponse(origin);
  }

  const cors = getCorsHeaders(origin);

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

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

    const { message_id } = await req.json();

    if (!message_id) {
      return new Response(JSON.stringify({ error: 'message_id is required' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Get user's organization to scope the query
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    // Query notifications table — scoped to user's organization
    const query = supabase
      .from('notifications')
      .select('id, status, type, title, message, metadata, created_at, updated_at, organization_id')
      .eq('metadata->>whatsapp_message_id', message_id);

    if (userProfile?.organization_id) {
      query.eq('organization_id', userProfile.organization_id);
    }

    const { data: notification, error: queryError } = await query.single();

    if (queryError && queryError.code !== 'PGRST116') {
      throw queryError;
    }

    if (!notification) {
      return new Response(
        JSON.stringify({
          message_id,
          status: 'unknown',
          error: 'No notification found for this message ID',
        }),
        {
          status: 404,
          headers: { ...cors, 'Content-Type': 'application/json' },
        }
      );
    }

    // Map internal status to WhatsApp delivery statuses
    const deliveryStatus = notification.metadata?.delivery_status || notification.status;

    return new Response(
      JSON.stringify({
        message_id,
        status: deliveryStatus,
        notification_id: notification.id,
        type: notification.type,
        title: notification.title,
        created_at: notification.created_at,
        updated_at: notification.updated_at,
        delivery_details: {
          sent_at: notification.metadata?.sent_at || null,
          delivered_at: notification.metadata?.delivered_at || null,
          read_at: notification.metadata?.read_at || null,
          failed_at: notification.metadata?.failed_at || null,
          error: notification.metadata?.error || null,
        },
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
