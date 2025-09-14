import { ReactNode } from "react";
import { PWAHeader } from "./PWAHeader";
import { PWAFooter } from "./PWAFooter";

interface PWALayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
}

export const PWALayout = ({ 
  children, 
  showHeader = true, 
  showFooter = true,
  title,
  subtitle,
  onBack
}: PWALayoutProps) => {
  return (
    <div className="min-h-screen-mobile w-full flex flex-col bg-gradient-sky">
      {/* Header fixo no topo */}
      {showHeader && (
        <header className="flex-shrink-0 sticky top-0 z-50">
          <PWAHeader title={title} subtitle={subtitle} onBack={onBack} />
        </header>
      )}
      
      {/* Conteúdo principal scrollável */}
      <main className="flex-1 overflow-y-auto">
        <div className="container px-4 mx-auto py-4">
          {children}
        </div>
        {/* Espaçamento para o footer fixo */}
        {showFooter && <div className="h-[88px] flex-shrink-0" />}
      </main>
      
      {/* Footer fixo na base */}
      {showFooter && (
        <footer className="fixed bottom-0 left-0 right-0 z-50 flex-shrink-0">
          <PWAFooter />
        </footer>
      )}
    </div>
  );
};