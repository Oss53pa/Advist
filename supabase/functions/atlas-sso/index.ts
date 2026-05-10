/**
 * Edge Function: atlas-sso
 *
 * Receives a JWT from Atlas Studio portal, validates it, ensures the local
 * Supabase auth user + profile exist, and returns a magic link token_hash so
 * the frontend can establish a session via verifyOtp().
 *
 * Source of truth (Atlas Studio Suite):
 *  - Roles: licence_seats.role (app_super_admin / app_admin / editor / viewer)
 *  - Subscription / plan: Atlas Studio licences (managed in atlas-studio.org)
 *
 * This function MUST NOT create or modify roles, subscriptions, or plans
 * locally. The buyer of the application in Atlas Studio is automatically
 * provisioned as app_super_admin via licence_seats — Advist only reads that.
 *
 * Deploy: supabase functions deploy atlas-sso
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyAtlasJWT } from '../_shared/jwt.ts';
import { getCorsHeaders, jsonResponse, errorResponse } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const jwtSecret = Deno.env.get('JWT_SECRET')!;

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  const cors = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405, origin);
  }

  try {
    const { token } = await req.json();
    if (!token) {
      return errorResponse('Token manquant', 400, origin);
    }

    // 1. Validate the Atlas Studio JWT
    const claims = await verifyAtlasJWT(token, jwtSecret);

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 2. Find or create user in Supabase Auth.
    //    user_metadata: identity only (full_name, atlas_studio_id).
    //    app_metadata: server-authoritative cache of the plan tier from the
    //    verified JWT — used by the frontend as a non-critical UI hint.
    //    The authoritative plan source is public.licences.plan_id → plans.name.
    //    If claims.plan is missing the cache key is simply omitted, and the
    //    frontend falls back to querying licences.
    let userId: string;

    const planMetadata = claims.plan ? { advist_plan: claims.plan } : {};

    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === claims.email);

    if (existingUser) {
      userId = existingUser.id;
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          full_name: claims.fullName,
          atlas_studio_id: claims.userId,
        },
        app_metadata: {
          ...(existingUser.app_metadata ?? {}),
          ...planMetadata,
        },
      });
    } else {
      const randomPassword = crypto.randomUUID() + '!Aa1';
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: claims.email,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          full_name: claims.fullName,
          atlas_studio_id: claims.userId,
        },
        app_metadata: planMetadata,
      });

      if (createError || !newUser.user) {
        console.error('Create user error:', createError);
        return errorResponse("Impossible de créer l'utilisateur", 500, origin);
      }
      userId = newUser.user.id;
    }

    // 3. Look up the user's active Advist seat (provisioned by Atlas Studio
    //    before the SSO redirect). The seat carries the tenant_id which we
    //    use as the local organization_id so Advist's RLS / data scoping
    //    aligns with Atlas Studio Suite tenancy.
    const { data: advistSeat } = await supabase
      .from('licence_seats')
      .select('id, tenant_id, invitation_accepted_at, licences!inner(products!inner(slug))')
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('licences.products.slug', 'advist')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 3.b Fallback: maybe the seat was provisioned by email but not yet
    //     bound to a user_id (invitation pending). Bind it now.
    let seatTenantId: string | null = (advistSeat?.tenant_id as string | null) ?? null;
    if (!advistSeat) {
      const { data: pendingSeat } = await supabase
        .from('licence_seats')
        .select('id, tenant_id, licences!inner(products!inner(slug))')
        .eq('email', claims.email)
        .eq('status', 'active')
        .eq('licences.products.slug', 'advist')
        .is('user_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (pendingSeat) {
        await supabase
          .from('licence_seats')
          .update({
            user_id: userId,
            invitation_accepted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', pendingSeat.id as string);
        seatTenantId = pendingSeat.tenant_id as string;
      }
    } else if (!advistSeat.invitation_accepted_at) {
      await supabase
        .from('licence_seats')
        .update({
          invitation_accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', advistSeat.id as string);
    }

    // 4. Ensure a profile row exists, with organization_id mirroring the
    //    Atlas Studio tenant. Advist data is scoped by organization_id, so
    //    this mirroring is required for the tenant to see their own data.
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, organization_id')
      .eq('id', userId)
      .single();

    if (!existingProfile) {
      const nameParts = claims.fullName.split(' ');
      const firstName = nameParts[0] || claims.fullName;
      const lastName = nameParts.slice(1).join(' ') || '';

      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        email: claims.email,
        first_name: firstName,
        last_name: lastName,
        display_name: claims.fullName,
        organization_id: seatTenantId,
        is_active: true,
      });

      if (profileError) {
        console.error('Create profile error:', profileError);
        return errorResponse('Impossible de créer le profil', 500, origin);
      }
    } else {
      await supabase
        .from('profiles')
        .update({
          email: claims.email,
          first_name: claims.fullName.split(' ')[0] || claims.fullName,
          last_name: claims.fullName.split(' ').slice(1).join(' ') || '',
          display_name: claims.fullName,
          organization_id: seatTenantId ?? existingProfile.organization_id,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    }

    // 4. Generate magic link to create a session
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: claims.email,
    });

    if (linkError || !linkData) {
      console.error('Generate link error:', linkError);
      return errorResponse('Impossible de générer le lien de connexion', 500, origin);
    }

    const url = new URL(linkData.properties.action_link);
    const tokenHash = url.searchParams.get('token_hash') || url.hash;

    return jsonResponse(
      {
        token_hash: tokenHash,
        email: claims.email,
        type: 'magiclink',
      },
      200,
      origin
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne';
    console.error('atlas-sso error:', error);
    return errorResponse(message, 401, origin);
  }
});
