import { ReactNode } from "react";
import { PWAHeader } from "./PWAHeader";
import { PWAFooter } from "./PWAFooter";

interface PWALayoutProps {
  children: ReactNode;
}

export const PWALayout = ({ children }: PWALayoutProps) => {
  return (
    <div className="h-screen flex flex-col bg-gradient-sky mobile-safe-area overflow-hidden">
      {/* Header agora é fixo - não precisa estar aqui */}
      <PWAHeader />
      
      {/* Conteúdo principal com padding para compensar header/footer fixos */}
      <main className="flex-1 overflow-y-auto pt-16 pb-[72px]">
        <div className="container px-4 mx-auto py-4 min-h-full">
          {children}
        </div>
      </main>
      
      {/* Footer agora é fixo - não precisa estar aqui */}
      <PWAFooter />
    </div>
  );
};