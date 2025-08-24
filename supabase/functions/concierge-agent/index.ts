import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função para gerar imagem usando OpenAI
async function generateImage(prompt: string): Promise<string | null> {
  if (!OPENAI_API_KEY) {
    console.log('OpenAI API key not available, skipping image generation');
    return null;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'b64_json'
      }),
    });

    if (!response.ok) {
      console.error('OpenAI image generation failed:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    if (data.data && data.data[0] && data.data[0].b64_json) {
      return `data:image/png;base64,${data.data[0].b64_json}`;
    }
    
    return null;
  } catch (error) {
    console.error('Error generating image:', error);
    return null;
  }
}

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

SAÍDA PADRONIZADA (OBRIGATÓRIA):
- Sempre responda em DUAS PARTES:
  1) Texto amigável para o usuário (em português)
  2) Um ÚNICO bloco de código JSON válido (sem comentários), delimitado por \`\`\`json ... \`\`\`, exatamente com os campos abaixo. Se algum campo não existir, use string vazia "".

Exemplo de estrutura do JSON a ser SEMPRE incluído no final:
\`\`\`json
{
  "restaurant": {
    "name": "",
    "description": "",
    "cuisine": "",
    "address": "",
    "link": "",
    "tripadvisor": "",
    "gmap": "",
    "waze": "",
    "phone": "",
    "estimated_amount": "",
    "price_band": "$$"
  },
  "itinerary_item": {
    "title": "",
    "description": "",
    "category": "attraction",
    "location": "",
    "address": "",
    "link": "",
    "tripadvisor_link": "",
    "google_maps_link": "",
    "waze_link": ""
  }
}
\`\`\`

Regras adicionais importantes:
- Retorne URLs completas (https://...)
- Para Google Maps, use o formato https://www.google.com/maps/place/... ou https://www.google.com/maps/search/?api=1&query=... (evite links encurtados como maps.app.goo.gl ou goo.gl/maps)
- price_band deve ser um dentre: $, $$, $$$, $$$$
- Para restaurantes, preencha o máximo possível: endereço, tipo de culinária, site, TripAdvisor, Google Maps e Waze
- Para itinerários, inclua: endereço completo, site oficial, links do TripAdvisor, Google Maps e Waze quando relevante
- Não inclua nada além do bloco JSON após a parte textual (para facilitar a leitura automática)
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
    const fullText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Separar o texto da resposta do JSON interno
    const jsonMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/);
    let cleanText = fullText;
    let structuredData = null;
    let generatedImages = [];

    if (jsonMatch) {
      // Remove o bloco JSON da resposta do usuário
      cleanText = fullText.replace(/```json\s*[\s\S]*?\s*```/g, '').trim();
      
      // Tentar parsear o JSON para uso interno (opcional)
      try {
        structuredData = JSON.parse(jsonMatch[1]);
        console.log('Extracted structured data:', structuredData);
        
        // Gerar imagens se houver dados estruturados
        const imagePromises = [];
        
        if (structuredData.restaurant && structuredData.restaurant.name) {
          const restaurantPrompt = `Professional food photography of ${structuredData.restaurant.name} restaurant, ${structuredData.restaurant.cuisine || 'cuisine'} food, elegant dining atmosphere, warm lighting, high quality commercial photography`;
          imagePromises.push(
            generateImage(restaurantPrompt).then(img => ({ type: 'restaurant', image: img }))
          );
        }
        
        if (structuredData.itinerary_item && structuredData.itinerary_item.title) {
          const attractionPrompt = `Professional travel photography of ${structuredData.itinerary_item.title}, ${structuredData.itinerary_item.location || 'tourist destination'}, beautiful landscape, architectural details, tourism photography, high quality`;
          imagePromises.push(
            generateImage(attractionPrompt).then(img => ({ type: 'attraction', image: img }))
          );
        }
        
        if (imagePromises.length > 0) {
          console.log('Generating images for structured data...');
          const imageResults = await Promise.all(imagePromises);
          generatedImages = imageResults.filter(result => result.image !== null);
          console.log(`Generated ${generatedImages.length} images`);
        }
        
      } catch (parseError) {
        console.log('Failed to parse JSON, continuing with text only:', parseError);
      }
    }

    // Retornar o texto limpo + JSON oculto para uso dos botões de ação + imagens geradas
    return new Response(JSON.stringify({ 
      generatedText: cleanText,
      fullResponse: fullText, // Inclui o JSON para os botões de ação
      generatedImages: generatedImages, // Imagens AI geradas
      structuredData: structuredData // Dados estruturados para os botões
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});