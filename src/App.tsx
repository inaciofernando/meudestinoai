import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Viagens from "./pages/Viagens";
import MinhasViagens from "./pages/MinhasViagens";
import Planejamento from "./pages/Planejamento";
import Orcamento from "./pages/Orcamento";
import Pontos from "./pages/Pontos";
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
          <Route path="/viagens" element={<Viagens />} />
          <Route path="/minhas-viagens" element={<MinhasViagens />} />
          <Route path="/planejamento" element={<Planejamento />} />
          <Route path="/orcamento" element={<Orcamento />} />
          <Route path="/pontos" element={<Pontos />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
