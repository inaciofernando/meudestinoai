import { ReactNode } from "react";
import { PWAHeader } from "./PWAHeader";
import { PWAFooter } from "./PWAFooter";

interface PWALayoutProps {
  children: ReactNode;
}

export const PWALayout = ({ children }: PWALayoutProps) => {
  return (
    <>
      {/* Header fixo */}
      <PWAHeader />
      
      {/* Conteúdo principal com espaço para header e footer */}
      <main 
        className="overflow-y-auto bg-gradient-sky mobile-safe-area"
        style={{
          paddingTop: 'calc(64px + env(safe-area-inset-top, 0px))', // altura do header + safe area
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))', // altura do footer + safe area
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1
        }}
      >
        <div className="container px-4 mx-auto py-4 min-h-full">
          {children}
        </div>
      </main>
      
      {/* Footer fixo */}
      <PWAFooter />
    </>
  );
};