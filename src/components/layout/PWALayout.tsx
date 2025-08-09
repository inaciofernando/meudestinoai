import { ReactNode } from "react";
import { PWAHeader } from "./PWAHeader";
import { PWAFooter } from "./PWAFooter";

interface PWALayoutProps {
  children: ReactNode;
}

export const PWALayout = ({ children }: PWALayoutProps) => {
  return (
    <div className="h-screen w-full overflow-hidden">
      {/* Header totalmente fixo */}
      <PWAHeader />
      
      {/* Área de conteúdo scrollável entre header e footer */}
      <main 
        className="bg-gradient-sky overflow-y-auto"
        style={{
          height: 'calc(100vh - 64px - 72px)', // 100vh - altura header - altura footer
          marginTop: '64px', // altura do header
          marginBottom: '72px' // altura do footer
        }}
      >
        <div className="container px-4 mx-auto py-4">
          {children}
        </div>
      </main>
      
      {/* Footer totalmente fixo */}
      <PWAFooter />
    </div>
  );
};