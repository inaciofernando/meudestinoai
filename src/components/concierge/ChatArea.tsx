import { useEffect, useRef } from "react";
import { Message } from "@/types/concierge";
import { WelcomeMessage } from "./WelcomeMessage";
import { BotMessage } from "./BotMessage";
import { UserMessage } from "./UserMessage";
import { ProcessingIndicator } from "./ProcessingIndicator";

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  processingMessage: string;
  onSave: (saveOptions: any) => Promise<void>;
}

export const ChatArea = ({ 
  messages, 
  isLoading, 
  processingMessage, 
  onSave 
}: ChatAreaProps) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll para a última mensagem
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="chat-area flex-1 p-4 overflow-y-auto max-h-96 scroll-smooth">
      {/* Mensagem de boas-vindas automática */}
      <WelcomeMessage />
      
      {/* Mensagens da conversa */}
      {messages.map((message) => {
        if (message.type === 'user') {
          return <UserMessage key={message.id} message={message} />;
        } else if (message.type === 'bot') {
          return <BotMessage key={message.id} message={message} onSave={onSave} />;
        } else {
          // Mensagem do sistema (erro)
          return (
            <div key={message.id} className="text-center text-sm text-destructive mb-4">
              {message.content}
            </div>
          );
        }
      })}

      {/* Indicador de processamento */}
      {isLoading && (
        <ProcessingIndicator message={processingMessage} />
      )}
      
      <div ref={chatEndRef} />
    </div>
  );
};