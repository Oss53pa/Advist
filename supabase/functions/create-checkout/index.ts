import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.98.0';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
import { getCorsHeaders, optionsResponse } from '../_shared/cors.ts';

// Allowed redirect URL origins for checkout
const ALLOWED_REDIRECT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://advist.atlasstudio.app',
  'https://advist.app',
  'https://atlas-studio.org',
];

function isAllowedRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_REDIRECT_ORIGINS.some(
      (o) => parsed.origin === o || parsed.origin === new URL(o).origin
    );
  } catch {
    return false;
  }
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin') || '';

  if (req.method === 'OPTIONS') {
    return optionsResponse(origin);
  }

  const cors = getCorsHeaders(origin);

  try {
    const supabaseClient = createClient(
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
    } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const { plan_id, success_url, cancel_url } = await req.json();

    // Validate redirect URLs to prevent open redirect
    const defaultOrigin = req.headers.get('origin') || 'https://advist.app';
    const validSuccessUrl =
      success_url && isAllowedRedirectUrl(success_url)
        ? success_url
        : `${defaultOrigin}/billing?success=true`;
    const validCancelUrl =
      cancel_url && isAllowedRedirectUrl(cancel_url)
        ? cancel_url
        : `${defaultOrigin}/billing?cancelled=true`;

    // Get user's org
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return new Response(JSON.stringify({ error: 'No organization found' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Get plan details (use service role for plan lookup)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: plan } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (!plan) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Advist ${plan.name}`,
              description: plan.description || undefined,
            },
            unit_amount: Math.round(plan.price_monthly * 100),
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      metadata: {
        organization_id: profile.organization_id,
        plan_id: plan_id,
        user_id: user.id,
      },
      success_url: validSuccessUrl,
      cancel_url: validCancelUrl,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
