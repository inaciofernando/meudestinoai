import { useState, useCallback } from 'react';
import { Message, ConciergeCategory, TripData, UserData, ChatPayload } from '@/types/concierge';
import { 
  generateId, 
  generateSessionId, 
  getRandomProcessingMessage, 
  getAuthToken 
} from '@/utils/conciergeHelpers';

export const useConciergeChat = (
  category: ConciergeCategory, 
  tripData: TripData, 
  userData: UserData
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [conversationId] = useState(() => generateId());

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

  const buildPayload = useCallback((userMessage: string): ChatPayload => ({
    user_data: {
      user_id: userData.id,
      session_id: generateSessionId(),
      authenticated: true,
      preferences: userData.preferences,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    trip_data: {
      trip_id: tripData.id,
      destination: tripData.destination,
      start_date: tripData.startDate,
      end_date: tripData.endDate,
      duration_days: tripData.durationDays,
      destinations: tripData.destinations,
      budget_range: tripData.budgetRange,
      traveler_count: tripData.travelerCount,
      status: tripData.status
    },
    request_data: {
      category,
      user_message: userMessage,
      conversation_id: conversationId,
      timestamp: new Date().toISOString(),
      language: 'pt-BR'
    }
  }), [category, tripData, userData, conversationId]);

  const sendToWebhook = useCallback(async (payload: ChatPayload) => {
    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error('URL do webhook N8N não configurada');
    }

    const response = await fetch(`${webhookUrl}/concierge-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
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
      addErrorMessage('Erro de comunicação. Tente novamente.');
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
    saveToTrip
  };
};