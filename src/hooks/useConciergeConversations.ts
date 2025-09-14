import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Json } from '@/integrations/supabase/types';

export interface ConversationData {
  id: string;
  title: string;
  messages: Json;
  created_at: string;
  updated_at: string;
  trip_id: string;
  user_id: string;
}

export const useConciergeConversations = (tripId: string) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!user || !tripId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('concierge_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('trip_id', tripId)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Erro ao buscar conversas:', error);
        return;
      }

      setConversations(data || []);
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
    } finally {
      setLoading(false);
    }
  }, [user, tripId]);

  const createNewConversation = useCallback(async (title: string = 'Nova Conversa') => {
    if (!user || !tripId) return null;

    try {
      const { data, error } = await supabase
        .from('concierge_conversations')
        .insert({
          title,
          messages: [] as Json,
          trip_id: tripId,
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar conversa:', error);
        return null;
      }

      // Atualizar lista de conversas
      setConversations(prev => [data, ...prev.slice(0, 9)]);
      setCurrentConversationId(data.id);
      
      return data;
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      return null;
    }
  }, [user, tripId]);

  const updateConversation = useCallback(async (conversationId: string, messages: any[], title?: string) => {
    if (!user) return;

    try {
      const updateData: any = {
        messages: messages as Json,
        updated_at: new Date().toISOString()
      };

      if (title) {
        updateData.title = title;
      }

      const { error } = await supabase
        .from('concierge_conversations')
        .update(updateData)
        .eq('id', conversationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao atualizar conversa:', error);
        return;
      }

      // Atualizar conversa na lista local
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, messages: messages as Json, title: title || conv.title, updated_at: new Date().toISOString() }
            : conv
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar conversa:', error);
    }
  }, [user]);

  const loadConversation = useCallback(async (conversationId: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('concierge_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Erro ao carregar conversa:', error);
        return null;
      }

      setCurrentConversationId(conversationId);
      return data;
    } catch (error) {
      console.error('Erro ao carregar conversa:', error);
      return null;
    }
  }, [user]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('concierge_conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao deletar conversa:', error);
        return;
      }

      // Remover da lista local
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      // Se era a conversa atual, limpar
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
      }
    } catch (error) {
      console.error('Erro ao deletar conversa:', error);
    }
  }, [user, currentConversationId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    currentConversationId,
    setCurrentConversationId,
    createNewConversation,
    updateConversation,
    loadConversation,
    deleteConversation,
    fetchConversations
  };
};