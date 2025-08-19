import { ReactNode } from "react";
import { PWAHeader } from "./PWAHeader";
import { PWAFooter } from "./PWAFooter";

interface PWALayoutProps {
  children: ReactNode;
  showHeader?: boolean; // Prop opcional para controlar se mostra o header
  showFooter?: boolean; // Prop opcional para controlar se mostra o footer
}

export const PWALayout = ({ children, showHeader = true, showFooter = true }: PWALayoutProps) => {
  return (
    <div className="h-screen w-full flex flex-col">
      {/* Header fixo no topo - só mostra se showHeader for true */}
      {showHeader && (
        <div className="shrink-0 sticky top-0 z-50">
          <PWAHeader />
        </div>
      )}
      
      <main className="flex-1 overflow-y-auto bg-gradient-sky">
        <div className="container px-4 mx-auto py-4 min-h-full">
          {children}
        </div>
        {/* Espaçamento para o footer fixo */}
        {showFooter && <div className="h-[88px]" />}
      </main>
      
      {/* Footer fixo na base */}
      {showFooter && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <PWAFooter />
        </div>
      )}
    </div>
  );
};