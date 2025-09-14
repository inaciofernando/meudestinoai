import { ConciergeChatProps } from "@/types/concierge";
import { useConciergeChat } from "@/hooks/useConciergeChat";
import { ChatArea } from "./ChatArea";
import { ChatInput } from "./ChatInput";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface ExtendedConciergeChatProps extends ConciergeChatProps {
  fullscreen?: boolean;
  conversation?: any;
  onUpdateConversation?: (conversationId: string, messages: any[], title?: string) => void;
}

export const ConciergeChat = ({ 
  category, 
  tripData, 
  userData, 
  onClose, 
  onSaveToTrip,
  fullscreen = false,
  conversation,
  onUpdateConversation
}: ExtendedConciergeChatProps) => {
  const { toast } = useToast();
  const { 
    messages, 
    isLoading, 
    processingMessage, 
    sendMessage, 
    saveToTrip,
    setInitialMessages 
  } = useConciergeChat(category, tripData, userData);

  // Carregar mensagens da conversa quando necessário
  useEffect(() => {
    if (conversation && conversation.messages) {
      const messagesArray = Array.isArray(conversation.messages) 
        ? conversation.messages as any[]
        : [];
      setInitialMessages(messagesArray);
    } else {
      setInitialMessages([]);
    }
  }, [conversation, setInitialMessages]);

  // Salvar mensagens quando mudarem
  useEffect(() => {
    if (conversation && messages.length > 0 && onUpdateConversation) {
      onUpdateConversation(conversation.id, messages);
    }
  }, [messages, conversation, onUpdateConversation]);

  const handleSave = async (saveOptions: any) => {
    try {
      await saveToTrip(saveOptions, onSaveToTrip);
      toast({
        title: "Sucesso!",
        description: "Item salvo na programação da viagem.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar na programação. Tente novamente.",
        variant: "destructive"
      });
      throw error;
    }
  };

  if (fullscreen) {
    return (
      <div className="flex flex-col h-full">
        {/* Área de mensagens scrollável */}
        <div className="flex-1 overflow-hidden">
          <ChatArea
            messages={messages}
            isLoading={isLoading}
            processingMessage={processingMessage}
            onSave={handleSave}
            fullscreen={true}
          />
        </div>
        
        {/* Input fixo na base */}
        <div className="flex-shrink-0 border-t border-border/20 bg-background/95 backdrop-blur-sm">
          <ChatInput
            onSendMessage={sendMessage}
            disabled={isLoading}
          />
        </div>
      </div>
    );
  }

  return (
    <Card className="concierge-chat w-full max-w-4xl mx-auto flex flex-col h-[600px] shadow-lg">      
      {/* Área de mensagens scrollável */}
      <ChatArea
        messages={messages}
        isLoading={isLoading}
        processingMessage={processingMessage}
        onSave={handleSave}
      />
      
      {/* Input fixo na base */}
      <ChatInput
        onSendMessage={sendMessage}
        disabled={isLoading}
      />
    </Card>
  );
};