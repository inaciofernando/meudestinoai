import { useState, useCallback, useEffect } from 'react';
import { Message, ConciergeCategory, TripData, UserData, ChatPayload } from '@/types/concierge';
import { 
  generateId, 
  generateSessionId, 
  getRandomProcessingMessage, 
  getAuthToken 
} from '@/utils/conciergeHelpers';
import { supabase } from '@/integrations/supabase/client';

export const useConciergeChat = (
  category: ConciergeCategory, 
  tripData: TripData, 
  userData: UserData
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [conversationId] = useState(() => generateId());
  const [tripLocations, setTripLocations] = useState<any[]>([]);

  // Buscar roteiro de destinos da viagem
  const fetchTripLocations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('trip_locations')
        .select('*')
        .eq('trip_id', tripData.id)
        .eq('user_id', userData.id)
        .order('order_index');

      if (error) {
        console.error('Erro ao buscar roteiro:', error);
        return;
      }

      setTripLocations(data || []);
    } catch (error) {
      console.error('Erro ao buscar roteiro:', error);
    }
  }, [tripData.id, userData.id]);

  // Buscar roteiro quando o hook é inicializado
  useEffect(() => {
    if (tripData.id && userData.id) {
      fetchTripLocations();
    }
  }, [fetchTripLocations, tripData.id, userData.id]);

  const setInitialMessages = useCallback((initialMessages: Message[]) => {
    setMessages(initialMessages);
  }, []);

  const addUserMessage = useCallback((content: string) => {
    const message: Message = {
      id: generateId(),
      type: 'user',
      content,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, message]);
  }, []);

  const addBotMessage = useCallback((content: string, saveOptions?: any) => {
    const message: Message = {
      id: generateId(),
      type: 'bot',
      content,
      timestamp: new Date().toISOString(),
      saveOptions
    };
    setMessages(prev => [...prev, message]);
  }, []);

  const addErrorMessage = useCallback((error: string) => {
    const message: Message = {
      id: generateId(),
      type: 'system',
      content: `❌ ${error}`,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, message]);
  }, []);

  const buildPayload = useCallback((userMessage: string): ChatPayload => {
    console.log('Dados da viagem:', tripData);
    console.log('Dados do usuário:', userData);
    console.log('Locations do roteiro:', tripLocations);
    
    return {
      user_data: {
        user_id: userData.id,
        session_id: generateSessionId(),
        authenticated: true,
        preferences: userData.preferences || {},
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      trip_data: {
        trip_id: tripData.id,
        destination: tripData.destination,
        start_date: tripData.startDate,
        end_date: tripData.endDate,
        duration_days: tripData.durationDays,
        destinations: tripData.destinations || [],
        budget_range: tripData.budgetRange,
        traveler_count: tripData.travelerCount,
        status: tripData.status,
        roteiro_destinos: tripLocations.map(location => ({
          location_name: location.location_name,
          location_type: location.location_type,
          order_index: location.order_index,
          notes: location.notes || ''
        }))
      },
      request_data: {
        category,
        user_message: userMessage,
        conversation_id: conversationId,
        timestamp: new Date().toISOString(),
        language: 'pt-BR'
      }
    };
  }, [category, tripData, userData, conversationId, tripLocations]);

  const sendToWebhook = useCallback(async (payload: ChatPayload) => {
    console.log('Enviando payload para webhook:', JSON.stringify(payload, null, 2));

    // Usar nossa Edge Function interna
    const { data, error } = await supabase.functions.invoke('concierge-webhook', {
      body: payload
    });

    if (error) {
      console.error('Erro na Edge Function:', error);
      throw new Error(`Erro na comunicação: ${error.message}`);
    }

    console.log('Resposta da Edge Function:', data);
    return data;
  }, []);

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim()) return;

    // 1. Adicionar mensagem do usuário
    addUserMessage(userMessage);
    
    // 2. Ativar loading com mensagem aleatória
    setIsLoading(true);
    setProcessingMessage(getRandomProcessingMessage());
    
    try {
      // 3. Construir payload
      const payload = buildPayload(userMessage);
      
      // 4. Enviar para webhook
      const response = await sendToWebhook(payload);
      
      // 5. Processar resposta
      if (response.success) {
        addBotMessage(response.message, response.saveOptions);
      } else {
        addErrorMessage(response.error || 'Erro desconhecido na resposta');
      }
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : error);
      addErrorMessage(`Erro de comunicação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
      setProcessingMessage('');
    }
  }, [addUserMessage, addBotMessage, addErrorMessage, buildPayload, sendToWebhook]);

  const saveToTrip = useCallback(async (saveOptions: any, onSaveToTrip?: (data: any) => void) => {
    const payload = {
      user_id: userData.id,
      trip_id: tripData.id,
      category: category,
      content: saveOptions.data,
      saved_at: new Date().toISOString()
    };

    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error('URL do webhook N8N não configurada');
    }

    const response = await fetch(`${webhookUrl}/save-to-trip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Erro ao salvar na programação');
    }

    // Callback para atualizar estado global se necessário
    onSaveToTrip?.(payload);
    
    return response.json();
  }, [category, tripData.id, userData.id]);

  return {
    messages,
    isLoading,
    processingMessage,
    sendMessage,
    saveToTrip,
    setInitialMessages
  };
};