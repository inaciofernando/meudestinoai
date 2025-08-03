import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Plus,
  MapPin,
  Clock,
  Calendar,
  Utensils,
  Car,
  Hotel,
  Route,
  Sun,
  Moon,
  Coffee,
  Map,
  BookOpen,
  Star
} from "lucide-react";

interface Trip {
  id: string;
  title: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  description?: string;
}

interface RoteiroPonto {
  id: string;
  roteiro_id: string;
  day_number: number;
  time_start: string;
  time_end?: string;
  title: string;
  description: string;
  location: string;
  category: 'attraction' | 'restaurant' | 'transport' | 'hotel' | 'activity' | 'shopping' | 'rest';
  notes?: string;
  order_index: number;
  created_at: string;
}

interface Roteiro {
  id: string;
  trip_id: string;
  title: string;
  description?: string;
  total_days: number;
  created_at: string;
}

const CATEGORY_CONFIG = {
  attraction: { name: "Atração", icon: MapPin, color: "bg-blue-500" },
  restaurant: { name: "Restaurante", icon: Utensils, color: "bg-green-500" },
  transport: { name: "Transporte", icon: Car, color: "bg-orange-500" },
  hotel: { name: "Hospedagem", icon: Hotel, color: "bg-purple-500" },
  activity: { name: "Atividade", icon: Star, color: "bg-yellow-500" },
  shopping: { name: "Compras", icon: BookOpen, color: "bg-pink-500" },
  rest: { name: "Descanso", icon: Coffee, color: "bg-gray-500" }
};

const TIME_PERIODS = {
  morning: { name: "Manhã", icon: Sun, color: "text-yellow-500" },
  afternoon: { name: "Tarde", icon: Sun, color: "text-orange-500" },
  evening: { name: "Noite", icon: Moon, color: "text-blue-500" }
};

