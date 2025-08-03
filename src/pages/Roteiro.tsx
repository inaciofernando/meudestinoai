import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Star,
  Navigation,
  Camera,
  Utensils,
  Car,
  Plane,
  Hotel,
  Info,
  Route,
  Sun,
  Moon,
  Coffee,
  Sunset,
  Map,
  Compass,
  BookOpen,
  Heart,
  DollarSign
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
  priority: 'high' | 'medium' | 'low';
  estimated_cost?: number;
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
  const [activeTab, setActiveTab] = useState("itinerary");

  // Form states
  const [newPonto, setNewPonto] = useState({
    day_number: 1,
    time_start: "09:00",
    time_end: "10:00",
    title: "",
    description: "",
    location: "",
    category: "attraction" as keyof typeof CATEGORY_CONFIG,
    priority: "medium" as "high" | "medium" | "low",
    estimated_cost: "",
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

        // TODO: Fetch roteiro and pontos when database is ready
        // For now, create a mock roteiro
        const mockRoteiro: Roteiro = {
          id: "mock-roteiro",
          trip_id: tripData.id,
          title: `Roteiro ${tripData.title}`,
          description: `Planejamento detalhado para ${tripData.destination}`,
          total_days: getTotalDays(tripData.start_date, tripData.end_date),
          created_at: new Date().toISOString()
        };
        
        setRoteiro(mockRoteiro);
        
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
    return pontos
      .filter(ponto => ponto.day_number === day)
      .sort((a, b) => a.order_index - b.order_index);
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

    // For now, add to local state (will need database implementation later)
    const newPontoData: RoteiroPonto = {
      id: `ponto-${Date.now()}`,
      roteiro_id: roteiro.id,
      day_number: newPonto.day_number,
      time_start: newPonto.time_start,
      time_end: newPonto.time_end,
      title: newPonto.title,
      description: newPonto.description,
      location: newPonto.location,
      category: newPonto.category,
      priority: newPonto.priority,
      estimated_cost: newPonto.estimated_cost ? parseFloat(newPonto.estimated_cost) : undefined,
      notes: newPonto.notes,
      order_index: getDayPontos(newPonto.day_number).length,
      created_at: new Date().toISOString()
    };

    setPontos(prev => [...prev, newPontoData]);
    
    // Reset form
    setNewPonto({
      day_number: selectedDay,
      time_start: "09:00",
      time_end: "10:00",
      title: "",
      description: "",
      location: "",
      category: "attraction",
      priority: "medium",
      estimated_cost: "",
      notes: ""
    });
    
    setIsAddingPonto(false);

    toast({
      title: "Ponto adicionado! 📍",
      description: `${newPontoData.title} foi adicionado ao roteiro do dia ${newPonto.day_number}.`,
    });
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
              <Dialog open={isAddingPonto} onOpenChange={setIsAddingPonto}>
                <DialogTrigger asChild>
                  <Button size="icon" className="bg-gradient-ocean hover:shadow-travel transition-all duration-300 rounded-full">
                    <Plus className="w-5 h-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Adicionar Ponto ao Roteiro</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Dia</Label>
                        <select
                          value={newPonto.day_number}
                          onChange={(e) => setNewPonto({...newPonto, day_number: parseInt(e.target.value)})}
                          className="w-full p-2 border rounded-md"
                        >
                          {Array.from({length: roteiro.total_days}, (_, i) => i + 1).map(day => (
                            <option key={day} value={day}>Dia {day}</option>
                          ))}
                        </select>
                      </div>
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

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Custo Estimado</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newPonto.estimated_cost}
                          onChange={(e) => setNewPonto({...newPonto, estimated_cost: e.target.value})}
                          placeholder="0,00"
                        />
                      </div>
                      <div>
                        <Label>Prioridade</Label>
                        <select
                          value={newPonto.priority}
                          onChange={(e) => setNewPonto({...newPonto, priority: e.target.value as "high" | "medium" | "low"})}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="high">Alta</option>
                          <option value="medium">Média</option>
                          <option value="low">Baixa</option>
                        </select>
                      </div>
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
                        Adicionar ao Roteiro
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Concierge Tips */}
          <Card className="mx-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                  <Compass className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Seu Concierge Pessoal</h3>
                  <p className="text-muted-foreground">
                    Como seu concierge senior, organizei seu roteiro com timing perfeito, sugestões locais e dicas exclusivas para uma experiência inesquecível em {trip.destination}.
                  </p>
                </div>
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                  <Heart className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              </div>
            </CardContent>
          </Card>

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
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Dia {selectedDay} - Itinerário Detalhado
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getDayPontos(selectedDay).length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Map className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum ponto no roteiro para este dia</p>
                    <p className="text-sm">Clique em "Adicionar Ponto" para começar</p>
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
                          
                          <div className="flex gap-4">
                            <div className={`w-12 h-12 ${category.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                              <CategoryIcon className="w-6 h-6 text-white" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold">{ponto.title}</h4>
                                    <Badge variant="outline" className={`text-xs ${period.color}`}>
                                      <PeriodIcon className="w-3 h-3 mr-1" />
                                      {period.name}
                                    </Badge>
                                    {ponto.priority === "high" && (
                                      <Badge variant="destructive" className="text-xs">
                                        <Star className="w-3 h-3 mr-1" />
                                        Imperdível
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      {ponto.time_start}
                                      {ponto.time_end && ` - ${ponto.time_end}`}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-4 h-4" />
                                      {ponto.location}
                                    </div>
                                    {ponto.estimated_cost && (
                                      <div className="flex items-center gap-1">
                                        <DollarSign className="w-4 h-4" />
                                        R$ {ponto.estimated_cost.toFixed(2)}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {ponto.description && (
                                    <p className="text-sm mb-2">{ponto.description}</p>
                                  )}
                                  
                                  {ponto.notes && (
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                      <div className="flex items-start gap-2">
                                        <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                                        <div>
                                          <p className="text-sm font-medium text-blue-900 mb-1">Dica do Concierge</p>
                                          <p className="text-sm text-blue-700">{ponto.notes}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </PWALayout>
    </ProtectedRoute>
  );
}