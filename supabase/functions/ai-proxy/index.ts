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
    // Verify auth
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

    const { provider, model, messages, system, max_tokens } = await req.json();

    let responseData;

    if (provider === 'anthropic' || provider === 'claude') {
      const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
      if (!ANTHROPIC_API_KEY) {
        return new Response(JSON.stringify({ error: 'Anthropic API key not configured' }), {
          status: 503,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'claude-sonnet-4-20250514',
          max_tokens: max_tokens || 4096,
          system,
          messages,
        }),
      });

      responseData = await response.json();
    } else if (provider === 'openrouter') {
      const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
      if (!OPENROUTER_API_KEY) {
        return new Response(JSON.stringify({ error: 'OpenRouter API key not configured' }), {
          status: 503,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'meta-llama/llama-3.2-3b-instruct:free',
          messages: system ? [{ role: 'system', content: system }, ...messages] : messages,
          max_tokens: max_tokens || 4096,
        }),
      });

      responseData = await response.json();
    } else {
      return new Response(JSON.stringify({ error: `Unknown provider: ${provider}` }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Log AI usage for billing/analytics
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profile?.organization_id) {
      await supabaseAdmin.from('ai_messages').insert({
        conversation_id: null,
        role: 'assistant',
        content:
          provider === 'anthropic'
            ? responseData?.content?.[0]?.text || ''
            : responseData?.choices?.[0]?.message?.content || '',
        model: model || 'unknown',
        tokens_used:
          provider === 'anthropic'
            ? (responseData?.usage?.input_tokens || 0) + (responseData?.usage?.output_tokens || 0)
            : responseData?.usage?.total_tokens || 0,
      });
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
