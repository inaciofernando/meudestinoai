import { useState } from "react";
import { Message } from "@/types/concierge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageContent } from "./MessageContent";
import { ActionButtons } from "./ActionButtons";
import { Bot } from "lucide-react";

interface BotMessageProps {
  message: Message;
  onSave: (saveOptions: any) => Promise<void>;
}

export const BotMessage = ({ message, onSave }: BotMessageProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (saved || !message.saveOptions) return;
    
    setIsSaving(true);
    try {
      await onSave(message.saveOptions);
      setSaved(true);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="message-bot mb-4">
      <div className="flex items-start gap-3">
        <Avatar className="w-8 h-8">
          <AvatarFallback className="text-sm bg-primary/10">
            <Bot className="w-4 h-4 text-primary" />
          </AvatarFallback>
        </Avatar>
        <div className="max-w-[80%]">
          <div className="bg-muted rounded-lg p-4">
            <MessageContent content={message.content} />
          </div>
          
          {/* Botões de ação quando houver opções de salvar */}
          {message.saveOptions && (
            <ActionButtons 
              onSave={handleSave}
              isSaving={isSaving}
              saved={saved}
              actions={message.saveOptions.actions}
            />
          )}
        </div>
      </div>
    </div>
  );
};