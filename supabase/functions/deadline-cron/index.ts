import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.98.0';

/**
 * Deadline Cron Edge Function
 *
 * Triggered by pg_cron or Supabase scheduled function to check
 * upcoming deadlines and send reminder notifications.
 *
 * PLAN GATING: Les rappels automatiques ne sont envoyés qu'aux tenants
 * avec le plan Enterprise. Les tenants Business ne reçoivent pas de rappels.
 *
 * Schedule: Every day at 08:00 UTC
 * pg_cron: SELECT cron.schedule('deadline-check', '0 8 * * *',
 *   $$SELECT net.http_post(
 *     url := 'https://<project>.supabase.co/functions/v1/deadline-cron',
 *     headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb
 *   )$$
 * );
 */

serve(async (req: Request) => {
  try {
    // Verify this is called with service role or valid cron token
    const authHeader = req.headers.get('Authorization');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!authHeader?.includes(serviceRoleKey) && !authHeader?.includes('Bearer')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, serviceRoleKey);

    const now = new Date();
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Cache des plans par organisation pour éviter des requêtes répétées
    const orgPlanCache = new Map<string, string>();

    async function getOrgPlan(orgId: string): Promise<string> {
      if (orgPlanCache.has(orgId)) return orgPlanCache.get(orgId)!;
      const { data } = await supabase
        .from('organizations')
        .select('subscription_plan')
        .eq('id', orgId)
        .single();
      const plan = data?.subscription_plan || 'business';
      orgPlanCache.set(orgId, plan);
      return plan;
    }

    // Find upcoming notification reminders
    const { data: reminders, error } = await supabase
      .from('notification_reminders')
      .select('*, notifications(recipient_id, title, message, organization_id)')
      .gte('remind_at', now.toISOString())
      .lte('remind_at', in7Days.toISOString())
      .eq('sent', false);

    if (error) throw error;

    let sentCount = 0;
    let skippedByPlan = 0;

    for (const reminder of reminders || []) {
      const notification = reminder.notifications;
      if (!notification) continue;

      // PLAN GATING: Vérifier si le tenant a le droit aux rappels automatiques
      if (notification.organization_id) {
        const plan = await getOrgPlan(notification.organization_id);
        if (plan !== 'enterprise') {
          skippedByPlan++;
          continue; // Business plan: pas de rappels automatiques
        }
      }

      // Create reminder notification
      await supabase.from('notifications').insert({
        recipient_id: notification.recipient_id,
        type: 'deadline_reminder',
        title: `Rappel: ${notification.title}`,
        message: notification.message,
        organization_id: notification.organization_id,
        status: 'unread',
        metadata: { original_notification_id: reminder.notification_id },
      });

      // Mark reminder as sent
      await supabase.from('notification_reminders').update({ sent: true }).eq('id', reminder.id);

      sentCount++;
    }

    // Check documents nearing expiration (retention policies)
    // Expiration notifications are sent to all plans
    const { data: expiringDocs } = await supabase
      .from('documents')
      .select('id, title, organization_id, created_by, expires_at')
      .not('expires_at', 'is', null)
      .gte('expires_at', now.toISOString())
      .lte('expires_at', in3Days.toISOString());

    for (const doc of expiringDocs || []) {
      await supabase.from('notifications').insert({
        recipient_id: doc.created_by,
        type: 'document_expiring',
        title: `Document expirant bientot`,
        message: `Le document "${doc.title}" expire dans moins de 3 jours.`,
        organization_id: doc.organization_id,
        status: 'unread',
        metadata: { document_id: doc.id },
      });
      sentCount++;
    }

    // Check workflow steps pending for too long (> 48h)
    // PLAN GATING: Seul Enterprise reçoit les rappels automatiques de validation
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const { data: staleSteps } = await supabase
      .from('workflow_assignees')
      .select(
        `
        id, user_id, status, assigned_at,
        workflow_steps!inner(
          name,
          workflow_instances!inner(
            organization_id,
            documents!inner(title)
          )
        )
      `
      )
      .eq('status', 'pending')
      .lte('assigned_at', twoDaysAgo.toISOString());

    for (const step of staleSteps || []) {
      const instance = (step as any).workflow_steps?.workflow_instances;
      if (!instance) continue;

      // PLAN GATING: Vérifier le plan du tenant
      if (instance.organization_id) {
        const plan = await getOrgPlan(instance.organization_id);
        if (plan !== 'enterprise') {
          skippedByPlan++;
          continue; // Business plan: pas de rappels automatiques
        }
      }

      await supabase.from('notifications').insert({
        recipient_id: step.user_id,
        type: 'workflow_reminder',
        title: `Validation en attente`,
        message: `Vous avez une etape de validation en attente depuis plus de 48h pour "${instance.documents?.title}".`,
        organization_id: instance.organization_id,
        status: 'unread',
      });
      sentCount++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        notifications_sent: sentCount,
        skipped_by_plan: skippedByPlan,
        checked_at: now.toISOString(),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
