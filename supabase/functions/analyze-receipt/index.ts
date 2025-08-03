import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting receipt analysis...');
    
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    const requestBody = await req.json();
    console.log('Request received:', Object.keys(requestBody));
    
    const { imageBase64 } = requestBody;
    
    if (!imageBase64) {
      console.error('No image data provided');
      throw new Error('No image data provided');
    }

    console.log('Image data received, length:', imageBase64.length);
    console.log('Sending image to OpenAI for analysis...');

    const openAIRequest = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Você é um assistente especializado em extrair informações de cupons fiscais e recibos em português brasileiro. 
          
          Analise a imagem do cupom/recibo e extraia as seguintes informações:
          1. Valor total da compra (sempre em formato numérico, ex: 25.50)
          2. Data da compra (formato YYYY-MM-DD)
          3. Local/estabelecimento onde foi realizada a compra
          4. Categoria do gasto (escolha entre: food, transport, accommodation, shopping, attractions, entertainment, miscellaneous)
          5. Descrição do gasto (resumo do que foi comprado)
          
          Retorne APENAS um objeto JSON válido com as chaves: amount, date, location, category, description.
          Se não conseguir identificar alguma informação, use null para o campo correspondente.
          
          Exemplo de resposta:
          {
            "amount": 45.90,
            "date": "2024-01-15",
            "location": "Restaurante do João",
            "category": "food",
            "description": "Almoço - prato principal e bebida"
          }`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analise este cupom fiscal brasileiro e extraia as informações solicitadas. Se a imagem estiver difícil de ler, tente o seu melhor para extrair pelo menos algumas informações:'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: 'auto'
              }
            }
          ]
        }
      ],
      max_tokens: 800,
      temperature: 0.2
    };

    console.log('Making OpenAI API request...');

    // Criar a requisição com timeout mais generoso
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openAIRequest),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');
    
    const aiResponse = data.choices[0].message.content;
    console.log('AI extracted text:', aiResponse);

    // Parse the JSON response from AI
    let extractedData;
    try {
      // Remove any markdown formatting if present
      const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      extractedData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', aiResponse);
      throw new Error('AI response was not valid JSON');
    }

    console.log('Successfully extracted data:', extractedData);

    return new Response(JSON.stringify({
      success: true,
      data: extractedData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-receipt function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});