import { useState } from "react";
import { MessageInput } from "./MessageInput";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
}

export const ChatInput = ({ onSendMessage, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  
  
  return (
    <div className="p-4 max-w-4xl mx-auto w-full">
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