import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Viagens from "./pages/Viagens";
import MinhasViagens from "./pages/MinhasViagens";
import NovaViagem from "./pages/NovaViagem";
import DetalhesViagem from "./pages/DetalhesViagem";
import GastosViagem from "./pages/GastosViagem";
import Roteiro from "./pages/Roteiro";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/viagens" element={<Viagens />} />
          <Route path="/minhas-viagens" element={<MinhasViagens />} />
          <Route path="/nova-viagem" element={<NovaViagem />} />
          <Route path="/viagem/:id" element={<DetalhesViagem />} />
          <Route path="/viagem/:id/gastos" element={<GastosViagem />} />
          <Route path="/viagem/:id/roteiro" element={<Roteiro />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
