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
      return new Response(JSON.stringify({ 
        success: false,
        error: 'OpenAI API key not configured. Please configure OPENAI_API_KEY in Supabase secrets.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestBody = await req.json();
    console.log('Request received:', Object.keys(requestBody));
    
    const { imageBase64 } = requestBody;
    
    if (!imageBase64) {
      console.error('No image data provided');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'No image data provided' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Image data received, length:', imageBase64.length);
    
    // Validar se a imagem está em formato base64 válido
    if (!imageBase64.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
      console.error('Invalid base64 image format');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid image format. Please upload a valid image.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Sending image to OpenAI for analysis...');

    const openAIRequest = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Você é um assistente especializado em análise de cupons fiscais e gastos de viagem, funcionando como um concierge inteligente de despesas em português brasileiro.

⚠️ IMPORTANTE: Você DEVE preencher OBRIGATORIAMENTE os campos "category" E "subcategory".

CATEGORIAS E SUBCATEGORIAS DISPONÍVEIS:
1. "transport" (Transporte): ["Voo", "Táxi", "Uber", "Ônibus", "Trem", "Aluguel de Carro"]
2. "accommodation" (Hospedagem): ["Hotel", "Pousada", "Airbnb", "Hostel", "Resort"] 
3. "food" (Alimentação): ["Restaurante", "Fast Food", "Supermercado", "Café", "Bar"]
4. "transport_local" (Transporte Local): ["Combustível", "Pedágio", "Estacionamento", "Transporte Público"]
5. "shopping" (Compras): ["Lembranças", "Roupas", "Eletrônicos", "Artesanato"]
6. "attractions" (Atrações): ["Museus", "Parques", "Tours", "Shows", "Esportes"]
7. "entertainment" (Entretenimento): ["Cinema", "Teatro", "Balada", "Eventos", "Jogos"]
8. "miscellaneous" (Diversos): ["Medicamentos", "Comunicação", "Seguro", "Emergência"]

REGRAS OBRIGATÓRIAS:
✅ SEMPRE preencha "category" com um dos IDs: transport, accommodation, food, transport_local, shopping, attractions, entertainment, miscellaneous
✅ SEMPRE preencha "subcategory" com uma das opções da lista da categoria escolhida
✅ Se não conseguir identificar com certeza, use "miscellaneous" + "Emergência"

EXEMPLOS OBRIGATÓRIOS:
- Posto de gasolina → "category": "transport_local", "subcategory": "Combustível"
- Restaurante → "category": "food", "subcategory": "Restaurante"  
- Pedágio → "category": "transport_local", "subcategory": "Pedágio"
- Hotel → "category": "accommodation", "subcategory": "Hotel"
- Supermercado → "category": "food", "subcategory": "Supermercado"
- Táxi/Uber → "category": "transport", "subcategory": "Táxi" ou "Uber"

FORMATO DE RESPOSTA OBRIGATÓRIO:
{
  "amount": [número],
  "date": "YYYY-MM-DD",
  "location": "[nome do estabelecimento]",
  "category": "[um dos 8 IDs obrigatórios]",
  "subcategory": "[uma subcategoria da lista]",
  "description": "[descrição concisa]"
}

⚠️ CRÍTICO: NÃO retorne o JSON sem preencher category E subcategory. São campos OBRIGATÓRIOS.`
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
      
      // Validate required fields
      if (!extractedData.category || !extractedData.subcategory) {
        console.error('IA falhou ao preencher campos obrigatórios:', extractedData);
        throw new Error('IA não preencheu categoria ou subcategoria. Dados incompletos.');
      }
      
      console.log('✅ Validação passou: category e subcategory preenchidos corretamente');
      
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