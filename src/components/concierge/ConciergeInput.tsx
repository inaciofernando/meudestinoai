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
      const nextHeight = Math.min(el.scrollHeight, 320);
      el.style.height = nextHeight + "px";
    });
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    autoResize();
  }, [setInput, autoResize]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !loading) {
      e.preventDefault();
      if (input.trim()) {
        onSend();
      }
    }
  }, [input, loading, onSend]);

  return (
    <div className="sticky bottom-0 bg-background border-t p-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative flex items-end gap-2">
          <div className="flex-1 min-h-[44px] relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua pergunta..."
              className="min-h-[44px] max-h-80 resize-none pr-12 text-sm leading-5 py-3"
              disabled={loading}
              style={{ height: "44px" }}
            />
            <Button
              onClick={onSend}
              disabled={loading || !input.trim()}
              size="icon"
              className="absolute right-2 bottom-2 h-8 w-8 rounded-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
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