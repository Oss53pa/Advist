import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  recipient_id: string;
  type: string;
  title: string;
  message: string;
  channels: ("in_app" | "email" | "whatsapp" | "sms")[];
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Email Templates — responsive HTML with branding
// ---------------------------------------------------------------------------

function buildEmailHtml(
  firstName: string,
  subject: string,
  message: string,
  type: string,
  metadata?: Record<string, unknown>,
): string {
  const actionUrl = metadata?.action_url as string || "";
  const actionLabel = metadata?.action_label as string || "Ouvrir dans ADVIST";
  const documentName = metadata?.document_name as string || "";

  // Type-specific styling
  const typeConfig: Record<string, { color: string; icon: string; label: string }> = {
    workflow: { color: "#1e293b", icon: "📋", label: "Circuit de validation" },
    document: { color: "#1e293b", icon: "📄", label: "Document" },
    signature: { color: "#059669", icon: "✍️", label: "Signature requise" },
    task: { color: "#d97706", icon: "⏳", label: "Action requise" },
    system: { color: "#6b7280", icon: "⚙️", label: "Systeme" },
    warning: { color: "#dc2626", icon: "⚠️", label: "Attention" },
    success: { color: "#059669", icon: "✅", label: "Succes" },
    info: { color: "#3b82f6", icon: "ℹ️", label: "Information" },
  };

  const config = typeConfig[type] || typeConfig.info;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
    <tr><td align="center" style="padding:24px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

        <!-- Header -->
        <tr><td style="background-color:#1e293b;padding:20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color:#ffffff;font-size:20px;font-weight:bold;font-style:italic;">Advist</td>
              <td align="right" style="color:#94a3b8;font-size:12px;">${config.label}</td>
            </tr>
          </table>
        </td></tr>

        <!-- Type badge -->
        <tr><td style="padding:20px 24px 0;">
          <span style="display:inline-block;background-color:${config.color}15;color:${config.color};font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;">
            ${config.icon} ${config.label}
          </span>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:16px 24px;">
          <p style="margin:0 0 12px;color:#1e293b;font-size:15px;">Bonjour${firstName ? ` ${firstName}` : ""},</p>
          <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">${message}</p>
          ${documentName ? `<p style="margin:0 0 16px;padding:12px;background-color:#f8fafc;border-left:3px solid ${config.color};border-radius:4px;color:#334155;font-size:13px;">Document : <strong>${documentName}</strong></p>` : ""}
        </td></tr>

        <!-- CTA Button -->
        ${actionUrl ? `
        <tr><td style="padding:0 24px 24px;" align="center">
          <a href="${actionUrl}" style="display:inline-block;background-color:#1e293b;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">${actionLabel}</a>
        </td></tr>
        ` : ""}

        <!-- Footer -->
        <tr><td style="padding:16px 24px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.5;">
            Cet email a ete envoye automatiquement par ADVIST (Atlas Studio).<br>
            Si vous n'etes pas concerne, ignorez ce message.<br>
            Conforme a la Loi ivoirienne n°2013-546 relative aux transactions electroniques.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization")!;
    const {
      data: { user },
    } = await createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload: NotificationPayload = await req.json();

    // 1. Always create in-app notification
    const { error: dbError } = await supabase.from("notifications").insert({
      recipient_id: payload.recipient_id,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      metadata: payload.metadata || {},
      status: "unread",
      organization_id: (
        await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", user.id)
          .single()
      ).data?.organization_id,
    });

    if (dbError) throw dbError;

    // 2. Get recipient preferences
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", payload.recipient_id)
      .single();

    // 3. Send email if requested and enabled
    if (
      payload.channels.includes("email") &&
      prefs?.email_notifications !== false
    ) {
      const { data: recipientProfile } = await supabase
        .from("profiles")
        .select("email, first_name")
        .eq("id", payload.recipient_id)
        .single();

      if (recipientProfile?.email) {
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        if (RESEND_API_KEY) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Advist <notifications@advist.app>",
              to: recipientProfile.email,
              subject: payload.title,
              html: buildEmailHtml(
                recipientProfile.first_name || "",
                payload.title,
                payload.message,
                payload.type,
                payload.metadata,
              ),
            }),
          });
        }
      }
    }

    // 4. Send WhatsApp if requested
    if (
      payload.channels.includes("whatsapp") &&
      prefs?.whatsapp_notifications
    ) {
      const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_API_TOKEN");
      const WHATSAPP_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_ID");
      if (WHATSAPP_TOKEN && WHATSAPP_PHONE_ID) {
        const { data: recipientProfile } = await supabase
          .from("profiles")
          .select("phone")
          .eq("id", payload.recipient_id)
          .single();

        if (recipientProfile?.phone) {
          await fetch(
            `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${WHATSAPP_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                to: recipientProfile.phone,
                type: "text",
                text: { body: `${payload.title}\n\n${payload.message}` },
              }),
            }
          );
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
