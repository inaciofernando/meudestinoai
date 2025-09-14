import { KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Mic } from "lucide-react";

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (message: string) => void;
  disabled: boolean;
}

export const MessageInput = ({ 
  value, 
  onChange, 
  onSubmit, 
  disabled 
}: MessageInputProps) => {
  
  
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
    <div className="flex gap-2 items-end bg-background rounded-2xl border border-border p-2 shadow-sm">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`Faça sua pergunta...`}
        disabled={disabled}
        className="min-h-[44px] max-h-32 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
        rows={1}
      />
      <div className="flex gap-1">
        {!value.trim() && (
          <Button 
            size="icon"
            variant="ghost"
            className="rounded-full hover:bg-muted h-9 w-9"
            onClick={() => {
              // TODO: Implementar funcionalidade de áudio
              console.log('Função de áudio será implementada');
            }}
          >
            <Mic className="w-4 h-4" />
          </Button>
        )}
        {value.trim() && (
          <Button 
            onClick={handleSubmit}
            disabled={disabled || !value.trim()}
            size="icon"
            className="rounded-full h-9 w-9"
          >
            <Send className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};