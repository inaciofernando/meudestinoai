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
    console.log('Resposta do N8N:', JSON.stringify(n8nResult, null, 2));

    // Verificar se temos a estrutura esperada do nó "saida"
    if (n8nResult?.success && n8nResult?.message && n8nResult?.interactive_options) {
      // Processar quick_replies se existir
      let saveOptions = null;
      
      if (n8nResult.interactive_options?.quick_replies?.length > 0) {
        // Filtrar quick_replies para encontrar ações de salvar
        const saveActions = n8nResult.interactive_options.quick_replies
          .filter((reply: any) => 
            reply.action?.includes('confirmar_save_yes') || 
            reply.label?.includes('Incluir no planejamento') ||
            reply.action === 'save'
          );
        
        if (saveActions.length > 0) {
          const saveAction = saveActions[0];
          saveOptions = {
            data: saveAction.data || {},
            actions: n8nResult.interactive_options.quick_replies
              .filter((reply: any) => !reply.action?.includes('confirmar_save_yes'))
              .map((reply: any) => ({
                label: reply.label,
                action: reply.action,
                variant: 'secondary' as const,
              }))
          };
        }
      }
      
      // Também verificar save_button se não houver quick_replies de save
      if (!saveOptions && n8nResult.interactive_options?.save_button?.visible) {
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

      // Retornar na estrutura esperada pelo front-end
      return new Response(
        JSON.stringify({
          success: true,
          message: n8nResult.message.content,
          saveOptions
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Fallback para estrutura antiga (caso ainda receba formato antigo)
    const rawMessage = n8nResult?.message ?? n8nResult?.status ?? 'Mensagem processada com sucesso!';
    let responseMessage: string;
    if (typeof rawMessage === 'string') {
      responseMessage = rawMessage;
    } else if (rawMessage && typeof rawMessage === 'object') {
      responseMessage = (rawMessage.content ?? rawMessage.text ?? JSON.stringify(rawMessage));
    } else {
      responseMessage = 'Mensagem processada com sucesso!';
    }

    // Retornar resposta simples para fallback
    return new Response(
      JSON.stringify({
        success: true,
        message: responseMessage,
        saveOptions: null
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