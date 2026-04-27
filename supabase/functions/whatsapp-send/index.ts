import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.98.0';
import { getCorsHeaders, optionsResponse } from '../_shared/cors.ts';

interface WhatsAppPayload {
  to: string;
  type: 'text' | 'template' | 'document' | 'image';
  content: string;
  template_name?: string;
  template_params?: string[];
  media_url?: string;
  filename?: string;
  language?: string;
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin') || '';

  if (req.method === 'OPTIONS') {
    return optionsResponse(origin);
  }

  const cors = getCorsHeaders(origin);

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
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

    const payload: WhatsAppPayload = await req.json();

    let messageBody: Record<string, unknown>;

    switch (payload.type) {
      case 'template':
        messageBody = {
          messaging_product: 'whatsapp',
          to: payload.to,
          type: 'template',
          template: {
            name: payload.template_name,
            language: { code: payload.language || 'fr' },
            components: payload.template_params
              ? [
                  {
                    type: 'body',
                    parameters: payload.template_params.map((p) => ({
                      type: 'text',
                      text: p,
                    })),
                  },
                ]
              : [],
          },
        };
        break;
      case 'document':
        messageBody = {
          messaging_product: 'whatsapp',
          to: payload.to,
          type: 'document',
          document: {
            link: payload.media_url,
            filename: payload.filename || 'document.pdf',
            caption: payload.content,
          },
        };
        break;
      case 'image':
        messageBody = {
          messaging_product: 'whatsapp',
          to: payload.to,
          type: 'image',
          image: {
            link: payload.media_url,
            caption: payload.content,
          },
        };
        break;
      default:
        messageBody = {
          messaging_product: 'whatsapp',
          to: payload.to,
          type: 'text',
          text: { body: payload.content },
        };
    }

    const response = await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageBody),
    });

    const result = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'WhatsApp API error', details: result }), {
        status: response.status,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, message_id: result.messages?.[0]?.id }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
