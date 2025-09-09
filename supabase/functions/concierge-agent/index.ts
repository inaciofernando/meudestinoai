import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null as any;

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

// Helper function to get user AI configuration
async function getUserAIConfig(userId: string) {
  console.log('=== getUserAIConfig DEBUG ===');
  console.log('Input userId:', userId);
  console.log('userId type:', typeof userId);
  console.log('Supabase client exists:', !!supabase);
  
  // For testing, let's force Fernando's config if no valid user
  if (!userId || userId === 'anonymous') {
    console.log('No userId provided, checking for Fernando Costa profile...');
    if (supabase) {
      try {
        const { data: fernandoProfile, error } = await supabase
          .from('profiles')
          .select('ai_model, ai_api_key, full_name')
          .eq('full_name', 'Fernando Costa')
          .maybeSingle();
          
        console.log('Fernando profile lookup:', { data: fernandoProfile, error: error?.message });
        
        if (fernandoProfile && fernandoProfile.ai_api_key) {
          console.log('Using Fernando Costa profile for anonymous user');
          return {
            model: fernandoProfile.ai_model || 'gpt-5-mini-2025-08-07',
            apiKey: fernandoProfile.ai_api_key
          };
        }
      } catch (err) {
        console.error('Error fetching Fernando profile:', err);
      }
    }
  }
  
  try {
    if (supabase && userId && userId !== 'anonymous') {
      console.log('Attempting to fetch user profile from Supabase...');
      const { data, error } = await supabase
        .from('profiles')
        .select('ai_model, ai_api_key, full_name')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('Supabase query result:', { 
        data: data ? { ...data, ai_api_key: data.ai_api_key ? '***HIDDEN***' : 'empty' } : null, 
        error: error?.message 
      });

      if (error) {
        console.error('Supabase error fetching profile:', error.message);
      } else if (data) {
        const model = data.ai_model || 'gemini-2.5-flash';
        const userApiKey = data.ai_api_key && data.ai_api_key.trim().length > 0 ? data.ai_api_key : null;
        const fallbackApiKey = model.startsWith('gpt-') ? OPENAI_API_KEY : GEMINI_API_KEY;
        const finalApiKey = userApiKey || fallbackApiKey;
        
        console.log('Profile processing result:', {
          fullName: data.full_name,
          model,
          hasUserApiKey: !!userApiKey,
          hasFallbackKey: !!fallbackApiKey,
          finalKeyFound: !!finalApiKey
        });
        
        return { model, apiKey: finalApiKey };
      } else {
        console.log('No profile data found for user');
      }
    } else {
      console.log('No supabase client or invalid userId, using defaults');
    }
  } catch (err) {
    console.error('Error fetching user AI config:', err);
  }

  // Fallback defaults
  console.log('Using fallback defaults: gemini-2.5-flash with system GEMINI key');
  return { model: 'gemini-2.5-flash', apiKey: GEMINI_API_KEY };
}

