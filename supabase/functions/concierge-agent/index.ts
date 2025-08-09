import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured. Set GEMINI_API_KEY in Supabase secrets." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { prompt, tripId, tripContext } = await req.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Missing prompt" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system = `Você é um Concierge de viagens em português do Brasil. Responda SOMENTE no contexto da viagem informada.
- Use tom claro, objetivo e amigável.
- Se o pedido extrapolar a viagem/contexto, explique brevemente e traga alternativas relacionadas.
- Quando for útil, sugira um roteiro ou lista com bullets, links oficiais e dicas práticas (horários, reservas, deslocamento, custos aproximados).
- Mantenha foco no destino(s) da viagem fornecida e conexões lógicas entre cidades próximas (ex.: Napa ↔ Los Angeles, São Francisco ↔ Los Angeles).
- Inclua justificativa de por que a sugestão combina com o contexto da viagem.
`;

    const userText = `Contexto da Viagem:\n${JSON.stringify(tripContext || { id: tripId }, null, 2)}\n\nPergunta do usuário:\n${prompt}`;

    const body = {
      contents: [
        { role: "user", parts: [{ text: system + "\n\n" + userText }] },
      ],
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      const errTxt = await resp.text();
      throw new Error(`Gemini API error ${resp.status}: ${errTxt}`);
    }

    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return new Response(JSON.stringify({ generatedText: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});