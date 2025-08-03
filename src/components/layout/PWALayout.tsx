import { ReactNode } from "react";
import { PWAHeader } from "./PWAHeader";
import { PWAFooter } from "./PWAFooter";

interface PWALayoutProps {
  children: ReactNode;
}

export const PWALayout = ({ children }: PWALayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col">
      <PWAHeader />
      <main className="flex-1 pb-20 pt-4">
        <div className="container px-4 mx-auto">
          {children}
        </div>
      </main>
      <PWAFooter />
    </div>
  );
};