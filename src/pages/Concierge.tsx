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
  
  const [showChat, setShowChat] = useState(false);
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
              category={'roteiro'} // Default category, o AI identificará automaticamente o tipo
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

          {/* Header do Concierge */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-full mb-6 shadow-lg">
              <Bot className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Concierge AI
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Seu assistente inteligente para qualquer dúvida sobre sua viagem - roteiros, restaurantes, hospedagem e muito mais!
            </p>
            <Button 
              size="lg" 
              onClick={() => setShowChat(true)}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white px-8 py-3"
            >
              <Bot className="w-5 h-5 mr-2" />
              Começar Conversa
            </Button>
          </div>

          {/* Sugestões rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ⚡ Sugestões para começar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant="outline"
                    className="h-auto p-4 justify-start"
                    onClick={() => setShowChat(true)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${category.color} rounded-full flex items-center justify-center`}>
                        {typeof category.icon === 'string' ? (
                          <span className="text-sm">{category.icon}</span>
                        ) : (
                          <category.icon className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{category.name}</div>
                        <div className="text-xs text-muted-foreground">{category.description}</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Como funciona - Melhorado */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💡 Como funciona o Concierge AI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                       <div className="flex gap-3">
                     <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                       1
                     </div>
                     <div>
                       <h4 className="font-semibold mb-1">Inicie uma conversa</h4>
                       <p className="text-sm text-muted-foreground">
                         Clique em "Começar Conversa" ou use as sugestões rápidas
                       </p>
                     </div>
                   </div>
                   <div className="flex gap-3">
                     <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                       2
                     </div>
                     <div>
                       <h4 className="font-semibold mb-1">Faça qualquer pergunta</h4>
                       <p className="text-sm text-muted-foreground">
                         Roteiros, restaurantes, hospedagem - o concierge entende tudo!
                       </p>
                     </div>
                   </div>
                </div>
                <div className="space-y-4">
                     <div className="flex gap-3">
                     <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                       3
                     </div>
                     <div>
                       <h4 className="font-semibold mb-1">Receba sugestões inteligentes</h4>
                       <p className="text-sm text-muted-foreground">
                         Baseadas no seu destino, datas e tipo de viagem
                       </p>
                     </div>
                   </div>
                   <div className="flex gap-3">
                     <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                       4
                     </div>
                     <div>
                       <h4 className="font-semibold mb-1">Salve o que mais gostar</h4>
                       <p className="text-sm text-muted-foreground">
                         Adicione sugestões diretamente à sua programação
                       </p>
                     </div>
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PWALayout>
    </ProtectedRoute>
  );
}