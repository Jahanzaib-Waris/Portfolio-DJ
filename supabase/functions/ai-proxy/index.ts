import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 1. Authenticate caller (Must be a logged-in admin user)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized: Missing Authorization header" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized: Invalid or expired session token" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { provider = "ollama_cloud", action = "chat", apiKey, model, messages, temperature = 0.7 } = body;

    // Handle Ollama Cloud
    if (provider === "ollama_cloud") {
      if (!apiKey) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing Ollama Cloud API key" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "test") {
        const testRes = await fetch("https://ollama.com/api/tags", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: "application/json",
          },
        });

        if (!testRes.ok) {
          const errText = await testRes.text();
          return new Response(
            JSON.stringify({
              success: false,
              status: testRes.status,
              error: `Ollama Cloud verification failed (${testRes.status}): ${errText}`,
            }),
            { status: testRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const data = await testRes.json().catch(() => ({}));
        const models = (data.models || []).map((m: { name: string }) => m.name);

        return new Response(
          JSON.stringify({
            success: true,
            models,
            message: `Connected to Ollama Cloud! Available models: ${models.slice(0, 3).join(", ")}...`,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Action chat via OpenAI-compatible endpoint or api/chat fallback
      const targetModel = model || "deepseek-v4.1-flash";
      let chatRes = await fetch("https://ollama.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: targetModel,
          messages,
          temperature,
        }),
      });

      if (!chatRes.ok) {
        // Fallback to /api/chat
        chatRes = await fetch("https://ollama.com/api/chat", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: targetModel,
            messages,
            stream: false,
          }),
        });
      }

      if (!chatRes.ok) {
        const errText = await chatRes.text();
        return new Response(
          JSON.stringify({
            success: false,
            status: chatRes.status,
            error: `Ollama Cloud chat failed (${chatRes.status}): ${errText}`,
          }),
          { status: chatRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const chatData = await chatRes.json();
      return new Response(JSON.stringify({ success: true, data: chatData }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default error if unknown provider
    return new Response(
      JSON.stringify({ success: false, error: `Unsupported provider: ${provider}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
