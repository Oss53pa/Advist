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

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { document_id, target_language } = await req.json();

    // Fetch document content
    const { data: doc, error } = await supabase
      .from("documents")
      .select("title, content, summary")
      .eq("id", document_id)
      .single();

    if (error || !doc) {
      return new Response(
        JSON.stringify({ error: "Document not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use Claude for translation via server-side API key
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Translation service not configured" }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const languageNames: Record<string, string> = {
      en: "English",
      fr: "French",
      es: "Spanish",
      de: "German",
      pt: "Portuguese",
      ar: "Arabic",
    };

    const targetLangName = languageNames[target_language] || target_language;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        system:
          "You are a professional document translator. Translate the provided document content accurately while preserving formatting. Return a JSON object with keys: title, summary, content.",
        messages: [
          {
            role: "user",
            content: `Translate the following document to ${targetLangName}. Return ONLY valid JSON with keys "title", "summary", "content".\n\nTitle: ${doc.title}\nSummary: ${doc.summary || ""}\nContent: ${doc.content || ""}`,
          },
        ],
      }),
    });

    const aiResult = await response.json();
    const translatedText =
      aiResult?.content?.[0]?.text || "{}";

    let translated;
    try {
      translated = JSON.parse(translatedText);
    } catch {
      translated = {
        title: translatedText,
        summary: "",
        content: translatedText,
      };
    }

    return new Response(
      JSON.stringify({
        ...translated,
        language: target_language,
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
