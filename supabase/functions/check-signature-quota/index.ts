/**
 * Edge Function: check-signature-quota
 * P0-S002: Enforcement server-side du quota signatures per-emitter
 *
 * Verifie que l'organisation n'a pas depasse sa limite mensuelle
 * avant d'autoriser une nouvelle signature.
 */
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
    // Auth check — verify the caller has a valid JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { organization_id, feature } = await req.json();

    if (!organization_id) {
      return new Response(JSON.stringify({ error: 'organization_id required' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Verify the user belongs to this organization
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userProfile?.organization_id !== organization_id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Fetch organization plan
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('plan, settings')
      .eq('id', organization_id)
      .single();

    if (orgError || !org) {
      return new Response(JSON.stringify({ error: 'Organization not found' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const plan = (org.plan || 'business').toLowerCase();

    // Plan limits
    const PLAN_LIMITS: Record<
      string,
      { maxEmitters: number; maxSignaturesMonth: number; features: string[] }
    > = {
      business: {
        maxEmitters: 5,
        maxSignaturesMonth: 50,
        features: ['basic_workflow', 'simple_signature', 'basic_export'],
      },
      enterprise: {
        maxEmitters: -1,
        maxSignaturesMonth: -1,
        features: [
          'basic_workflow',
          'advanced_workflow',
          'conditional_workflow',
          'simple_signature',
          'advanced_signature',
          'qualified_signature',
          'basic_export',
          'zip_export',
          'api_access',
          'sso',
          'audit_advanced',
        ],
      },
    };

    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.business;

    // Feature check
    if (feature && !limits.features.includes(feature) && limits.maxEmitters !== -1) {
      return new Response(
        JSON.stringify({
          allowed: false,
          reason: 'FEATURE_NOT_AVAILABLE',
          plan,
          upgrade_required: true,
        }),
        { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Signature quota check
    if (limits.maxSignaturesMonth !== -1) {
      const firstOfMonth = new Date();
      firstOfMonth.setDate(1);
      firstOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from('document_signatures')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'signed')
        .gte('signed_at', firstOfMonth.toISOString());

      // Filter by org via documents join
      const { count: orgCount } = await supabase.rpc('count_org_signatures_this_month', {
        org_id: organization_id,
      });

      const currentCount = orgCount || count || 0;

      if (currentCount >= limits.maxSignaturesMonth) {
        return new Response(
          JSON.stringify({
            allowed: false,
            reason: 'QUOTA_EXCEEDED',
            current: currentCount,
            limit: limits.maxSignaturesMonth,
            plan,
            upgrade_required: true,
          }),
          { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Emitter count check
    if (limits.maxEmitters !== -1) {
      const { count: emitterCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization_id)
        .eq('is_active', true);

      if ((emitterCount || 0) > limits.maxEmitters) {
        return new Response(
          JSON.stringify({
            allowed: false,
            reason: 'EMITTER_LIMIT_EXCEEDED',
            current: emitterCount,
            limit: limits.maxEmitters,
            plan,
            upgrade_required: true,
          }),
          { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(JSON.stringify({ allowed: true, plan }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
