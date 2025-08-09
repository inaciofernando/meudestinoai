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
    <div className="h-screen w-full flex flex-col fixed inset-0 overflow-hidden">
      {/* Header fixo no topo - só mostra se showHeader for true */}
      {showHeader && (
        <div className="shrink-0">
          <PWAHeader />
        </div>
      )}
      
      {/* Área central scrollável */}
      <main className="flex-1 overflow-y-auto bg-gradient-sky">
        <div className="container px-4 mx-auto py-4">
          {children}
        </div>
      </main>
      
      {/* Footer fixo na base */}
      {showFooter && (
        <div className="shrink-0">
          <PWAFooter />
        </div>
      )}
    </div>
  );
};