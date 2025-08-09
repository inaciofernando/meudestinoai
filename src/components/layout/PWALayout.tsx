import { ReactNode } from "react";
import { PWAHeader } from "./PWAHeader";
import { PWAFooter } from "./PWAFooter";

interface PWALayoutProps {
  children: ReactNode;
}

export const PWALayout = ({ children }: PWALayoutProps) => {
  return (
    <div className="h-screen w-full flex flex-col fixed inset-0 overflow-hidden">
      {/* Header fixo no topo */}
      <div className="shrink-0">
        <PWAHeader />
      </div>
      
      {/* Área central scrollável */}
      <main className="flex-1 overflow-y-auto bg-gradient-sky">
        <div className="container px-4 mx-auto py-4">
          {children}
        </div>
      </main>
      
      {/* Footer fixo na base */}
      <div className="shrink-0">
        <PWAFooter />
      </div>
    </div>
  );
};