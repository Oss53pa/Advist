import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Auth check
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

    const { channel, recipient } = await req.json();

    if (!channel || !recipient) {
      return new Response(
        JSON.stringify({ error: "channel and recipient are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!["email", "whatsapp", "sms"].includes(channel)) {
      return new Response(
        JSON.stringify({
          error: "Invalid channel. Must be one of: email, whatsapp, sms",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let delivered = false;
    const now = new Date().toISOString();

    if (channel === "email") {
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (!RESEND_API_KEY) {
        return new Response(
          JSON.stringify({ error: "Email service not configured (RESEND_API_KEY missing)" }),
          {
            status: 503,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Advist <notifications@advist.app>",
          to: recipient,
          subject: "[ADVIST] Test de notification email",
          html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
              <h2 style="color:#1e293b;">Test de notification ADVIST</h2>
              <p style="color:#475569;">Ce message confirme que le canal <strong>email</strong> est correctement configure.</p>
              <p style="color:#94a3b8;font-size:12px;">Envoye le ${new Date().toLocaleString("fr-FR")} par ADVIST (Atlas Studio).</p>
            </div>
          `,
        }),
      });

      delivered = emailResponse.ok;
    } else if (channel === "whatsapp") {
      const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_API_TOKEN");
      const WHATSAPP_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_ID");

      if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
        return new Response(
          JSON.stringify({ error: "WhatsApp not configured" }),
          {
            status: 503,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const waResponse = await fetch(
        `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: recipient,
            type: "text",
            text: {
              body: "[ADVIST] Ceci est un message de test. Votre canal WhatsApp est correctement configure.",
            },
          }),
        }
      );

      delivered = waResponse.ok;
    } else if (channel === "sms") {
      // SMS channel placeholder - integrate with SMS provider when available
      return new Response(
        JSON.stringify({
          error: "SMS channel is not yet configured. Contact support to enable SMS notifications.",
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: delivered,
        channel,
        recipient,
        delivered_at: delivered ? now : null,
        message: delivered
          ? `Test ${channel} sent successfully to ${recipient}`
          : `Failed to send test ${channel} to ${recipient}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
