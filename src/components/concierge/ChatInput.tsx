import { useState } from "react";
import { MessageInput } from "./MessageInput";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
}

export const ChatInput = ({ onSendMessage, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  
  
  return (
    <div className="chat-input border-t bg-background p-4">
      {/* Sugestões rápidas */}
      
      {/* Input principal */}
      <MessageInput 
        value={message}
        onChange={setMessage}
        onSubmit={onSendMessage}
        disabled={disabled}
      />
    </div>
  );
};