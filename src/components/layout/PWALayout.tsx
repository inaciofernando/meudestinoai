import { ReactNode } from "react";
import { PWAHeader } from "./PWAHeader";
import { PWAFooter } from "./PWAFooter";

interface PWALayoutProps {
  children: ReactNode;
}

export const PWALayout = ({ children }: PWALayoutProps) => {
  return (
    <div className="h-screen flex flex-col bg-gradient-sky mobile-safe-area overflow-hidden">
      {/* Header fixo */}
      <div className="shrink-0 z-10">
        <PWAHeader />
      </div>
      
      {/* Conteúdo principal com scroll independente */}
      <main className="flex-1 overflow-y-auto">
        <div className="container px-4 mx-auto py-4 min-h-full">
          {children}
        </div>
      </main>
      
      {/* Footer fixo */}
      <div className="shrink-0 z-10">
        <PWAFooter />
      </div>
    </div>
  );
};