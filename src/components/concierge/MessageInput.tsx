import { useState, KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { ConciergeCategory } from "@/types/concierge";
import { getCategoryData } from "@/utils/conciergeHelpers";

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (message: string) => void;
  disabled: boolean;
  category: ConciergeCategory;
}

export const MessageInput = ({ 
  value, 
  onChange, 
  onSubmit, 
  disabled, 
  category 
}: MessageInputProps) => {
  const categoryData = getCategoryData(category);
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSubmit(value.trim());
      onChange('');
    }
  };

  return (
    <div className="flex gap-2 items-end">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`Faça sua pergunta sobre ${categoryData.type}s...`}
        disabled={disabled}
        className="min-h-[44px] max-h-32 resize-none"
        rows={1}
      />
      <Button 
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        size="icon"
        className="hover-scale"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
};