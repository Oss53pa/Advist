import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Recipient {
  phone: string;
  name: string;
}

interface BulkSendPayload {
  recipients: Recipient[];
  template_name: string;
  template_params?: string[];
  language?: string;
}

interface SendResult {
  phone: string;
  name: string;
  success: boolean;
  message_id?: string;
  error?: string;
}

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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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

    const payload: BulkSendPayload = await req.json();

    if (!payload.recipients || payload.recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "recipients array is required and must not be empty" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!payload.template_name) {
      return new Response(
        JSON.stringify({ error: "template_name is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const results: SendResult[] = [];
    let successCount = 0;
    let failCount = 0;

    // Send to each recipient
    for (const recipient of payload.recipients) {
      try {
        const messageBody = {
          messaging_product: "whatsapp",
          to: recipient.phone,
          type: "template",
          template: {
            name: payload.template_name,
            language: { code: payload.language || "fr" },
            components: payload.template_params
              ? [
                  {
                    type: "body",
                    parameters: payload.template_params.map((p) => ({
                      type: "text",
                      text: p.replace("{{name}}", recipient.name),
                    })),
                  },
                ]
              : [],
          },
        };

        const response = await fetch(
          `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${WHATSAPP_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(messageBody),
          }
        );

        const result = await response.json();

        if (response.ok) {
          const messageId = result.messages?.[0]?.id;
          results.push({
            phone: recipient.phone,
            name: recipient.name,
            success: true,
            message_id: messageId,
          });
          successCount++;

          // Store in notifications table
          await supabase.from("notifications").insert({
            type: "whatsapp_bulk",
            title: `WhatsApp: ${payload.template_name}`,
            message: `Template sent to ${recipient.name} (${recipient.phone})`,
            status: "sent",
            organization_id: profile?.organization_id,
            metadata: {
              whatsapp_message_id: messageId,
              recipient_phone: recipient.phone,
              recipient_name: recipient.name,
              template_name: payload.template_name,
              delivery_status: "sent",
              sent_at: new Date().toISOString(),
              sent_by: user.id,
            },
          });
        } else {
          results.push({
            phone: recipient.phone,
            name: recipient.name,
            success: false,
            error: result.error?.message || "Send failed",
          });
          failCount++;
        }
      } catch (err) {
        results.push({
          phone: recipient.phone,
          name: recipient.name,
          success: false,
          error: (err as Error).message,
        });
        failCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: payload.recipients.length,
        sent: successCount,
        failed: failCount,
        results,
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