export default function Roteiro() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [roteiro, setRoteiro] = useState<Roteiro | null>(null);
  const [pontos, setPontos] = useState<RoteiroPonto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(1);
  const [isAddingPonto, setIsAddingPonto] = useState(false);
  const [selectedPonto, setSelectedPonto] = useState<RoteiroPonto | null>(null);

  // Form states
  const [newPonto, setNewPonto] = useState({
    day_number: 1,
    time_start: "09:00",
    time_end: "10:00",
    title: "",
    description: "",
    location: "",
    category: "attraction" as keyof typeof CATEGORY_CONFIG,
    notes: ""
  });

  useEffect(() => {
  const fetchData = async () => {
    if (!user || !id) return;

      try {
        // Fetch trip details
        const { data: tripData, error: tripError } = await supabase
          .from("trips")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (tripError) {
          console.error("Erro ao buscar viagem:", tripError);
          navigate("/viagens");
          return;
        }

        setTrip(tripData);

        // Fetch or create roteiro for this trip
        let { data: roteiroData, error: roteiroError } = await supabase
          .from("roteiros")
          .select("*")
          .eq("trip_id", tripData.id)
          .eq("user_id", user.id)
          .single();

        if (roteiroError && roteiroError.code !== 'PGRST116') {
          console.error("Erro ao buscar roteiro:", roteiroError);
          navigate("/viagens");
          return;
        }

        // Create roteiro if it doesn't exist
        if (!roteiroData) {
          const { data: newRoteiro, error: createError } = await supabase
            .from("roteiros")
            .insert({
              trip_id: tripData.id,
              title: `Roteiro ${tripData.title}`,
              description: `Planejamento detalhado para ${tripData.destination}`,
              total_days: getTotalDays(tripData.start_date, tripData.end_date),
              user_id: user.id
            })
            .select()
            .single();

          if (createError) {
            console.error("Erro ao criar roteiro:", createError);
            navigate("/viagens");
            return;
          }

          roteiroData = newRoteiro;
        }
        
        setRoteiro(roteiroData);

        // Fetch roteiro pontos
        console.log("🔍 Buscando pontos do roteiro:");
        console.log("- User ID:", user.id);
        console.log("- Roteiro ID:", roteiroData.id);
        
        const { data: pontosData, error: pontosError } = await supabase
          .from("roteiro_pontos")
          .select("*")
          .eq("roteiro_id", roteiroData.id)
          .eq("user_id", user.id)
          .order("day_number", { ascending: true })
          .order("order_index", { ascending: true });

        console.log("📊 Resultado da query:");
        console.log("- Pontos encontrados:", pontosData);
        console.log("- Erro:", pontosError);
        console.log("- Total de pontos:", pontosData?.length || 0);

        if (pontosError) {
          console.error("Erro ao buscar pontos do roteiro:", pontosError);
        } else {
          setPontos((pontosData || []) as RoteiroPonto[]);
          console.log("✅ Pontos carregados no estado");
        }
        
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        navigate("/viagens");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, id, navigate]);

  const getTotalDays = (startDate: string | null, endDate: string | null): number => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  const getTimePeriod = (time: string): keyof typeof TIME_PERIODS => {
    const hour = parseInt(time.split(':')[0]);
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  const getDayPontos = (day: number) => {
    const filteredPontos = pontos.filter(ponto => ponto.day_number === day);
    console.log(`🗓️ getDayPontos(${day}):`, {
      totalPontos: pontos.length,
      pontosAll: pontos,
      filteredPontos,
      dayRequested: day
    });
    return filteredPontos.sort((a, b) => a.order_index - b.order_index);
  };

  const handleAddPonto = async () => {
    if (!roteiro || !newPonto.title || !newPonto.location) {
      toast({
        title: "Erro",
        description: "Preencha pelo menos o título e local do ponto.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Insert ponto into database
      const { data: newPontoData, error } = await supabase
        .from("roteiro_pontos")
        .insert({
          roteiro_id: roteiro.id,
          day_number: newPonto.day_number,
          time_start: newPonto.time_start,
          time_end: newPonto.time_end || null,
          title: newPonto.title,
          description: newPonto.description,
          location: newPonto.location,
          category: newPonto.category,
          notes: newPonto.notes,
          order_index: getDayPontos(newPonto.day_number).length,
          user_id: user!.id
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao salvar ponto:", error);
        toast({
          title: "Erro",
          description: "Não foi possível salvar o ponto. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      // Add to local state
      setPontos(prev => [...prev, newPontoData as RoteiroPonto]);
      
      // Reset form
      setNewPonto({
        day_number: selectedDay,
        time_start: "09:00",
        time_end: "10:00",
        title: "",
        description: "",
        location: "",
        category: "attraction",
        notes: ""
      });
      
      setIsAddingPonto(false);

      toast({
        title: "Ponto adicionado! 📍",
        description: `${newPontoData.title} foi adicionado ao roteiro do dia ${newPonto.day_number}.`,
      });
    } catch (error) {
      console.error("Erro ao adicionar ponto:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o ponto. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handlePontoClick = (ponto: RoteiroPonto) => {
    setSelectedPonto(ponto);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <PWALayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
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
          <div className="text-center p-8">
            <p>Roteiro não encontrado</p>
            <Button onClick={() => navigate("/viagens")} className="mt-4">
              Voltar às viagens
            </Button>
          </div>
        </PWALayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PWALayout>
        <div className="space-y-6 pb-20">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg mx-4 mt-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/viagens")}
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Route className="w-6 h-6 text-primary" />
                  <h1 className="text-2xl font-bold">Roteiro de Viagem</h1>
                </div>
                <p className="text-muted-foreground">{trip.title} • {trip.destination}</p>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {roteiro.total_days} dias
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {pontos.length} pontos
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Day Navigation */}
          <div className="px-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {Array.from({length: roteiro.total_days}, (_, i) => i + 1).map(day => (
                <Button
                  key={day}
                  variant={selectedDay === day ? "default" : "outline"}
                  onClick={() => setSelectedDay(day)}
                  className="min-w-fit"
                >
                  Dia {day}
                  {getDayPontos(day).length > 0 && (
                    <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                      {getDayPontos(day).length}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Itinerary for Selected Day */}
          <div className="px-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Dia {selectedDay}
                  </CardTitle>
                  <Dialog open={isAddingPonto} onOpenChange={setIsAddingPonto}>
                    <DialogTrigger asChild>
                      <Button 
                        size="icon" 
                        className="bg-gradient-ocean hover:shadow-travel transition-all duration-300 rounded-full"
                        onClick={() => setNewPonto({...newPonto, day_number: selectedDay})}
                      >
                        <Plus className="w-5 h-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Adicionar Ponto - Dia {selectedDay}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Categoria</Label>
                          <select
                            value={newPonto.category}
                            onChange={(e) => setNewPonto({...newPonto, category: e.target.value as keyof typeof CATEGORY_CONFIG})}
                            className="w-full p-2 border rounded-md"
                          >
                            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                              <option key={key} value={key}>{config.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label>Horário Início</Label>
                            <Input
                              type="time"
                              value={newPonto.time_start}
                              onChange={(e) => setNewPonto({...newPonto, time_start: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label>Horário Fim</Label>
                            <Input
                              type="time"
                              value={newPonto.time_end}
                              onChange={(e) => setNewPonto({...newPonto, time_end: e.target.value})}
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Título *</Label>
                          <Input
                            value={newPonto.title}
                            onChange={(e) => setNewPonto({...newPonto, title: e.target.value})}
                            placeholder="Ex: Visita ao Cristo Redentor"
                          />
                        </div>

                        <div>
                          <Label>Local *</Label>
                          <Input
                            value={newPonto.location}
                            onChange={(e) => setNewPonto({...newPonto, location: e.target.value})}
                            placeholder="Ex: Corcovado, Rio de Janeiro"
                          />
                        </div>

                        <div>
                          <Label>Descrição</Label>
                          <Textarea
                            value={newPonto.description}
                            onChange={(e) => setNewPonto({...newPonto, description: e.target.value})}
                            placeholder="Descreva o que fazer neste local..."
                          />
                        </div>

                        <div>
                          <Label>Notas</Label>
                          <Textarea
                            value={newPonto.notes}
                            onChange={(e) => setNewPonto({...newPonto, notes: e.target.value})}
                            placeholder="Dicas, observações, lembretes..."
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setIsAddingPonto(false)}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                          <Button 
                            onClick={handleAddPonto} 
                            className="flex-1"
                          >
                            Adicionar ao Dia {selectedDay}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {getDayPontos(selectedDay).length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Map className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum ponto no roteiro para este dia</p>
                    <p className="text-sm">Clique em "+" para começar</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getDayPontos(selectedDay).map((ponto, index) => {
                      const category = CATEGORY_CONFIG[ponto.category];
                      const CategoryIcon = category.icon;
                      const period = TIME_PERIODS[getTimePeriod(ponto.time_start)];
                      const PeriodIcon = period.icon;

                      return (
                        <div key={ponto.id} className="relative">
                          {/* Timeline line */}
                          {index < getDayPontos(selectedDay).length - 1 && (
                            <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-border" />
                          )}
                          
                          <Card 
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handlePontoClick(ponto)}
                          >
                            <CardContent className="p-4">
                              <div className="flex gap-4">
                                <div className={`w-12 h-12 ${category.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                                  <CategoryIcon className="w-6 h-6 text-white" />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-semibold text-lg">{ponto.title}</h4>
                                        <Badge variant="outline" className={`text-xs ${period.color}`}>
                                          <PeriodIcon className="w-3 h-3 mr-1" />
                                          {period.name}
                                        </Badge>
                                      </div>
                                      
                                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-4 h-4" />
                                          {ponto.time_start}
                                          {ponto.time_end && ` - ${ponto.time_end}`}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                          <MapPin className="w-6 h-6 text-gray-500" />
                                        </div>
                                        <div>
                                          <p className="font-medium text-sm">{ponto.location}</p>
                                          <p className="text-xs text-muted-foreground">Clique para ver detalhes</p>
                                        </div>
                                      </div>
                                      
                                      {ponto.description && (
                                        <p className="text-sm text-muted-foreground">{ponto.description}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* PDP Modal */}
          <Dialog open={!!selectedPonto} onOpenChange={() => setSelectedPonto(null)}>
            <DialogContent className="max-w-lg">
              {selectedPonto && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      {(() => {
                        const category = CATEGORY_CONFIG[selectedPonto.category];
                        const CategoryIcon = category.icon;
                        return (
                          <>
                            <div className={`w-8 h-8 ${category.color} rounded-full flex items-center justify-center`}>
                              <CategoryIcon className="w-4 h-4 text-white" />
                            </div>
                            {selectedPonto.title}
                          </>
                        );
                      })()}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {selectedPonto.location}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {selectedPonto.time_start}
                        {selectedPonto.time_end && ` - ${selectedPonto.time_end}`}
                      </div>
                    </div>
                    
                    {selectedPonto.description && (
                      <div>
                        <h4 className="font-medium mb-2">Descrição</h4>
                        <p className="text-sm text-muted-foreground">{selectedPonto.description}</p>
                      </div>
                    )}

                    {selectedPonto.notes && (
                      <div>
                        <h4 className="font-medium mb-2">Notas</h4>
                        <p className="text-sm text-muted-foreground">{selectedPonto.notes}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </PWALayout>
    </ProtectedRoute>
  );
}