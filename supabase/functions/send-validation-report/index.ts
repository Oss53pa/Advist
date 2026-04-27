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

    const { report_id, recipients, document_name } = await req.json();

    if (!report_id || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'report_id and recipients (non-empty array) are required',
        }),
        {
          status: 400,
          headers: { ...cors, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch the report from Supabase Storage
    const { data: reportData, error: downloadError } = await supabase.storage
      .from('validation-reports')
      .download(`${report_id}.json`);

    if (downloadError) {
      return new Response(JSON.stringify({ error: 'Report not found' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Parse report content
    const reportText = await reportData.text();
    const report = JSON.parse(reportText);

    // Authorization: verify user belongs to the report's organization
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('organization_id, first_name, last_name, email')
      .eq('id', user.id)
      .single();

    if (report.organization_id && userProfile?.organization_id !== report.organization_id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const senderName = userProfile
      ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
      : 'ADVIST';

    // Generate a signed URL for the report (valid 7 days)
    const { data: signedUrlData } = await supabase.storage
      .from('validation-reports')
      .createSignedUrl(`${report_id}.json`, 60 * 60 * 24 * 7);

    const reportUrl = signedUrlData?.signedUrl || '';

    // Build email HTML
    const docName = document_name || report.document_name || 'Document';
    const reportDate = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const statusColor = report.status === 'valid' ? '#059669' : '#d97706';
    const statusLabel = report.status === 'valid' ? 'Valide' : 'En attente';

    const emailHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compte-Rendu de Validation</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
    <tr><td align="center" style="padding:24px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

        <!-- Header -->
        <tr><td style="background-color:#1e293b;padding:20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color:#ffffff;font-size:20px;font-weight:bold;font-style:italic;">Advist</td>
              <td align="right" style="color:#94a3b8;font-size:12px;">Compte-Rendu de Validation</td>
            </tr>
          </table>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:24px;">
          <p style="margin:0 0 16px;color:#1e293b;font-size:15px;">Bonjour,</p>
          <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">
            Vous recevez le compte-rendu de validation (CRV) pour le document ci-dessous,
            envoye par <strong>${senderName}</strong> le ${reportDate}.
          </p>

          <!-- Document info card -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:8px;margin:0 0 20px;">
            <tr><td style="padding:16px;">
              <p style="margin:0 0 8px;color:#64748b;font-size:12px;text-transform:uppercase;">Document</p>
              <p style="margin:0 0 12px;color:#1e293b;font-size:15px;font-weight:600;">${docName}</p>
              <span style="display:inline-block;background-color:${statusColor}15;color:${statusColor};font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;">
                ${statusLabel}
              </span>
            </td></tr>
          </table>

          ${
            reportUrl
              ? `
          <p style="margin:0 0 20px;" align="center">
            <a href="${reportUrl}" style="display:inline-block;background-color:#1e293b;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
              Telecharger le rapport
            </a>
          </p>
          `
              : ''
          }
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 24px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.5;">
            Ce rapport a ete genere automatiquement par ADVIST (Atlas Studio).<br>
            Conforme a la Loi ivoirienne n&deg;2013-546 relative aux transactions electroniques.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // Send email to all recipients via Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 503,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const sendResults: Array<{ email: string; success: boolean; error?: string }> = [];

    for (const recipientEmail of recipients) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Advist <notifications@advist.app>',
            to: recipientEmail,
            subject: `[ADVIST] Compte-Rendu de Validation - ${docName}`,
            html: emailHtml,
          }),
        });

        sendResults.push({
          email: recipientEmail,
          success: emailResponse.ok,
          error: emailResponse.ok ? undefined : `HTTP ${emailResponse.status}`,
        });
      } catch {
        sendResults.push({
          email: recipientEmail,
          success: false,
          error: 'Send failed',
        });
      }
    }

    const sentCount = sendResults.filter((r) => r.success).length;

    return new Response(
      JSON.stringify({
        success: sentCount > 0,
        report_id,
        document_name: docName,
        total_recipients: recipients.length,
        sent: sentCount,
        failed: recipients.length - sentCount,
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
