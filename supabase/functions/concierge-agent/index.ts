import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função para buscar imagem real no Unsplash
async function searchUnsplashImage(query: string): Promise<string | null> {
  if (!UNSPLASH_ACCESS_KEY) {
    console.log('Unsplash access key not available, skipping Unsplash search');
    return null;
  }

  try {
    console.log('Searching Unsplash for:', query);
    const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    });

    if (!response.ok) {
      console.error('Unsplash API error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      console.log('Found Unsplash image');
      return data.results[0].urls.regular;
    }

    console.log('No Unsplash images found');
    return null;
  } catch (error) {
    console.error('Error searching Unsplash:', error);
    return null;
  }
}

// Função para buscar imagem na Wikipedia
async function searchWikipediaImage(query: string): Promise<string | null> {
  try {
    console.log('Searching Wikipedia for:', query);
    
    // Primeiro busca por artigos relacionados
    const searchResponse = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=1`
    );
    
    if (!searchResponse.ok) {
      console.error('Wikipedia search error:', searchResponse.status);
      return null;
    }
    
    const searchData = await searchResponse.json();
    if (!searchData.query?.search?.length) {
      console.log('No Wikipedia articles found');
      return null;
    }
    
    const pageId = searchData.query.search[0].pageid;
    
    // Busca imagens do artigo
    const imagesResponse = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&pageids=${pageId}&prop=images&format=json&origin=*&imlimit=5`
    );
    
    if (!imagesResponse.ok) {
      console.error('Wikipedia images error:', imagesResponse.status);
      return null;
    }
    
    const imagesData = await imagesResponse.json();
    const images = imagesData.query?.pages?.[pageId]?.images;
    
    if (!images?.length) {
      console.log('No images found in Wikipedia article');
      return null;
    }
    
    // Procura por uma imagem que não seja ícone/logo
    for (const image of images) {
      const filename = image.title;
      if (filename.includes('.jpg') || filename.includes('.jpeg') || filename.includes('.png')) {
        // Busca URL da imagem
        const imageResponse = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json&origin=*`
        );
        
        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          const pages = imageData.query?.pages;
          const page = pages ? Object.values(pages)[0] as any : null;
          
          if (page?.imageinfo?.[0]?.url) {
            console.log('Found Wikipedia image');
            return page.imageinfo[0].url;
          }
        }
      }
    }
    
    console.log('No suitable Wikipedia images found');
    return null;
  } catch (error) {
    console.error('Error searching Wikipedia:', error);
    return null;
  }
}

// Função para buscar imagem real (combinando várias fontes)
async function findRealImage(name: string, type: 'restaurant' | 'attraction', location?: string): Promise<string | null> {
  console.log(`Searching real image for ${type}:`, name, location);
  
  // Criar query de busca otimizada
  let searchQuery = name;
  if (location) {
    searchQuery += ` ${location}`;
  }
  if (type === 'restaurant') {
    searchQuery += ` restaurant food`;
  } else {
    searchQuery += ` tourism travel`;
  }
  
  // Tentar Unsplash primeiro (melhor qualidade)
  let imageUrl = await searchUnsplashImage(searchQuery);
  
  // Se não encontrou no Unsplash, tentar Wikipedia
  if (!imageUrl) {
    imageUrl = await searchWikipediaImage(name);
  }
  
  // Se ainda não encontrou, tentar busca mais genérica
  if (!imageUrl && type === 'restaurant') {
    imageUrl = await searchUnsplashImage(`${location || 'restaurant'} food cuisine`);
  } else if (!imageUrl && type === 'attraction') {
    imageUrl = await searchUnsplashImage(`${location || 'tourism'} travel destination`);
  }
  
  console.log(`Real image search result for "${name}":`, imageUrl ? 'SUCCESS' : 'NOT FOUND');
  return imageUrl;
}

// Função para gerar imagem usando OpenAI (fallback)
async function generateImage(prompt: string): Promise<string | null> {
  if (!OPENAI_API_KEY) {
    console.log('OpenAI API key not available, skipping image generation');
    return null;
  }

  console.log('Generating AI image with prompt:', prompt);

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'b64_json'
      }),
    });

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI image generation failed:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log('OpenAI response data structure:', {
      hasData: !!data.data,
      dataLength: data.data?.length,
      hasB64: !!data.data?.[0]?.b64_json
    });

    if (data.data && data.data[0] && data.data[0].b64_json) {
      console.log('AI image generated successfully');
      return `data:image/png;base64,${data.data[0].b64_json}`;
    }
    
    console.log('No image data in response');
    return null;
  } catch (error) {
    console.error('Error generating AI image:', error);
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
- No texto amigável (PARTE 1), SEMPRE termine com uma seção "**📍 Endereços:**" após uma linha em branco, listando cada endereço completo em linhas separadas.

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
        
        // Imagens desativadas por configuração
        console.log('Image lookup/generation disabled; skipping image search');
        
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