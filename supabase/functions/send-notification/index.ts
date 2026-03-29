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
              html: `<p>Bonjour ${recipientProfile.first_name || ""},</p><p>${payload.message}</p><p>— Advist</p>`,
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
