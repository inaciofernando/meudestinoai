import { 
  Search, 
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

        {/* Center - Search (hidden on mobile) */}
        <div className="relative max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Buscar viagens, destinos..." 
            className="pl-10 bg-background/50 w-64"
          />
        </div>

        {/* Right side - Search on mobile */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 md:hidden">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};