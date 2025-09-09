import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Viagens from "./pages/Viagens";
import MinhasViagens from "./pages/MinhasViagens";
import NovaViagem from "./pages/NovaViagem";
import DetalhesViagem from "./pages/DetalhesViagem";
import GastosViagem from "./pages/GastosViagem";
import RoteiroSimples from "./pages/RoteiroSimples";
import PontoDetalhes from "./pages/PontoDetalhes";
import EditarPonto from "./pages/EditarPonto";

import Hospedagem from "./pages/Hospedagem";
import DetalhesHospedagem from "./pages/DetalhesHospedagem";
import Hotel from "./pages/Hotel";
import Restaurantes from "./pages/Restaurantes";
import Planejamento from "./pages/Planejamento";
import Perfil from "./pages/Perfil";
import Auth from "./pages/Auth";
import Concierge from "./pages/Concierge";
import NotFound from "./pages/NotFound";
import EditarRestaurante from "./pages/EditarRestaurante";
import AdicionarRestaurante from "./pages/AdicionarRestaurante";
import Transporte from "./pages/Transporte";
import DetalhesTransporte from "./pages/DetalhesTransporte";
import Documentos from "./pages/Documentos";
import ViagemPublica from "./pages/ViagemPublica";

const queryClient = new QueryClient();

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="travel-theme">
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
          <Route path="/viagem/:id/roteiro" element={<RoteiroSimples />} />
          <Route path="/roteiro/:tripId" element={<RoteiroSimples />} />
          <Route path="/roteiro/:tripId/ponto/:pontoId" element={<PontoDetalhes />} />
          <Route path="/roteiro/:tripId/ponto/:pontoId/edit" element={<EditarPonto />} />
          
          <Route path="/viagem/:id/hospedagem" element={<Hospedagem />} />
          <Route path="/viagem/:id/hospedagem/:hospedagemId" element={<DetalhesHospedagem />} />
          <Route path="/viagem/:id/hotel" element={<Hotel />} />
          <Route path="/viagem/:id/restaurantes" element={<Restaurantes />} />
          <Route path="/viagem/:id/restaurantes/novo" element={<AdicionarRestaurante />} />
          <Route path="/viagem/:id/restaurantes/:restId/editar" element={<EditarRestaurante />} />
            <Route path="/viagem/:id/transporte" element={<Transporte />} />
            <Route path="/viagem/:tripId/transporte/:transportId" element={<DetalhesTransporte />} />
            <Route path="/viagem/:id/documentos" element={<Documentos />} />
          <Route path="/planejamento" element={<Planejamento />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/configuracoes" element={<Perfil />} />
          <Route path="/viagem/:id/concierge" element={<Concierge />} />
          <Route path="/share/:slug" element={<ViagemPublica />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
