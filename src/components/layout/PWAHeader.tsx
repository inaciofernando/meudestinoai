import { 
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PWAHeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
}

export const PWAHeader = ({ title, subtitle, onBack }: PWAHeaderProps) => {
  return (
    <header className="w-full border-b border-border bg-background" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Left side - Navegação */}
        <div className="flex items-center gap-4">
          {title ? (
            // Com título da página
            <div className="flex items-center gap-3">
              {onBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="h-9 w-9 p-0 hover:bg-muted rounded-lg"
                  aria-label="Voltar"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <h1 className="text-lg font-semibold text-foreground">{title}</h1>
                {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
              </div>
            </div>
          ) : (
            // Sem título definido
            <div></div>
          )}
        </div>

        {/* Right side - Empty */}
        <div></div>
      </div>
    </header>
  );
};