// Intent detection for efficient routing and token use
 type Intent = 'greeting' | 'general' | 'restaurant' | 'accommodation' | 'attraction';
 
 function detectIntent(text: string): Intent {
   const t = (text || '').toLowerCase();
   const isGreeting = /^(oi|olá|ola|hello|hi|hey|bom dia|boa tarde|boa noite)[!.\s]*$/i.test(t) ||
     /\b(obrigado|valeu)\b/i.test(t) && t.length < 30;
   if (isGreeting) return 'greeting';
 
   const accommodation = /(hotel|hospedagem|acomodação|acomodacao|pousada|resort|onde ficar|estadia|pernoite|accommodation)/i.test(t);
   if (accommodation) return 'accommodation';
 
   const restaurant = /(restaurante|comida|gastronomia|culinária|culinaria|onde comer|jantar|almoço|almoco|café da manhã|cafe da manha|food|restaurant)/i.test(t);
   if (restaurant) return 'restaurant';
 
   const attraction = /(atração|atracao|ponto turístico|ponto turistico|o que fazer|roteiro|passeio|museu|parque|praia|trilha|monumento|winery|vinícola|vinicola|attraction|things to do)/i.test(t);
   if (attraction) return 'attraction';
 
   return 'general';
 }
 
 function buildSystemForIntent(intent: Intent) {
   const base = [
     'Você é um concierge de viagens em português do Brasil.',
     'Seja direto, prático e amigável. Use bullets quando útil.',
     'Adapte-se ao contexto da viagem (datas, destino e região próxima).'
   ].join('\n');
 
   if (intent === 'restaurant') {
     return `${base}\n\nTarefa: recomendar restaurantes relevantes para o contexto.\n- Inclua dicas práticas (reservas, faixa de preço, quando ir).\n- No final, inclua APENAS um bloco de código JSON válido com os campos abaixo.\n\nExemplo:\n\n\`\`\`json\n{\n  "restaurant": {\n    "name": "",\n    "description": "",\n    "cuisine": "",\n    "address": "",\n    "link": "",\n    "tripadvisor": "",\n    "gmap": "",\n    "waze": "",\n    "phone": "",\n    "estimated_amount": "",\n    "price_band": "$$"\n  }\n}\n\`\`\`\n\nRegras: URLs completas (https://...), Google Maps no formato place/search. Nada além do bloco JSON após o texto.`;
   }
 
   if (intent === 'attraction') {
     return `${base}\n\nTarefa: sugerir atrações/atividades.\n- Inclua dicas de logística (horários, deslocamento).\n- No final, inclua APENAS um bloco JSON válido com os campos abaixo.\n\nExemplo:\n\n\`\`\`json\n{\n  "itinerary_item": {\n    "title": "",\n    "description": "",\n    "category": "attraction",\n    "location": "",\n    "address": "",\n    "link": "",\n    "tripadvisor_link": "",\n    "google_maps_link": "",\n    "waze_link": ""\n  }\n}\n\`\`\`\n\nRegras: URLs completas, nada além do bloco JSON após o texto.`;
   }
 
   if (intent === 'accommodation') {
     return `${base}\n\nTarefa: recomendar hospedagens (hotéis/pousadas).\n- Inclua dicas de localização e conveniências.\n- No final, inclua APENAS um bloco JSON válido com os campos abaixo (esquema ampliado).\n\nExemplo:\n\n\`\`\`json\n{\n  "accommodation": {\n    "name": "",\n    "description": "",\n    "type": "hotel",\n    "address": "",\n    "city": "",\n    "country": "",\n    "phone": "",\n    "email": "",\n    "website": "",\n    "booking_link": "",\n    "tripadvisor": "",\n    "google_maps_link": "",\n    "waze_link": "",\n    "check_in": "",\n    "check_out": "",\n    "amenities": [],\n    "price_band": "$$",\n    "estimated_amount_per_night": "",\n    "total_estimated_amount": "",\n    "notes": ""\n  }\n}\n\`\`\`\n\nRegras: URLs completas, Google Maps no formato place/search. Nada além do bloco JSON após o texto.`;
   }
 
   // General chat: no JSON
   return `${base}\n\nTarefa: conversa geral e dicas rápidas. RESPONDA sem incluir blocos JSON. Se precisar de mais contexto, faça perguntas objetivas.`;
 }
 
