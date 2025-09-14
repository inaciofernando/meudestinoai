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

    // Normalizar mensagem do N8N (pode vir como string ou objeto)
    const rawMessage = n8nResult?.message ?? n8nResult?.status ?? 'Mensagem processada com sucesso!';
    let responseMessage: string;
    if (typeof rawMessage === 'string') {
      responseMessage = rawMessage;
    } else if (rawMessage && typeof rawMessage === 'object') {
      responseMessage = (rawMessage.content ?? rawMessage.text ?? JSON.stringify(rawMessage));
    } else {
      responseMessage = 'Mensagem processada com sucesso!';
    }

    // Traduções comuns EN -> PT-BR
    const translations: Record<string, string> = {
      'workflow was started': 'Processando sua solicitação...',
      'workflow started': 'Processando sua solicitação...',
      'processing': 'Processando...',
      'success': 'Sucesso',
      'error': 'Erro',
      'failed': 'Falhou'
    };

    const lower = responseMessage.toLowerCase();
    for (const [en, pt] of Object.entries(translations)) {
      if (lower.includes(en)) {
        responseMessage = pt;
        break;
      }
    }

    // Normalizar opções interativas do N8N para o app (quando existir)
    let saveOptions = n8nResult.saveOptions || null;
    
    // Só criar saveOptions se o botão de salvar estiver visível E houver dados estruturados
    if (!saveOptions && n8nResult?.interactive_options?.save_button?.visible) {
      const saveData = n8nResult.interactive_options.save_button.data;
      
      // Verificar se há dados estruturados válidos para salvar
      const hasValidSaveData = saveData && (
        saveData.accommodation_data || 
        saveData.restaurant_data || 
        saveData.itinerary_data ||
        (saveData.category && (
          saveData.accommodation_data || 
          saveData.restaurant_data || 
          saveData.itinerary_data ||
          saveData.recommendations ||
          saveData.structured_data
        ))
      );
      
      if (hasValidSaveData) {
        // Filtrar actions removendo "Mais Detalhes" e "Nova Pergunta"
        const filteredActions = Array.isArray(n8nResult.interactive_options.additional_actions)
          ? n8nResult.interactive_options.additional_actions
              .filter((a: any) => 
                !a.label?.includes('Mais Detalhes') && 
                !a.label?.includes('Nova Pergunta') &&
                !a.action?.includes('get_more_details') &&
                !a.action?.includes('new_question')
              )
              .map((a: any) => ({
                label: a.label,
                action: a.action,
                variant: 'secondary' as const,
              }))
          : undefined;
        
        saveOptions = {
          data: saveData,
          actions: filteredActions?.length > 0 ? filteredActions : undefined,
        };
      }
    }

    // Retornar resposta traduzida e normalizada
    return new Response(
      JSON.stringify({
        success: true,
        message: responseMessage,
        saveOptions
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