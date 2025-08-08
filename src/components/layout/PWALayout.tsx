import { ReactNode } from "react";
import { PWAHeader } from "./PWAHeader";
import { PWAFooter } from "./PWAFooter";

interface PWALayoutProps {
  children: ReactNode;
}

export const PWALayout = ({ children }: PWALayoutProps) => {
  return (
    <div className="min-h-screen-mobile bg-gradient-sky flex flex-col mobile-safe-area">
      <PWAHeader />
      <main className="flex-1 pb-20 pt-4 overflow-y-auto">
        <div className="container px-4 mx-auto">
          {children}
        </div>
      </main>
      <PWAFooter />
    </div>
  );
};