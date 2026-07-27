/**
 * Edge Function: atlas-sso
 * Receives a JWT from Atlas Studio portal, validates it, and creates/finds
 * a local Supabase user + profile + organization. Returns a magic link
 * token_hash so the frontend can establish a session via verifyOtp().
 *
 * Deploy: supabase functions deploy atlas-sso
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyAtlasJWT } from '../_shared/jwt.ts';
import { getCorsHeaders, jsonResponse, errorResponse } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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
    const claims = await verifyAtlasJWT(token, { audience: ['advist'] });

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 2. Find or create user in Supabase Auth
    let userId: string;

    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === claims.email);

    if (existingUser) {
      userId = existingUser.id;
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          full_name: claims.fullName,
          atlas_studio_id: claims.userId,
          atlas_plan: claims.plan,
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
          atlas_plan: claims.plan,
        },
      });

      if (createError || !newUser.user) {
        console.error('Create user error:', createError);
        return errorResponse("Impossible de créer l'utilisateur", 500, origin);
      }
      userId = newUser.user.id;
    }

    // 3. Find or create profile + organization
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, organization_id')
      .eq('id', userId)
      .single();

    let organizationId: string | null = existingProfile?.organization_id || null;

    if (!existingProfile) {
      // 3a. Create organization for new user
      const orgName = `${claims.fullName}`;
      const orgSlug =
        claims.email
          .split('@')[0]
          .replace(/[^a-z0-9-]/gi, '-')
          .toLowerCase() +
        '-' +
        Date.now().toString(36);

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName,
          slug: orgSlug,
          email: claims.email,
          is_active: true,
        })
        .select('id')
        .single();

      if (orgError) {
        console.error('Create org error:', orgError);
        return errorResponse("Impossible de créer l'organisation", 500, origin);
      }
      organizationId = org.id;

      // 3b. Create profile
      const nameParts = claims.fullName.split(' ');
      const firstName = nameParts[0] || claims.fullName;
      const lastName = nameParts.slice(1).join(' ') || '';

      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        organization_id: organizationId,
        email: claims.email,
        first_name: firstName,
        last_name: lastName,
        display_name: claims.fullName,
        is_active: true,
      });

      if (profileError) {
        console.error('Create profile error:', profileError);
        return errorResponse('Impossible de créer le profil', 500, origin);
      }

      // 3c. Assign admin role
      const { data: adminRole } = await supabase
        .from('roles')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('name', 'admin')
        .single();

      if (!adminRole) {
        // Create default admin role for this organization
        const { data: newRole } = await supabase
          .from('roles')
          .insert({
            organization_id: organizationId,
            name: 'admin',
            display_name: 'Administrateur',
            description: "Accès complet à l'organisation",
            permissions: JSON.stringify([
              'documents:*',
              'workflows:*',
              'signatures:*',
              'users:*',
              'settings:*',
              'billing:*',
            ]),
            is_system: true,
            is_active: true,
          })
          .select('id')
          .single();

        if (newRole) {
          await supabase.from('user_roles').insert({
            user_id: userId,
            role_id: newRole.id,
            organization_id: organizationId,
            is_active: true,
          });
        }
      } else {
        await supabase.from('user_roles').insert({
          user_id: userId,
          role_id: adminRole.id,
          organization_id: organizationId,
          is_active: true,
        });
      }
    } else {
      // 3d. Update existing profile
      await supabase
        .from('profiles')
        .update({
          email: claims.email,
          first_name: claims.fullName.split(' ')[0] || claims.fullName,
          last_name: claims.fullName.split(' ').slice(1).join(' ') || '',
          display_name: claims.fullName,
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
