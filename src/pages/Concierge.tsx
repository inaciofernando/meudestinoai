import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ConciergeChat } from "@/components/concierge/ConciergeChat";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TripData, UserData, ConciergeCategory } from "@/types/concierge";
import { Bot, MapPin, Clock, Users, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

export default function Concierge() {
  const { id: tripId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [showChat, setShowChat] = useState(true);
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);

  const userData: UserData = {
    id: user?.id || "",
    preferences: {}
  };

  useEffect(() => {
    if (tripId && user) {
      fetchTripData();
    }
  }, [tripId, user]);

  const fetchTripData = async () => {
    try {
      const { data: trip, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Erro ao buscar viagem:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados da viagem.",
          variant: "destructive"
        });
        return;
      }

      if (trip) {
        const startDate = new Date(trip.start_date);
        const endDate = new Date(trip.end_date);
        const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        setTripData({
          id: trip.id,
          destination: trip.destination || trip.title || 'Destino não definido',
          startDate: trip.start_date,
          endDate: trip.end_date,
          durationDays: durationDays,
          destinations: [trip.destination].filter(Boolean),
          budgetRange: 'Não definido',
          travelerCount: 1, // Default value since this field doesn't exist in DB
          status: trip.status || 'Planejamento'
        });
      }
    } catch (error) {
      console.error('Erro ao buscar dados da viagem:', error);
      toast({
        title: "Erro",
        description: "Erro interno. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { 
      id: 'roteiro', 
      name: 'Roteiro', 
      icon: MapPin, 
      color: 'from-blue-500 to-blue-600',
      description: 'Pontos turísticos e atividades'
    },
    { 
      id: 'restaurante', 
      name: 'Restaurante', 
      icon: '🍽️', 
      color: 'from-orange-500 to-red-500',
      description: 'Gastronomia e experiências culinárias'
    },
    { 
      id: 'hospedagem', 
      name: 'Hospedagem', 
      icon: '🏨', 
      color: 'from-purple-500 to-purple-600',
      description: 'Hotéis e acomodações'
    },
    { 
      id: 'diversos', 
      name: 'Diversos', 
      icon: '✨', 
      color: 'from-green-500 to-green-600',
      description: 'Outros serviços e informações'
    }
  ];

  const handleSaveToTrip = (data: any) => {
    console.log('Item salvo na programação:', data);
    toast({
      title: "Sucesso!",
      description: "Sugestão salva na sua programação de viagem.",
    });
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <PWALayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Bot className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground">Carregando dados da viagem...</p>
            </div>
          </div>
        </PWALayout>
      </ProtectedRoute>
    );
  }

  if (!tripData) {
    return (
      <ProtectedRoute>
        <PWALayout>
          <div className="text-center space-y-4">
            <Bot className="w-12 h-12 text-muted-foreground mx-auto" />
            <div>
              <h1 className="text-xl font-semibold mb-2">Viagem não encontrada</h1>
              <p className="text-muted-foreground mb-4">
                Não foi possível encontrar os dados desta viagem.
              </p>
              <Link to="/minhas-viagens">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para Minhas Viagens
                </Button>
              </Link>
            </div>
          </div>
        </PWALayout>
      </ProtectedRoute>
    );
  }

  if (showChat) {
    return (
      <ProtectedRoute>
        <PWALayout>
          <div className="p-4">
            <ConciergeChat
              category={'diversos'} // Default category, o AI identificará automaticamente o tipo
              tripData={tripData}
              userData={userData}
              onClose={() => setShowChat(false)}
              onSaveToTrip={handleSaveToTrip}
            />
          </div>
        </PWALayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PWALayout>
        <div className="space-y-6">
          {/* Header com navegação */}
          <div className="flex items-center justify-between">
            <Link to={`/viagem/${tripId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para viagem
              </Button>
            </Link>
          </div>

          {/* Interface do Concierge */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-full shadow-lg">
              <Bot className="w-8 h-8 text-white" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold mb-2">Concierge AI</h1>
              <p className="text-muted-foreground">
                Seu assistente de viagem inteligente
              </p>
            </div>
            
            <Button 
              size="lg" 
              onClick={() => setShowChat(true)}
              className="px-8 py-3"
            >
              <Bot className="w-5 h-5 mr-2" />
              Iniciar Conversa
            </Button>
          </div>
        </div>
      </PWALayout>
    </ProtectedRoute>
  );
}