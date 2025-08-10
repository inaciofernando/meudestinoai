import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";

interface TripSectionHeaderProps {
  label?: string;
  title: string;
  subtitle?: string;
  onBack: () => void;
  onAdd?: () => void;
  addAriaLabel?: string;
  right?: React.ReactNode;
}

export default function TripSectionHeader({
  label,
  title,
  subtitle,
  onBack,
  onAdd,
  addAriaLabel = "Adicionar",
  right,
}: TripSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-9 w-9 p-0 hover:bg-muted rounded-lg"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          {label ? (
            <p className="c6-text-secondary text-xs uppercase tracking-wide">{label}</p>
          ) : null}
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {subtitle ? <p className="c6-text-secondary text-sm">{subtitle}</p> : null}
        </div>
      </div>

      {right ?? (
        onAdd ? (
          <Button
            onClick={onAdd}
            className="c6-button-primary w-10 h-10 p-0 rounded-full"
            aria-label={addAriaLabel}
          >
            <Plus className="w-5 h-5" />
          </Button>
        ) : null
      )}
    </div>
  );
}
