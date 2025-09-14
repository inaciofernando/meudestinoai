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
  fullscreen?: boolean;
}

export const ChatArea = ({ 
  messages, 
  isLoading, 
  processingMessage, 
  onSave,
  fullscreen = false
}: ChatAreaProps) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll para a última mensagem
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const containerClass = fullscreen 
    ? "flex-1 h-full overflow-y-auto px-4 py-6 scroll-smooth" 
    : "chat-area flex-1 h-full p-4 overflow-y-auto scroll-smooth";

  return (
    <div className={containerClass}>
      {/* Mensagem de boas-vindas automática */}
      <div className="max-w-4xl mx-auto">
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
    </div>
  );
};