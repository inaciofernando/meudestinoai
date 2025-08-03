import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Map,
  Edit,
  Trash2,
  Save
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
  const [isAddingPonto, setIsAddingPonto] = useState(false);
  const [isEditingPonto, setIsEditingPonto] = useState(false);
  const [editingPonto, setEditingPonto] = useState<RoteiroPonto | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pontoToDelete, setPontoToDelete] = useState<RoteiroPonto | null>(null);

  // Form state for new/edit ponto
  const [formData, setFormData] = useState({
    day_number: 1,
    time_start: "09:00",
    time_end: "",
    title: "",
    description: "",
    location: "",
    category: "activity"
  });

  const getTotalDays = (startDate: string | null, endDate: string | null): number => {
    if (!startDate || !endDate) return 7;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  useEffect(() => {
    console.log("🚀 RoteiroSimples carregando - versão nova");
    if (!user?.id || !id) return;
    
    const fetchData = async () => {
      try {
        // Fetch trip with dates
        const { data: tripData, error: tripError } = await supabase
          .from("trips")
          .select("id, title, destination, start_date, end_date")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (tripError) {
          navigate("/viagens");
          return;
        }

        setTrip(tripData);

        // Get or create roteiro - using the same logic as the old page
        let roteiroData;
        const { data: existingRoteiro, error: roteiroError } = await supabase
          .from("roteiros")
          .select("*")
          .eq("trip_id", tripData.id)
          .eq("user_id", user.id)
          .single();

        if (existingRoteiro && !roteiroError) {
          roteiroData = existingRoteiro;
        } else {
          // Create new roteiro if none exists
          const { data: newRoteiro, error: createError } = await supabase
            .from("roteiros")
            .insert({
              trip_id: tripData.id,
              user_id: user.id,
              title: `Roteiro ${tripData.title}`,
              description: `Planejamento detalhado para ${tripData.destination}`,
              total_days: getTotalDays(tripData.start_date, tripData.end_date)
            })
            .select()
            .single();

          if (createError) {
            console.error("Erro ao criar roteiro:", createError);
            return;
          }
          roteiroData = newRoteiro;
        }

        setRoteiro(roteiroData);

        // Fetch pontos - using the same query as the old page
        const { data: pontosData, error: pontosError } = await supabase
          .from("roteiro_pontos")
          .select("*")
          .eq("roteiro_id", roteiroData.id)
          .eq("user_id", user.id)
          .order("day_number", { ascending: true })
          .order("order_index", { ascending: true });

        if (pontosError) {
          console.error("Erro ao buscar pontos:", pontosError);
        } else {
          console.log("✅ Pontos encontrados:", pontosData?.length || 0);
          setPontos(pontosData || []);
        }
      } catch (error) {
        console.error("❌ Erro na nova página:", error);
        console.error("Erro:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, id]);

  const fetchPontos = async () => {
    if (!roteiro) return;
    
    const { data: pontosData, error: pontosError } = await supabase
      .from("roteiro_pontos")
      .select("*")
      .eq("roteiro_id", roteiro.id)
      .eq("user_id", user!.id)
      .order("day_number", { ascending: true })
      .order("order_index", { ascending: true });

    if (!pontosError && pontosData) {
      setPontos(pontosData);
    }
  };

  const handleAddPonto = async () => {
    if (!roteiro || !user || !formData.title || !formData.location) {
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
        .insert({
          roteiro_id: roteiro.id,
          day_number: formData.day_number,
          time_start: formData.time_start,
          time_end: formData.time_end || null,
          title: formData.title,
          description: formData.description,
          location: formData.location,
          category: formData.category,
          order_index: pontos.filter(p => p.day_number === formData.day_number).length,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Ponto adicionado!",
        description: "Novo ponto foi adicionado ao roteiro.",
      });

      // Reset form and close dialog
      setFormData({
        day_number: 1,
        time_start: "09:00",
        time_end: "",
        title: "",
        description: "",
        location: "",
        category: "activity"
      });
      setIsAddingPonto(false);
      fetchPontos();
    } catch (error) {
      console.error('Error adding ponto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o ponto. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleEditPonto = (ponto: RoteiroPonto) => {
    setEditingPonto(ponto);
    setFormData({
      day_number: ponto.day_number,
      time_start: ponto.time_start,
      time_end: ponto.time_end || "",
      title: ponto.title,
      description: ponto.description || "",
      location: ponto.location,
      category: ponto.category
    });
    setIsEditingPonto(true);
  };

  const handleUpdatePonto = async () => {
    if (!editingPonto || !user || !formData.title || !formData.location) {
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
          day_number: formData.day_number,
          time_start: formData.time_start,
          time_end: formData.time_end || null,
          title: formData.title,
          description: formData.description,
          location: formData.location,
          category: formData.category
        })
        .eq('id', editingPonto.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Ponto atualizado!",
        description: "As alterações foram salvas com sucesso.",
      });

      setIsEditingPonto(false);
      setEditingPonto(null);
      fetchPontos();
    } catch (error) {
      console.error('Error updating ponto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o ponto. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const confirmDeletePonto = (ponto: RoteiroPonto) => {
    setPontoToDelete(ponto);
    setDeleteDialogOpen(true);
  };

  const handleDeletePonto = async () => {
    if (!pontoToDelete || !user) return;

    try {
      const { error } = await supabase
        .from("roteiro_pontos")
        .delete()
        .eq('id', pontoToDelete.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Ponto excluído!",
        description: "O ponto foi removido do roteiro.",
      });

      setDeleteDialogOpen(false);
      setPontoToDelete(null);
      fetchPontos();
    } catch (error) {
      console.error('Error deleting ponto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o ponto. Tente novamente.",
        variant: "destructive"
      });
    }
  };

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
          </div>

          {/* Timeline vertical */}
          <div className="px-4 space-y-4">
            {Object.keys(groupedPontos).length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Map className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Nenhum ponto no roteiro ainda</p>
                  <p className="text-sm">Clique em "+" para começar</p>
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

                                <div className="flex flex-col gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditPonto(ponto);
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      confirmDeletePonto(ponto);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
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
              onClick={() => setIsAddingPonto(true)}
            >
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Add Ponto Dialog */}
        <Dialog open={isAddingPonto} onOpenChange={setIsAddingPonto}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Ponto ao Roteiro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Dia</Label>
                  <Select value={formData.day_number.toString()} onValueChange={(value) => setFormData({...formData, day_number: parseInt(value)})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: roteiro?.total_days || 7}, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          Dia {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hora Início</Label>
                  <Input
                    type="time"
                    value={formData.time_start}
                    onChange={(e) => setFormData({...formData, time_start: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Hora Fim (opcional)</Label>
                  <Input
                    type="time"
                    value={formData.time_end}
                    onChange={(e) => setFormData({...formData, time_end: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label>Título *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Nome do local ou atividade"
                />
              </div>

              <div>
                <Label>Local *</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Endereço ou nome do local"
                />
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Detalhes sobre o local ou atividade"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsAddingPonto(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleAddPonto} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Ponto Dialog */}
        <Dialog open={isEditingPonto} onOpenChange={setIsEditingPonto}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Ponto do Roteiro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Dia</Label>
                  <Select value={formData.day_number.toString()} onValueChange={(value) => setFormData({...formData, day_number: parseInt(value)})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: roteiro?.total_days || 7}, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          Dia {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hora Início</Label>
                  <Input
                    type="time"
                    value={formData.time_start}
                    onChange={(e) => setFormData({...formData, time_start: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Hora Fim (opcional)</Label>
                  <Input
                    type="time"
                    value={formData.time_end}
                    onChange={(e) => setFormData({...formData, time_end: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label>Título *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Nome do local ou atividade"
                />
              </div>

              <div>
                <Label>Local *</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Endereço ou nome do local"
                />
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Detalhes sobre o local ou atividade"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsEditingPonto(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleUpdatePonto} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este ponto do roteiro? Esta ação não pode ser desfeita.
                {pontoToDelete && (
                  <div className="mt-2 p-2 bg-muted rounded">
                    <p className="font-medium">{pontoToDelete.title}</p>
                    <p className="text-sm text-muted-foreground">{pontoToDelete.location}</p>
                  </div>
                )}
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
      </PWALayout>
    </ProtectedRoute>
  );
}