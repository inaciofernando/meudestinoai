import { Button } from "@/components/ui/button";

interface QuickSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  disabled: boolean;
}

export const QuickSuggestions = ({ suggestions, onSelect, disabled }: QuickSuggestionsProps) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="mb-3">
      <p className="text-sm text-muted-foreground mb-2">Sugestões rápidas:</p>
      <div className="flex gap-2 flex-wrap">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onSelect(suggestion)}
            disabled={disabled}
            className="text-xs hover-scale"
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  );
};