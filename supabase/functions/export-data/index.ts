import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.98.0';
import { getCorsHeaders, optionsResponse } from '../_shared/cors.ts';

/**
 * GDPR Data Export Edge Function
 *
 * Handles data subject access requests (DSAR) by collecting
 * all personal data for a user and returning it as JSON.
 */
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

    const { type } = await req.json();

    // Use service role to bypass RLS for complete data export
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // GDPR: user can only export their OWN data — user.id is from the verified JWT
    const userId = user.id;

    if (type === 'access') {
      // Collect all user data
      const [
        profileResult,
        documentsResult,
        notificationsResult,
        signaturesResult,
        consentsResult,
        loginHistoryResult,
        aiConversationsResult,
      ] = await Promise.all([
        supabaseAdmin.from('profiles').select('*').eq('id', userId).single(),
        supabaseAdmin
          .from('documents')
          .select('id, title, type, status, created_at, updated_at')
          .eq('created_by', userId),
        supabaseAdmin
          .from('notifications')
          .select('id, type, title, message, status, created_at')
          .eq('recipient_id', userId),
        supabaseAdmin
          .from('document_signatures')
          .select('id, document_id, status, signed_at, ip_address')
          .eq('user_id', userId),
        supabaseAdmin.from('consents').select('*').eq('user_id', userId),
        supabaseAdmin.from('login_history').select('*').eq('user_id', userId),
        supabaseAdmin
          .from('ai_conversations')
          .select('id, title, created_at, ai_messages(role, content, created_at)')
          .eq('user_id', userId),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user_id: userId,
        email: user.email,
        profile: profileResult.data,
        documents_created: documentsResult.data,
        notifications: notificationsResult.data,
        signatures: signaturesResult.data,
        consents: consentsResult.data,
        login_history: loginHistoryResult.data,
        ai_conversations: aiConversationsResult.data,
      };

      // Log the data export request
      await supabaseAdmin.from('data_subject_requests').insert({
        user_id: userId,
        type: 'access',
        status: 'completed',
        organization_id: profileResult.data?.organization_id,
        completed_at: new Date().toISOString(),
      });

      return new Response(JSON.stringify(exportData), {
        headers: {
          ...cors,
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="advist-data-export-${userId}.json"`,
        },
      });
    }

    if (type === 'erasure') {
      // Mark for erasure (admin review required)
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('organization_id')
        .eq('id', userId)
        .single();

      await supabaseAdmin.from('data_subject_requests').insert({
        user_id: userId,
        type: 'erasure',
        status: 'pending',
        organization_id: profile?.organization_id,
        notes: 'Automated GDPR erasure request - requires admin review',
      });

      return new Response(
        JSON.stringify({
          success: true,
          message:
            'Votre demande de suppression a ete enregistree. Elle sera traitee dans les 30 jours.',
        }),
        {
          headers: { ...cors, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid type. Use 'access' or 'erasure'." }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