serve(async (req) => {
  console.log('=== CONCIERGE FUNCTION STARTED ===');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { prompt, tripId, tripContext, userId } = requestBody;
    
    console.log('=== FULL REQUEST DEBUG ===');
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    console.log('Received userId:', userId);
    console.log('User type:', typeof userId);
    console.log('Prompt length:', prompt?.length || 0);
    
    if (!prompt) {
      console.error('No prompt provided');
      return new Response(JSON.stringify({ error: "Missing prompt" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('=== FETCHING AI CONFIG ===');
    // Get user AI configuration
    const aiConfig = await getUserAIConfig(userId || 'anonymous');
    console.log('Final AI Config:', { 
      model: aiConfig.model, 
      hasApiKey: !!aiConfig.apiKey,
      apiKeyLength: aiConfig.apiKey?.length || 0,
      apiKeyStart: aiConfig.apiKey?.substring(0, 10) || 'none'
    });
    
    if (!aiConfig.apiKey) {
      console.error('No API key found for model:', aiConfig.model);
      return new Response(
        JSON.stringify({ error: `API key not configured for model ${aiConfig.model}. Please configure it in your profile settings.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Intent detection and dynamic system + token limits
    const intent = detectIntent(prompt);
    console.log('Detected intent:', intent);

    // Lightweight greeting: skip AI call entirely
    if (intent === 'greeting') {
      const destination = tripContext?.destination || tripContext?.title || '';
      const greeting = `Olá${destination ? `! Preparado(a) para ${destination}?` : '!'} Como posso ajudar na sua viagem? Posso sugerir restaurantes, hospedagens ou atrações. Diga, por exemplo: "restaurante italiano perto do hotel" ou "hospedagem em bairro central".`;
      return new Response(JSON.stringify({
        generatedText: greeting,
        fullResponse: greeting,
        generatedImages: [],
        structuredData: null
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const system = buildSystemForIntent(intent);

    const userText = `Contexto da Viagem:\n${JSON.stringify(tripContext || { id: tripId }, null, 2)}\n\nPergunta do usuário:\n${prompt}`;

    // Token limits per intent (OpenAI only)
    const tokenLimits: Record<Intent, number> = {
      greeting: 0,
      general: 800,
      restaurant: 1400,
      accommodation: 1800,
      attraction: 1400,
    };
    const maxTokens = tokenLimits[intent];
    console.log('Token limit for intent:', { intent, maxTokens });

    let fullText = "";
    let resp;

    // Choose API based on model
    console.log('=== AI API CALL ===');
    console.log('Using model:', aiConfig.model);
    console.log('API Key starts with:', aiConfig.apiKey?.substring(0, 10) + '...');
    
    if (aiConfig.model.startsWith('gpt-')) {
      const normalizedMap: Record<string, string> = {
        'gpt-5': 'gpt-5-2025-08-07',
        'gpt-5-mini': 'gpt-5-mini-2025-08-07',
        'gpt-5-nano': 'gpt-5-nano-2025-08-07',
        'gpt-4.1': 'gpt-4.1-2025-04-14',
        'gpt-4.1-mini': 'gpt-4.1-mini-2025-04-14'
      };
      const providerModel = normalizedMap[aiConfig.model] || aiConfig.model;
      console.log('Making OpenAI API call with model:', providerModel);
      // OpenAI/ChatGPT API
      const openAIBody = {
        model: providerModel,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userText }
        ],
        max_completion_tokens: maxTokens
      };

      console.log('OpenAI request body model:', openAIBody.model);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${aiConfig.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(openAIBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('OpenAI response status:', resp.status);

      if (!resp.ok) {
        const errTxt = await resp.text();
        console.error('OpenAI API error:', resp.status, errTxt);
        throw new Error(`OpenAI API error ${resp.status}: ${errTxt}`);
      }

      const data = await resp.json();
      fullText = data?.choices?.[0]?.message?.content || "";
      console.log('OpenAI response received, length:', fullText.length);
    } else {
      console.log('Making Gemini API call...');
      // Gemini/Google API
      const body = {
        contents: [
          { role: "user", parts: [{ text: system + "\n\n" + userText }] },
        ],
      };

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${aiConfig.model}:generateContent?key=${aiConfig.apiKey}`;
      console.log('Gemini URL:', url.replace(aiConfig.apiKey, 'HIDDEN_KEY'));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('Gemini response status:', resp.status);

      if (!resp.ok) {
        const errTxt = await resp.text();
        console.error('Gemini API error:', resp.status, errTxt);
        throw new Error(`Gemini API error ${resp.status}: ${errTxt}`);
      }

      const data = await resp.json();
      fullText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      console.log('Gemini response received, length:', fullText.length);
    }

    // Separar o texto da resposta do JSON interno
    const jsonMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/);
    let cleanText = fullText;
    let structuredData = null;
    let generatedImages = [];

    if (jsonMatch && (intent === 'restaurant' || intent === 'accommodation' || intent === 'attraction')) {
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

    // Fallback: se só veio JSON (sem texto), criar uma resposta curta amigável
    if ((!cleanText || cleanText.trim().length === 0) && structuredData) {
      try {
        if ((structuredData as any).restaurant) {
          const r = (structuredData as any).restaurant;
          cleanText = [
            `Sugestão de restaurante: ${r.name || 'opção recomendada'}.`,
            r.cuisine ? `Culinária: ${r.cuisine}.` : '',
            r.address ? `Endereço: ${r.address}.` : '',
            r.price_band ? `Faixa de preço: ${r.price_band}.` : '',
          ].filter(Boolean).join(' ');
        } else if ((structuredData as any).itinerary_item) {
          const i = (structuredData as any).itinerary_item;
          cleanText = [
            `Sugestão de passeio: ${i.title || 'atração recomendada'}.`,
            i.description ? i.description : '',
            i.address ? `Endereço: ${i.address}.` : ''
          ].filter(Boolean).join(' ');
        } else if ((structuredData as any).accommodation) {
          const a = (structuredData as any).accommodation;
          cleanText = [
            `Sugestão de hospedagem: ${a.name || 'opção recomendada'} (${a.type || 'hotel'}).`,
            a.description ? a.description : '',
            a.address ? `Endereço: ${a.address}.` : ''
          ].filter(Boolean).join(' ');
        }
      } catch (_) {
        cleanText = 'Encontrei uma boa opção para você (detalhes no cartão abaixo).';
      }
    }

    // Se ainda não houver texto, garanta uma resposta mínima
    if (!cleanText || cleanText.trim().length === 0) {
      cleanText = 'Certo! Estou analisando sua pergunta e posso sugerir opções específicas. Pode detalhar preferências (horário, orçamento, estilo)?';
    }

    // Retornar o texto limpo + JSON oculto para uso dos botões de ação + imagens geradas
    console.log('=== RESPONSE PREPARATION ===');
    console.log('Clean text length:', cleanText.length);
    console.log('Has structured data:', !!structuredData);
    console.log('Generated images count:', generatedImages.length);
    
    return new Response(JSON.stringify({ 
      generatedText: cleanText,
      fullResponse: fullText, // Inclui o JSON para os botões de ação
      generatedImages: generatedImages, // Imagens AI geradas
      structuredData: structuredData // Dados estruturados para os botões
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error('=== ERROR IN CONCIERGE ===');
    console.error('Error details:', e);
    return new Response(JSON.stringify({ error: e.message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});