import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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
  Star,
  ChevronLeft,
  ChevronRight,
  Move,
  Edit,
  X,
  Trash2,
  Save
} from "lucide-react";
import { ItineraryImageUpload } from "@/components/ItineraryImageUpload";

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
  images?: string[];
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
  const [isEditingPonto, setIsEditingPonto] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [editPonto, setEditPonto] = useState({
    title: "",
    description: "",
    location: "",
    category: "attraction" as keyof typeof CATEGORY_CONFIG,
    notes: "",
    time_start: "09:00",
    time_end: "10:00",
    images: [] as string[]
  });

  // Form states
  const [newPonto, setNewPonto] = useState({
    day_number: 1,
    time_start: "09:00",
    time_end: "10:00",
    title: "",
    description: "",
    location: "",
    category: "attraction" as keyof typeof CATEGORY_CONFIG,
    notes: "",
    images: [] as string[]
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

        // First try to find a roteiro that has points
        const { data: roteirosWithPoints } = await supabase
          .from("roteiros")
          .select("id, trip_id, title, description, total_days, created_at, user_id, updated_at")
          .eq("trip_id", tripData.id)
          .eq("user_id", user.id);

        // Check which roteiros have points
        let roteiroData = null;
        if (roteirosWithPoints && roteirosWithPoints.length > 0) {
          for (const roteiro of roteirosWithPoints) {
            const { data: pontosCount } = await supabase
              .from("roteiro_pontos")
              .select("id", { count: "exact" })
              .eq("roteiro_id", roteiro.id)
              .eq("user_id", user.id);
            
            if (pontosCount && pontosCount.length > 0) {
              roteiroData = roteiro;
              break;
            }
          }
        }

        // If no roteiro with points found, get the most recent one
        if (!roteiroData) {
          const { data: latestRoteiro, error: roteiroError } = await supabase
            .from("roteiros")
            .select("*")
            .eq("trip_id", tripData.id)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          
          roteiroData = latestRoteiro;
          
          if (roteiroError && roteiroError.code !== 'PGRST116') {
            console.error("Erro ao buscar roteiro:", roteiroError);
            navigate("/viagens");
            return;
          }
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
        
        // First let's check what roteiro_pontos exist
        const { data: allPontos } = await supabase
          .from("roteiro_pontos")
          .select("*");
        console.log("🗂️ Todos os pontos do roteiro no DB:", allPontos);
        
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
          images: newPonto.images,
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
        notes: "",
        images: []
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
    setCurrentImageIndex(0);
    setIsEditingPonto(false);
    // Preencher formulário de edição
    setEditPonto({
      title: ponto.title,
      description: ponto.description || "",
      location: ponto.location,
      category: ponto.category,
      notes: ponto.notes || "",
      time_start: ponto.time_start,
      time_end: ponto.time_end || "",
      images: ponto.images || []
    });
  };

  const handleEditPonto = async () => {
    if (!selectedPonto || !editPonto.title || !editPonto.location) {
      toast({
        title: "Erro",
        description: "Preencha pelo menos o título e local do ponto.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("roteiro_pontos")
        .update({
          title: editPonto.title,
          description: editPonto.description,
          location: editPonto.location,
          category: editPonto.category,
          notes: editPonto.notes,
          time_start: editPonto.time_start,
          time_end: editPonto.time_end || null,
          images: editPonto.images
        })
        .eq("id", selectedPonto.id)
        .eq("user_id", user!.id);

      if (error) {
        console.error("Erro ao atualizar ponto:", error);
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o ponto. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      // Atualizar estado local
      const updatedPonto = { ...selectedPonto, ...editPonto };
      setSelectedPonto(updatedPonto);
      setPontos(prev => prev.map(p => p.id === selectedPonto.id ? updatedPonto as RoteiroPonto : p));
      
      setIsEditingPonto(false);

      toast({
        title: "Ponto atualizado! ✅",
        description: `${editPonto.title} foi atualizado com sucesso.`,
      });
    } catch (error) {
      console.error("Erro ao editar ponto:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o ponto. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleDeletePonto = async () => {
    if (!selectedPonto) return;

    try {
      const { error } = await supabase
        .from("roteiro_pontos")
        .delete()
        .eq("id", selectedPonto.id)
        .eq("user_id", user!.id);

      if (error) {
        console.error("Erro ao excluir ponto:", error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o ponto. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      // Remover do estado local
      setPontos(prev => prev.filter(p => p.id !== selectedPonto.id));
      setSelectedPonto(null);

      toast({
        title: "Ponto excluído! 🗑️",
        description: `${selectedPonto.title} foi removido do roteiro.`,
      });
    } catch (error) {
      console.error("Erro ao excluir ponto:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o ponto. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Funções de movimentação de imagens
  const moveImageInPonto = async (fromIndex: number, toIndex: number) => {
    if (!selectedPonto) return;

    const newImages = [...(selectedPonto.images || [])];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);

    // Atualizar no banco de dados
    try {
      const { error } = await supabase
        .from("roteiro_pontos")
        .update({ images: newImages })
        .eq("id", selectedPonto.id)
        .eq("user_id", user!.id);

      if (error) {
        console.error("Erro ao atualizar ordem das imagens:", error);
        toast({
          title: "Erro",
          description: "Não foi possível reordenar as imagens. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      // Atualizar estado local
      const updatedPonto = { ...selectedPonto, images: newImages };
      setSelectedPonto(updatedPonto);
      
      // Atualizar lista de pontos
      setPontos(prev => prev.map(p => p.id === selectedPonto.id ? updatedPonto : p));

      toast({
        title: "Imagem movida! 🖼️",
        description: "A ordem das imagens foi atualizada.",
      });
    } catch (error) {
      console.error("Erro ao mover imagem:", error);
      toast({
        title: "Erro",
        description: "Não foi possível reordenar as imagens. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const nextImage = () => {
    if (selectedPonto?.images && selectedPonto.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedPonto.images!.length);
    }
  };

  const prevImage = () => {
    if (selectedPonto?.images && selectedPonto.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + selectedPonto.images!.length) % selectedPonto.images!.length);
    }
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
                  <h1 className="text-2xl font-bold">Roteiro de Viagem</h1>
                </div>
                <p className="text-muted-foreground">{trip.title} • {trip.destination}</p>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {roteiro.total_days} dias
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

                        <div>
                          <Label>Imagens</Label>
                          <ItineraryImageUpload
                            images={newPonto.images}
                            onImagesChange={(images) => setNewPonto({...newPonto, images})}
                            maxImages={5}
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
                            <div className="absolute left-8 top-20 bottom-0 w-0.5 bg-border" />
                          )}
                          
                          <Card 
                            className="cursor-pointer hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/20 hover:border-l-primary bg-gradient-to-r from-background to-background/50"
                            onClick={() => handlePontoClick(ponto)}
                          >
                            <CardContent className="p-4">
                              <div className="flex gap-4">
                                {/* Main Image or Category Icon */}
                                <div className="flex-shrink-0">
                                  {ponto.images && ponto.images.length > 0 ? (
                                    <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg ring-2 ring-primary/10">
                                      <img
                                        src={ponto.images[0]}
                                        alt={ponto.title}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className={`w-16 h-16 ${category.color} rounded-xl flex items-center justify-center shadow-lg`}>
                                      <CategoryIcon className="w-8 h-8 text-white" />
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-semibold text-lg text-foreground">{ponto.title}</h4>
                                        <Badge variant="outline" className={`text-xs ${period.color} border-current/20`}>
                                          <PeriodIcon className="w-3 h-3 mr-1" />
                                          {period.name}
                                        </Badge>
                                      </div>
                                      
                                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-4 h-4" />
                                          <span className="font-medium">{ponto.time_start}</span>
                                          {ponto.time_end && <span> - {ponto.time_end}</span>}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <MapPin className="w-4 h-4" />
                                          <span className="font-medium text-foreground/80">{ponto.location}</span>
                                        </div>
                                      </div>
                                      
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
          <Dialog open={!!selectedPonto} onOpenChange={(open) => {
            if (!open) {
              setSelectedPonto(null);
              setIsEditingPonto(false);
            }
          }}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              {selectedPonto && (
                <>
                  <DialogHeader>
                    <div className="flex items-center justify-between">
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
                      
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingPonto(!isEditingPonto)}
                          className="h-8"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          {isEditingPonto ? "Cancelar" : "Editar"}
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir ponto do roteiro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. O ponto "{selectedPonto.title}" será removido permanentemente do seu roteiro.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDeletePonto}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Formulário de Edição */}
                    {isEditingPonto ? (
                      <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                        <h4 className="font-medium text-sm text-muted-foreground">Editando ponto</h4>
                        
                        <div>
                          <Label>Categoria</Label>
                          <select
                            value={editPonto.category}
                            onChange={(e) => setEditPonto({...editPonto, category: e.target.value as keyof typeof CATEGORY_CONFIG})}
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
                              value={editPonto.time_start}
                              onChange={(e) => setEditPonto({...editPonto, time_start: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label>Horário Fim</Label>
                            <Input
                              type="time"
                              value={editPonto.time_end}
                              onChange={(e) => setEditPonto({...editPonto, time_end: e.target.value})}
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Título *</Label>
                          <Input
                            value={editPonto.title}
                            onChange={(e) => setEditPonto({...editPonto, title: e.target.value})}
                            placeholder="Ex: Visita ao Cristo Redentor"
                          />
                        </div>

                        <div>
                          <Label>Local *</Label>
                          <Input
                            value={editPonto.location}
                            onChange={(e) => setEditPonto({...editPonto, location: e.target.value})}
                            placeholder="Ex: Corcovado, Rio de Janeiro"
                          />
                        </div>

                        <div>
                          <Label>Descrição</Label>
                          <Textarea
                            value={editPonto.description}
                            onChange={(e) => setEditPonto({...editPonto, description: e.target.value})}
                            placeholder="Descreva o que fazer neste local..."
                          />
                        </div>

                        <div>
                          <Label>Notas</Label>
                          <Textarea
                            value={editPonto.notes}
                            onChange={(e) => setEditPonto({...editPonto, notes: e.target.value})}
                            placeholder="Dicas, observações, lembretes..."
                          />
                        </div>

                        <div>
                          <Label>Imagens</Label>
                          <ItineraryImageUpload
                            images={editPonto.images}
                            onImagesChange={(images) => setEditPonto({...editPonto, images})}
                            maxImages={5}
                          />
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setIsEditingPonto(false)}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                          <Button 
                            onClick={handleEditPonto} 
                            className="flex-1"
                          >
                            <Save className="w-4 h-4 mr-1" />
                            Salvar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Visualização Normal */}
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

                        {selectedPonto.images && selectedPonto.images.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">Imagens ({selectedPonto.images.length})</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsEditingPonto(!isEditingPonto)}
                                className="text-sm"
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                {isEditingPonto ? "Finalizar" : "Reordenar"}
                              </Button>
                            </div>
                            
                            {/* Mobile: Carrossel */}
                            <div className="md:hidden">
                              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                                <img
                                  src={selectedPonto.images[currentImageIndex]}
                                  alt={`${selectedPonto.title} ${currentImageIndex + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                
                                {selectedPonto.images.length > 1 && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black rounded-full w-8 h-8 p-0"
                                      onClick={prevImage}
                                    >
                                      <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black rounded-full w-8 h-8 p-0"
                                      onClick={nextImage}
                                    >
                                      <ChevronRight className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                                
                                {/* Indicadores */}
                                {selectedPonto.images.length > 1 && (
                                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                    {selectedPonto.images.map((_, index) => (
                                      <div
                                        key={index}
                                        className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                                          index === currentImageIndex
                                            ? "bg-white"
                                            : "bg-white/50"
                                        }`}
                                        onClick={() => setCurrentImageIndex(index)}
                                      />
                                    ))}
                                  </div>
                                )}
                                
                                {/* Botão mover no modo edição - Mobile */}
                                {isEditingPonto && selectedPonto.images.length > 1 && (
                                  <div className="absolute top-2 left-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="bg-white/80 hover:bg-white text-black rounded-full w-8 h-8 p-0"
                                      onClick={() => {
                                        const targetIndex = currentImageIndex === 0 ? 1 : currentImageIndex - 1;
                                        moveImageInPonto(currentImageIndex, targetIndex);
                                      }}
                                    >
                                      <Move className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Desktop: Grid layout */}
                            <div className="hidden md:block">
                              <div className="grid grid-cols-2 gap-2">
                                {selectedPonto.images.map((image, imgIndex) => (
                                  <div key={imgIndex} className="relative group">
                                    <img
                                      src={image}
                                      alt={`${selectedPonto.title} ${imgIndex + 1}`}
                                      className="w-full h-24 object-cover rounded-lg border cursor-pointer hover:opacity-75 transition-opacity"
                                      onClick={() => setCurrentImageIndex(imgIndex)}
                                    />
                                    
                                    {/* Botão mover no modo edição - Desktop */}
                                    {isEditingPonto && selectedPonto.images.length > 1 && (
                                      <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="bg-white/80 hover:bg-white text-black rounded-full w-6 h-6 p-0"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const targetIndex = imgIndex > 0 ? imgIndex - 1 : imgIndex + 1;
                                            moveImageInPonto(imgIndex, targetIndex);
                                          }}
                                        >
                                          <Move className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    )}
                                    
                                    {/* Indicador de imagem atual */}
                                    {imgIndex === currentImageIndex && (
                                      <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Instrução de reordenação */}
                            {isEditingPonto && selectedPonto.images.length > 1 && (
                              <div className="mt-2 p-2 bg-muted rounded-lg">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Move className="w-4 h-4" />
                                  <span>Clique no ícone de mover para reordenar as imagens</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
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