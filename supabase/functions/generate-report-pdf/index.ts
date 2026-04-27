import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.98.0';
import { getCorsHeaders, optionsResponse } from '../_shared/cors.ts';

/**
 * Generates an HTML report suitable for client-side PDF rendering.
 * Since Deno Edge Functions lack native PDF libraries, this function
 * returns structured HTML that can be printed to PDF on the client,
 * or stores the HTML in Supabase Storage for later retrieval.
 */
function generateReportHtml(report: Record<string, unknown>): string {
  const docName = (report.document_name as string) || 'Document';
  const status = (report.status as string) || 'pending';
  const createdAt = (report.created_at as string) || new Date().toISOString();
  const signers = (report.signers as Array<Record<string, unknown>>) || [];
  const auditTrail = (report.audit_trail as Array<Record<string, unknown>>) || [];

  const statusColor = status === 'valid' ? '#059669' : '#d97706';
  const statusLabel = status === 'valid' ? 'VALIDE' : 'EN ATTENTE';
  const reportDate = new Date(createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const signersRows = signers
    .map(
      (s) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${s.name || '-'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${s.role || '-'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${s.status || '-'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${s.signed_at ? new Date(s.signed_at as string).toLocaleDateString('fr-FR') : '-'}</td>
    </tr>`
    )
    .join('');

  const auditRows = auditTrail
    .map(
      (entry) => `
    <tr>
      <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;font-size:12px;">${entry.timestamp ? new Date(entry.timestamp as string).toLocaleString('fr-FR') : '-'}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;font-size:12px;">${entry.action || '-'}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;font-size:12px;">${entry.actor || '-'}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;font-size:12px;">${entry.details || '-'}</td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>CRV - ${docName}</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; }
      .no-print { display: none; }
    }
    body { font-family: Arial, Helvetica, sans-serif; color: #1e293b; line-height: 1.5; max-width: 800px; margin: 0 auto; padding: 40px 24px; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    h2 { font-size: 16px; color: #334155; margin: 24px 0 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin: 0 0 16px; }
    th { text-align: left; padding: 8px 12px; background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; font-size: 13px; color: #64748b; text-transform: uppercase; }
    .meta { display: flex; gap: 24px; margin: 16px 0; flex-wrap: wrap; }
    .meta-item { font-size: 13px; color: #64748b; }
    .meta-item strong { color: #1e293b; display: block; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;">
    <div>
      <h1>Compte-Rendu de Validation</h1>
      <p style="margin:0;color:#64748b;font-size:13px;">ADVIST - Atlas Studio</p>
    </div>
    <span class="badge" style="background-color:${statusColor}15;color:${statusColor};">${statusLabel}</span>
  </div>

  <div class="meta">
    <div class="meta-item"><strong>${docName}</strong>Document</div>
    <div class="meta-item"><strong>${reportDate}</strong>Date du rapport</div>
    <div class="meta-item"><strong>${report.report_id || report.id || '-'}</strong>Reference</div>
  </div>

  ${
    signers.length > 0
      ? `
  <h2>Signataires</h2>
  <table>
    <thead>
      <tr>
        <th>Nom</th>
        <th>Role</th>
        <th>Statut</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>${signersRows}</tbody>
  </table>
  `
      : ''
  }

  ${
    auditTrail.length > 0
      ? `
  <h2>Piste d'audit</h2>
  <table>
    <thead>
      <tr>
        <th>Horodatage</th>
        <th>Action</th>
        <th>Acteur</th>
        <th>Details</th>
      </tr>
    </thead>
    <tbody>${auditRows}</tbody>
  </table>
  `
      : ''
  }

  <div class="footer">
    <p>Ce document a ete genere automatiquement par ADVIST (Atlas Studio).</p>
    <p>Conforme a la Loi ivoirienne n&deg;2013-546 relative aux transactions electroniques.</p>
  </div>
</body>
</html>`;
}

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

    const { report_id } = await req.json();

    if (!report_id) {
      return new Response(JSON.stringify({ error: 'report_id is required' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Fetch report data from storage
    const { data: reportData, error: downloadError } = await supabase.storage
      .from('validation-reports')
      .download(`${report_id}.json`);

    if (downloadError) {
      return new Response(JSON.stringify({ error: 'Report not found' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const reportText = await reportData.text();
    const report = JSON.parse(reportText);

    // Authorization: verify user belongs to the report's organization
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (report.organization_id && userProfile?.organization_id !== report.organization_id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Generate HTML report
    const html = generateReportHtml(report);

    // Store the HTML version in Supabase Storage for later retrieval
    const htmlBlob = new Blob([html], { type: 'text/html' });
    await supabase.storage.from('validation-reports').upload(`${report_id}.html`, htmlBlob, {
      contentType: 'text/html',
      upsert: true,
    });

    // Generate a signed URL for the HTML report
    const { data: signedUrlData } = await supabase.storage
      .from('validation-reports')
      .createSignedUrl(`${report_id}.html`, 60 * 60 * 24); // 24h

    // Encode HTML as base64 for client-side use
    const encoder = new TextEncoder();
    const htmlBytes = encoder.encode(html);
    const base64Html = btoa(String.fromCharCode(...htmlBytes));

    return new Response(
      JSON.stringify({
        success: true,
        report_id,
        format: 'html',
        html_base64: base64Html,
        download_url: signedUrlData?.signedUrl || null,
        note: 'Use window.print() or a client-side library to convert this HTML to PDF',
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
