import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Plus,
  MapPin,
  Clock,
  Utensils,
  Car,
  Hotel,
  Route,
  Sun,
  Moon,
  Coffee,
  Map
} from "lucide-react";

interface Trip {
  id: string;
  title: string;
  destination: string;
}

interface Roteiro {
  id: string;
  trip_id: string;
  title: string;
  total_days: number;
}

interface RoteiroPonto {
  id: string;
  roteiro_id: string;
  day_number: number;
  time_start: string;
  time_end?: string;
  title: string;
  description?: string;
  location: string;
  category: string;
  order_index: number;
}

const CATEGORY_CONFIG = {
  food: { name: "Alimentação", icon: Utensils, color: "bg-green-500" },
  transport: { name: "Transporte", icon: Car, color: "bg-blue-500" },
  accommodation: { name: "Hospedagem", icon: Hotel, color: "bg-purple-500" },
  attraction: { name: "Atração", icon: MapPin, color: "bg-red-500" },
  activity: { name: "Atividade", icon: Route, color: "bg-orange-500" }
};

const TIME_PERIODS = {
  morning: { name: "Manhã", icon: Sun, color: "text-yellow-500" },
  afternoon: { name: "Tarde", icon: Sun, color: "text-orange-500" },
  evening: { name: "Noite", icon: Moon, color: "text-blue-500" }
};

export default function RoteiroSimples() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [roteiro, setRoteiro] = useState<Roteiro | null>(null);
  const [pontos, setPontos] = useState<RoteiroPonto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || !id) return;
    
    const fetchData = async () => {
      try {
        // Fetch trip
        const { data: tripData, error: tripError } = await supabase
          .from("trips")
          .select("id, title, destination")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (tripError) {
          navigate("/viagens");
          return;
        }

        setTrip(tripData);

        // Get or create roteiro
        let roteiroData;
        const { data: existingRoteiro } = await supabase
          .from("roteiros")
          .select("*")
          .eq("trip_id", tripData.id)
          .eq("user_id", user.id)
          .single();

        if (existingRoteiro) {
          roteiroData = existingRoteiro;
        } else {
          const { data: newRoteiro } = await supabase
            .from("roteiros")
            .insert({
              trip_id: tripData.id,
              user_id: user.id,
              title: `Roteiro - ${tripData.destination}`,
              total_days: 7
            })
            .select()
            .single();
          roteiroData = newRoteiro;
        }

        setRoteiro(roteiroData);

        // Fetch pontos
        const { data: pontosData } = await supabase
          .from("roteiro_pontos")
          .select("*")
          .eq("roteiro_id", roteiroData.id)
          .eq("user_id", user.id)
          .order("day_number, order_index");

        setPontos(pontosData || []);
      } catch (error) {
        console.error("Erro:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, id]);

  const getTimePeriod = (time: string): keyof typeof TIME_PERIODS => {
    const hour = parseInt(time.split(':')[0]);
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  const groupedPontos = pontos.reduce((acc, ponto) => {
    if (!acc[ponto.day_number]) {
      acc[ponto.day_number] = [];
    }
    acc[ponto.day_number].push(ponto);
    return acc;
  }, {} as Record<number, RoteiroPonto[]>);

  if (loading) {
    return (
      <ProtectedRoute>
        <PWALayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Carregando roteiro...</p>
            </div>
          </div>
        </PWALayout>
      </ProtectedRoute>
    );
  }

  if (!trip || !roteiro) {
    return (
      <ProtectedRoute>
        <PWALayout>
          <div className="text-center py-12">
            <p>Roteiro não encontrado</p>
            <Button onClick={() => navigate("/viagens")} className="mt-4">
              Voltar
            </Button>
          </div>
        </PWALayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PWALayout>
        <div className="space-y-4 pb-20">
          {/* Header */}
          <div className="flex items-center gap-4 p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/viagem/${id}`)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{trip.destination}</h1>
              <p className="text-sm text-muted-foreground">Roteiro de Viagem</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate(`/viagem/${id}/roteiro`)}
              className="text-xs"
            >
              Versão Completa
            </Button>
          </div>

          {/* Timeline vertical */}
          <div className="px-4 space-y-4">
            {Object.keys(groupedPontos).length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Map className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Nenhum ponto no roteiro ainda</p>
                  <Button 
                    className="mt-4"
                    onClick={() => navigate(`/viagem/${id}/roteiro`)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Ponto
                  </Button>
                </CardContent>
              </Card>
            ) : (
              Object.entries(groupedPontos)
                .sort(([dayA], [dayB]) => Number(dayA) - Number(dayB))
                .map(([day, dayPontos]) => (
                  <div key={day} className="space-y-3">
                    {/* Day header */}
                    <div className="flex items-center gap-3 py-2">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        {day}
                      </div>
                      <div>
                        <h3 className="font-semibold">Dia {day}</h3>
                        <p className="text-sm text-muted-foreground">
                          {dayPontos.length} {dayPontos.length === 1 ? 'ponto' : 'pontos'}
                        </p>
                      </div>
                    </div>

                    {/* Day points */}
                    <div className="ml-4 pl-4 border-l-2 border-muted space-y-3">
                      {dayPontos.map((ponto, index) => {
                        const category = CATEGORY_CONFIG[ponto.category] || CATEGORY_CONFIG.activity;
                        const CategoryIcon = category.icon;
                        const period = TIME_PERIODS[getTimePeriod(ponto.time_start)];
                        const PeriodIcon = period.icon;

                        return (
                          <Card key={ponto.id} className="relative">
                            {/* Timeline dot */}
                            <div className="absolute -left-[29px] top-4 w-4 h-4 bg-background border-2 border-primary rounded-full"></div>
                            
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${category.color} text-white flex-shrink-0`}>
                                  <CategoryIcon className="w-4 h-4" />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold truncate">{ponto.title}</h4>
                                    <Badge variant="outline" className="text-xs">
                                      <PeriodIcon className="w-3 h-3 mr-1" />
                                      {ponto.time_start}
                                    </Badge>
                                  </div>
                                  
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate">{ponto.location}</span>
                                  </div>
                                  
                                  {ponto.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {ponto.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))
            )}
          </div>

          {/* Floating Action Button */}
          <div className="fixed bottom-24 right-4">
            <Button
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg"
              onClick={() => navigate(`/viagem/${id}/roteiro`)}
            >
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </PWALayout>
    </ProtectedRoute>
  );
}