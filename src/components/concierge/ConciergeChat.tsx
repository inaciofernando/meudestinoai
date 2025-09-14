import { ConciergeChatProps } from "@/types/concierge";
import { useConciergeChat } from "@/hooks/useConciergeChat";
import { ChatHeader } from "./ChatHeader";
import { ChatArea } from "./ChatArea";
import { ChatInput } from "./ChatInput";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export const ConciergeChat = ({ 
  category, 
  tripData, 
  userData, 
  onClose, 
  onSaveToTrip 
}: ConciergeChatProps) => {
  const { toast } = useToast();
  const { 
    messages, 
    isLoading, 
    processingMessage, 
    sendMessage, 
    saveToTrip 
  } = useConciergeChat(category, tripData, userData);

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

  return (
    <Card className="concierge-chat w-full max-w-4xl mx-auto flex flex-col h-[600px] shadow-lg">
      {/* Header fixo no topo */}
      <ChatHeader 
        category={category}
        onClose={onClose}
      />
      
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