import { useState } from "react";
import { ConciergeCategory } from "@/types/concierge";
import { getQuickSuggestions } from "@/utils/conciergeHelpers";
import { QuickSuggestions } from "./QuickSuggestions";
import { MessageInput } from "./MessageInput";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
  category: ConciergeCategory;
}

export const ChatInput = ({ onSendMessage, disabled, category }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const quickSuggestions = getQuickSuggestions(category);
  
  return (
    <div className="chat-input border-t bg-background p-4">
      {/* Sugestões rápidas */}
      <QuickSuggestions 
        suggestions={quickSuggestions}
        onSelect={setMessage}
        disabled={disabled}
      />
      
      {/* Input principal */}
      <MessageInput 
        value={message}
        onChange={setMessage}
        onSubmit={onSendMessage}
        disabled={disabled}
        category={category}
      />
    </div>
  );
};