import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ItineraryImageUpload } from "@/components/ItineraryImageUpload";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  Save,
  Image as ImageIcon,
  X
} from "lucide-react";

interface Trip {
  id: string;
  title: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
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
  images?: string[];
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
  const { id, tripId } = useParams<{ id?: string; tripId?: string }>();
  const currentId = tripId || id; // Suporta ambas as rotas
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [roteiro, setRoteiro] = useState<Roteiro | null>(null);
  const [pontos, setPontos] = useState<RoteiroPonto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingPonto, setIsAddingPonto] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Form state for new/edit ponto
  const [formData, setFormData] = useState({
    day_number: 1,
    time_start: "09:00",
    time_end: "",
    title: "",
    description: "",
    location: "",
    category: "activity",
    images: [] as string[]
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
    console.log("🚀 RoteiroSimples useEffect executado - currentID:", currentId, "User:", user?.id);
    if (!user?.id || !currentId) return;
    
    const fetchData = async () => {
      try {
        // Busca dados em paralelo para melhor performance
        const [tripResult, roteiroResult] = await Promise.all([
          supabase
            .from("trips")
            .select("id, title, destination, start_date, end_date")
            .eq("id", currentId)
            .eq("user_id", user.id)
            .single(),
          supabase
            .from("roteiros")
            .select("*")
            .eq("trip_id", currentId)
            .eq("user_id", user.id)
            .maybeSingle()
        ]);

        if (tripResult.error) {
          navigate("/viagens");
          return;
        }

        const tripData = tripResult.data;
        setTrip(tripData);

        let roteiroData = roteiroResult.data;
        
        // Se não existe roteiro, cria um novo
        if (!roteiroData) {
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

        // Busca pontos do roteiro ordenados por dia e horário
        const { data: pontosData, error: pontosError } = await supabase
          .from("roteiro_pontos")
          .select("*")
          .eq("roteiro_id", roteiroData.id)
          .eq("user_id", user.id)
          .order("day_number", { ascending: true })
          .order("time_start", { ascending: true }); // Ordenação por horário

        if (pontosError) {
          console.error("Erro ao buscar pontos:", pontosError);
        } else {
          console.log("✅ Pontos encontrados:", pontosData?.length || 0);
          setPontos(pontosData || []);
        }
      } catch (error) {
        console.error("❌ Erro ao carregar roteiro:", error);
      } finally {
        setLoading(false);
      }
    };

    // Sempre executa o fetch para garantir dados atualizados
    fetchData();
  }, [user?.id, currentId]);

  const fetchPontos = async () => {
    if (!roteiro) return;
    
    const { data: pontosData, error: pontosError } = await supabase
      .from("roteiro_pontos")
      .select("*")
      .eq("roteiro_id", roteiro.id)
      .eq("user_id", user!.id)
      .order("day_number", { ascending: true })
      .order("time_start", { ascending: true }); // Ordenação por horário

    if (!pontosError && pontosData) {
      setPontos(pontosData);
    }
  };

  // Função para calcular a data de cada dia do roteiro
  const getDayDate = (dayNumber: number): string => {
    if (!trip?.start_date) return "";
    
    try {
      const startDate = new Date(trip.start_date + 'T00:00:00');
      const dayDate = addDays(startDate, dayNumber - 1);
      return format(dayDate, "dd/MM - EEEE", { locale: ptBR });
    } catch (error) {
      console.error("Erro ao calcular data do dia:", error);
      return "";
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
          user_id: user.id,
          images: formData.images
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
        category: "activity",
        images: []
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

  const openImageViewer = (images: string[], startIndex: number = 0) => {
    setSelectedImages(images);
    setCurrentImageIndex(startIndex);
    setImageViewerOpen(true);
  };

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
              onClick={() => navigate(`/viagem/${currentId}`)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{trip.destination}</h1>
              <p className="text-sm text-muted-foreground">Roteiro de Viagem</p>
            </div>
          </div>

          {/* Grid de pontos estilo Airbnb */}
          <div className="px-4">
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
                  <div key={day} className="space-y-4 mb-8">
                    {/* Day header com data e dia da semana */}
                    <div className="flex items-center gap-3 py-3 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 border-b border-border/20">
                      <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        {day}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">Dia {day}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{getDayDate(Number(day))}</span>
                          <span>•</span>
                          <span>{dayPontos.length} {dayPontos.length === 1 ? 'ponto' : 'pontos'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Grid responsivo estilo catálogo - máximo 4 colunas */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                      {dayPontos.map((ponto) => {
                        const category = CATEGORY_CONFIG[ponto.category] || CATEGORY_CONFIG.activity;
                        const CategoryIcon = category.icon;
                        const period = TIME_PERIODS[getTimePeriod(ponto.time_start)];
                        const PeriodIcon = period.icon;

                        return (
                          <Card key={ponto.id} className="group cursor-pointer hover:shadow-hover transition-all duration-300 overflow-hidden border-0 shadow-airbnb" onClick={() => navigate(`/roteiro/${currentId}/ponto/${ponto.id}`)}>
                            <div className="relative">
                              {/* Imagem de destaque */}
                              {ponto.images && ponto.images.length > 0 ? (
                                 <div className="relative aspect-[3/2] overflow-hidden rounded-t-lg">
                                  <img
                                    src={ponto.images[0]}
                                    alt={ponto.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                  />
                                  {/* Gradient overlay */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                                  
                                  {ponto.images.length > 1 && (
                                    <div className="absolute top-3 right-3 bg-black/80 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                                      <span className="font-medium">+{ponto.images.length - 1}</span>
                                    </div>
                                  )}
                                  
                                  {/* Floating time badge */}
                                   <div className="absolute bottom-3 left-3 bg-background/95 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-border/50">
                                    <Clock className="w-3 h-3 text-primary" />
                                    <span className="text-xs font-semibold text-foreground">{ponto.time_start}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className={`aspect-[3/2] ${category.color} rounded-t-lg flex items-center justify-center relative bg-gradient-to-br`}>
                                  <CategoryIcon className="w-16 h-16 text-white/90" />
                                  {/* Floating time badge */}
                                  <div className="absolute bottom-3 left-3 bg-background/95 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-border/50">
                                    <Clock className="w-3 h-3 text-primary" />
                                    <span className="text-xs font-semibold text-foreground">{ponto.time_start}</span>
                                  </div>
                                </div>
                              )}
                              
                              {/* Floating action buttons removed - now only available in PDP */}
                            </div>
                            
                             {/* Card content */}
                             <CardContent className="p-3 space-y-1.5">
                               <div className="flex items-start justify-between gap-2">
                                 <h3 className="font-semibold text-foreground line-clamp-1">{ponto.title}</h3>
                                 <Badge variant="outline" className="text-xs shrink-0">
                                   <PeriodIcon className="w-3 h-3 mr-1" />
                                   {period.name}
                                 </Badge>
                               </div>
                               
                               <p className="text-sm text-muted-foreground line-clamp-1 mb-1">
                                 <MapPin className="w-3 h-3 inline mr-1" />
                                 {ponto.location}
                               </p>
                               
                               <div className="flex items-center justify-between">
                                 <Badge variant="secondary" className="text-xs">
                                   {category.name}
                                 </Badge>
                                 {ponto.images && ponto.images.length > 1 && (
                                   <span className="text-xs text-muted-foreground">
                                     +{ponto.images.length - 1} fotos
                                   </span>
                                 )}
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

               <div>
                 <Label>Imagens</Label>
                 <ItineraryImageUpload
                   images={formData.images}
                   onImagesChange={(images) => setFormData({...formData, images})}
                   maxImages={5}
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

        {/* Image Viewer Dialog */}
         <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
           <DialogContent className="max-w-4xl max-h-[90vh] p-0">
             <div className="relative">
               <Button
                 variant="ghost"
                 size="icon"
                 className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
                 onClick={() => setImageViewerOpen(false)}
               >
                 <X className="w-4 h-4" />
               </Button>
               
               {selectedImages.length > 0 && (
                 <div className="space-y-4">
                   <div className="relative">
                     <img
                       src={selectedImages[currentImageIndex]}
                       alt={`Imagem ${currentImageIndex + 1}`}
                       className="w-full h-[60vh] object-contain bg-black rounded-t-lg"
                     />
                     
                     {selectedImages.length > 1 && (
                       <>
                         <Button
                           variant="ghost"
                           size="icon"
                           className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                           onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                           disabled={currentImageIndex === 0}
                         >
                           ←
                         </Button>
                         <Button
                           variant="ghost"
                           size="icon"
                           className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                           onClick={() => setCurrentImageIndex(Math.min(selectedImages.length - 1, currentImageIndex + 1))}
                           disabled={currentImageIndex === selectedImages.length - 1}
                         >
                           →
                         </Button>
                       </>
                     )}
                   </div>
                   
                   {selectedImages.length > 1 && (
                     <div className="flex gap-2 p-4 overflow-x-auto">
                       {selectedImages.map((image, index) => (
                         <img
                           key={index}
                           src={image}
                           alt={`Miniatura ${index + 1}`}
                           className={`w-16 h-12 object-cover rounded cursor-pointer border-2 ${
                             index === currentImageIndex ? 'border-primary' : 'border-transparent'
                           }`}
                           onClick={() => setCurrentImageIndex(index)}
                         />
                       ))}
                     </div>
                   )}
                 </div>
               )}
             </div>
           </DialogContent>
         </Dialog>
       </PWALayout>
     </ProtectedRoute>
   );
 }