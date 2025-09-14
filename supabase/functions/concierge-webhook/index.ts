import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const payload = await req.json();
    console.log('Payload recebido:', JSON.stringify(payload, null, 2));

    // URL do N8N configurada como secret
    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    
    if (!n8nWebhookUrl) {
      console.error('N8N_WEBHOOK_URL não configurada');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Webhook N8N não configurado' 
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Enviando para N8N:', n8nWebhookUrl);

    // Enviar para o N8N
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('Erro no N8N:', n8nResponse.status, n8nResponse.statusText, errorText);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erro no N8N: ${n8nResponse.status} - ${errorText}` 
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const n8nResult = await n8nResponse.json();
    console.log('Resposta do N8N:', n8nResult);

    // Retornar resposta do N8N ou uma resposta padrão
    return new Response(
      JSON.stringify({
        success: true,
        message: n8nResult.message || 'Mensagem processada com sucesso!',
        saveOptions: n8nResult.saveOptions || null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro na função concierge-webhook:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno do servidor' 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});