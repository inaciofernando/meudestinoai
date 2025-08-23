import { memo, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Loader2 } from "lucide-react";

interface ConciergeInputProps {
  input: string;
  setInput: (value: string) => void;
  loading: boolean;
  onSend: () => void;
}

const ConciergeInput = memo(({ input, setInput, loading, onSend }: ConciergeInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    
    // Use requestAnimationFrame to debounce DOM manipulation
    requestAnimationFrame(() => {
      el.style.height = "0px";
      const nextHeight = Math.min(el.scrollHeight, 240);
      el.style.height = Math.max(40, nextHeight) + "px";
    });
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    autoResize();
  }, [setInput, autoResize]);

  const handleSend = useCallback(() => {
    if (!input.trim() || loading) return;
    onSend();
  }, [input, loading, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !loading) {
      e.preventDefault();
      handleSend();
    }
  }, [loading, handleSend]);

  return (
    <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-3">
      <div className="max-w-4xl mx-auto">
        <div className="relative flex items-end gap-2">
          <div className="flex-1 min-h-[40px] relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Faça sua pergunta sobre a viagem..."
              className="min-h-[40px] max-h-80 resize-none pr-12 text-sm leading-5 py-2.5 px-3 rounded-2xl border-primary/20 focus:border-primary/40"
              disabled={loading}
              style={{ height: "40px" }}
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              size="icon"
              className="absolute right-1.5 bottom-1.5 h-7 w-7 rounded-full bg-primary hover:bg-primary/90 disabled:bg-muted touch-manipulation"
              type="button"
              aria-label="Enviar mensagem"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowUp className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

ConciergeInput.displayName = "ConciergeInput";

export { ConciergeInput };