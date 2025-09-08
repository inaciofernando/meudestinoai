import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ItineraryImageUpload } from "@/components/ItineraryImageUpload";
import { VoucherUpload } from "@/components/VoucherUpload";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
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
  X,
  ShoppingCart,
  Trees,
  Building2,
  Music,
  Waves,
  Leaf,
  Paintbrush,
  Dumbbell
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
  voucher_files?: Array<{
    url: string;
    name: string;
    type: string;
    description?: string;
  }>;
}

const CATEGORY_CONFIG = {
  food: { name: "Alimentação", icon: Utensils, color: "bg-green-500" },
  transport: { name: "Transporte", icon: Car, color: "bg-blue-500" },
  accommodation: { name: "Hospedagem", icon: Hotel, color: "bg-purple-500" },
  attraction: { name: "Atração", icon: MapPin, color: "bg-red-500" },
  activity: { name: "Atividade", icon: Route, color: "bg-orange-500" },
  shopping: { name: "Compras", icon: ShoppingCart, color: "bg-pink-500" },
  park: { name: "Parques", icon: Trees, color: "bg-green-600" },
  museum: { name: "Museus", icon: Building2, color: "bg-gray-500" },
  entertainment: { name: "Entretenimento", icon: Music, color: "bg-indigo-500" },
  beach: { name: "Praia", icon: Waves, color: "bg-cyan-500" },
  nature: { name: "Natureza", icon: Leaf, color: "bg-emerald-500" },
  culture: { name: "Cultura", icon: Paintbrush, color: "bg-violet-500" },
  sports: { name: "Esportes", icon: Dumbbell, color: "bg-amber-500" },
  nightlife: { name: "Vida Noturna", icon: Moon, color: "bg-slate-600" }
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
  const [saving, setSaving] = useState(false);
  const [isAddingPonto, setIsAddingPonto] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Form state for new/edit ponto
  const [formData, setFormData] = useState({
    day_number: 1,
    time_start: "08:00",
    time_end: "09:00",
    title: "",
    description: "",
    location: "",
    address: "",
    website_link: "",
    tripadvisor_link: "",
    google_maps_link: "",
    waze_link: "",
    category: "activity",
    images: [] as string[],
    vouchers: [] as Array<{
      url: string;
      name: string;
      type: string;
      description?: string;
    }>,
    is_all_day: false
  });

  // Função para adicionar uma hora a um horário
  const addOneHour = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const newHours = (hours + 1) % 24;
    return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Função para validar se hora fim é maior que hora início
  const isEndTimeValid = (startTime: string, endTime: string): boolean => {
    if (!endTime) return true; // hora fim é opcional
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    return endTotalMinutes > startTotalMinutes;
  };

  // Função para lidar com mudança na hora início
  const handleStartTimeChange = (newStartTime: string) => {
    const newEndTime = addOneHour(newStartTime);
    setFormData({
      ...formData, 
      time_start: newStartTime,
      time_end: newEndTime
    });
  };

  // Função para lidar com mudança na hora fim
  const handleEndTimeChange = (newEndTime: string) => {
    setFormData({
      ...formData, 
      time_end: newEndTime
    });
  };

  // Função para lidar com mudança da opção "Dia todo"
  const handleAllDayChange = (isAllDay: boolean) => {
    setFormData({
      ...formData,
      is_all_day: isAllDay,
      time_start: isAllDay ? "" : "08:00",
      time_end: isAllDay ? "" : "09:00"
    });
  };

  // Função para calcular a data de cada dia do roteiro com timezone fix
  const getDayDate = (dayNumber: number): string => {
    if (!trip?.start_date) return "";
    
    try {
      // Usar parseISO para evitar problemas de timezone
      const startDate = parseISO(trip.start_date);
      const dayDate = addDays(startDate, dayNumber - 1);
      return format(dayDate, "dd/MM - EEEE", { locale: ptBR });
    } catch (error) {
      console.error("Erro ao calcular data do dia:", error);
      return "";
    }
  };

  // Função para gerar os dias da viagem com datas reais e timezone fix
  const getTripDays = () => {
    if (!trip?.start_date || !trip?.end_date) return [];
    
    try {
      // Usar parseISO para evitar problemas de timezone
      const startDate = parseISO(trip.start_date);
      const endDate = parseISO(trip.end_date);
      const days = [];
      
      for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
        const dayNumber = Math.ceil((d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const formattedDate = format(d, "dd/MM/yyyy");
        const weekday = format(d, "EEEE", { locale: ptBR }).substring(0, 3).toUpperCase();
        
        days.push({
          value: dayNumber,
          label: `${formattedDate} - ${weekday}`,
          date: formattedDate
        });
      }
      
      return days;
    } catch (error) {
      console.error("Erro ao gerar dias da viagem:", error);
      return [];
    }
  };

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
    
    // Check for pre-filled data from concierge
    const urlParams = new URLSearchParams(window.location.search);
    const titleFromConcierge = urlParams.get('title');
    const descriptionFromConcierge = urlParams.get('description');
    const categoryFromConcierge = urlParams.get('category');
    const locationFromConcierge = urlParams.get('location');
    const fromConcierge = urlParams.get('fromConcierge');
    
    // Verificar se há imagens do concierge no sessionStorage
    const conciergeImages = sessionStorage.getItem('conciergeImages');
    let imagesToLoad: string[] = [];

    if (conciergeImages) {
      try {
        const images = JSON.parse(conciergeImages);
        const attractionImage = images.find((img: any) => img.type === 'attraction');
        if (attractionImage && attractionImage.image) {
          imagesToLoad = [attractionImage.image];
        }
        // Limpar sessionStorage após usar
        sessionStorage.removeItem('conciergeImages');
      } catch (error) {
        console.error('Erro ao processar imagens do concierge:', error);
      }
    }
    
    console.log("🔍 Checking Concierge params for roteiro:", { 
      titleFromConcierge, 
      descriptionFromConcierge, 
      categoryFromConcierge, 
      locationFromConcierge,
      fromConcierge,
      imagesToLoad,
      fullUrl: window.location.href 
    });
    
    if (fromConcierge && titleFromConcierge) {
      console.log("✅ Pre-filling roteiro form with concierge data");
      
      // Buscar parâmetros adicionais
      const addressFromConcierge = urlParams.get('address');
      const websiteFromConcierge = urlParams.get('website');
      const tripadvisorFromConcierge = urlParams.get('tripadvisor'); 
      const gmapFromConcierge = urlParams.get('gmap');
      const wazeFromConcierge = urlParams.get('waze');
      
      setFormData(prev => ({
        ...prev,
        title: titleFromConcierge,
        description: descriptionFromConcierge || '',
        category: categoryFromConcierge || 'attraction',
        location: locationFromConcierge || '',
        address: addressFromConcierge || '',
        website_link: websiteFromConcierge || '',
        tripadvisor_link: tripadvisorFromConcierge ? tripadvisorFromConcierge.trim() : '',
        google_maps_link: gmapFromConcierge || '',
        waze_link: wazeFromConcierge || '',
        images: imagesToLoad
      }));
      setIsAddingPonto(true);
      
      // Clean up URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
    
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
          // Parse voucher_files for each ponto
          const parsedPontos = pontosData?.map(ponto => ({
            ...ponto,
            voucher_files: Array.isArray(ponto.voucher_files) 
              ? ponto.voucher_files as Array<{ url: string; name: string; type: string; description?: string; }>
              : []
          })) || [];
          setPontos(parsedPontos);
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
      // Parse voucher_files for each ponto
      const parsedPontos = pontosData.map(ponto => ({
        ...ponto,
        voucher_files: Array.isArray(ponto.voucher_files) 
          ? ponto.voucher_files as Array<{ url: string; name: string; type: string; description?: string; }>
          : []
      }));
      setPontos(parsedPontos);
    }
  };


  const handleAddPonto = async () => {
    console.log('🟦 ADD PONTO CLICKED - Iniciando função handleAddPonto');
    console.log('🟦 Estado atual:', { 
      roteiro: !!roteiro, 
      user: !!user, 
      formDataTitle: formData.title, 
      formDataLocation: formData.location,
      formData,
      isSaving: saving 
    });
    
    if (saving) {
      console.log('🔴 ERRO: Já está salvando, ignorando clique duplicado');
      return;
    }
    
    if (!roteiro || !user || !formData.title || !formData.location) {
      console.log('🔴 ERRO: Validação falhou', {
        hasRoteiro: !!roteiro,
        hasUser: !!user,
        hasTitle: !!formData.title,
        hasLocation: !!formData.location
      });
      toast({
        title: "Erro",
        description: "Preencha pelo menos o título e local do ponto.",
        variant: "destructive"
      });
      return;
    }

    console.log('🟢 Validações OK, iniciando salvamento...');
    setSaving(true);

    // Verificar se o usuário ainda está autenticado
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Erro de Autenticação",
        description: "Sessão expirada. Por favor, faça login novamente.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Tentando adicionar ponto:', {
        roteiro_id: roteiro.id,
        user_id: user.id,
        title: formData.title,
        location: formData.location,
        is_all_day: formData.is_all_day,
        time_start_original: formData.time_start,
        time_end_original: formData.time_end
      });

      const pontoData = {
        roteiro_id: roteiro.id,
        day_number: formData.day_number,
        time_start: formData.is_all_day ? "00:00" : formData.time_start,
        time_end: formData.is_all_day ? "23:59" : (formData.time_end || null),
        title: formData.title,
        description: formData.description,
        location: formData.location,
        address: formData.address || null,
        website_link: formData.website_link || null,
        tripadvisor_link: formData.tripadvisor_link || null,
        google_maps_link: formData.google_maps_link || null,
        waze_link: formData.waze_link || null,
        category: formData.category,
        order_index: pontos.filter(p => p.day_number === formData.day_number).length,
        user_id: user.id,
        images: formData.images,
        voucher_files: formData.vouchers
      };

      console.log('Dados que serão enviados para o Supabase:', pontoData);

      const { data, error } = await supabase
        .from("roteiro_pontos")
        .insert(pontoData);

      console.log('Resposta do Supabase:', { data, error });

      if (error) {
        console.error('Erro detalhado do Supabase:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('🟢 Ponto adicionado com sucesso!');
      toast({
        title: "Ponto adicionado!",
        description: "Novo ponto foi adicionado ao roteiro.",
      });

      // Reset form and close dialog
      setTimeout(() => {
        setFormData({
          day_number: 1,
          time_start: "08:00",
          time_end: "09:00",
          is_all_day: false,
          title: "",
          description: "",
          location: "",
          address: "",
          website_link: "",
          tripadvisor_link: "",
          google_maps_link: "",
          waze_link: "",
          category: "activity",
          images: [],
          vouchers: []
        });
        setIsAddingPonto(false);
        fetchPontos();
      }, 500);
      
    } catch (error: any) {
      console.error('Erro detalhado ao adicionar ponto:', error);
      toast({
        title: "Erro ao salvar",
        description: error?.message || "Falha ao adicionar ponto ao roteiro.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
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
        <PWALayout showFooter={false}>
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
        <PWALayout showFooter={false}>
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
      <PWALayout showFooter={false}>
        <div className="space-y-6">
          {/* Header integrado */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/viagem/${currentId}`)}
                className="h-9 w-9 p-0 hover:bg-muted rounded-lg"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Roteiro de Viagem</h1>
                <p className="text-muted-foreground text-sm">Organize seu itinerário por dias</p>
              </div>
            </div>

            <Button
              onClick={() => setIsAddingPonto(true)}
              className="w-10 h-10 p-0 rounded-full bg-gradient-ocean hover:shadow-travel transition-all duration-300"
              aria-label="Adicionar ponto"
            >
              <Plus className="w-5 h-5" />
            </Button>
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
                    <div className="flex items-center gap-3 py-3">
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
                               </div>
                               
                               <p className="text-sm text-muted-foreground line-clamp-1 mb-1">
                                 <MapPin className="w-3 h-3 inline mr-1" />
                                 {ponto.location}
                               </p>
                               
                               <div className="flex items-center justify-between">
                                 <Badge variant="outline" className="text-xs">
                                   <PeriodIcon className="w-3 h-3 mr-1" />
                                   {period.name}
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
                  <Label>Categoria</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                        <SelectItem 
                          key={key} 
                          value={key}
                          className="hover:bg-muted focus:bg-muted cursor-pointer"
                        >
                          {config.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label>Dia</Label>
                    <Select value={formData.day_number.toString()} onValueChange={(value) => setFormData({...formData, day_number: parseInt(value)})}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Selecione o dia" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50 max-h-60">
                        {getTripDays().map((day) => (
                          <SelectItem 
                            key={day.value} 
                            value={day.value.toString()}
                            className="hover:bg-muted focus:bg-muted cursor-pointer"
                          >
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="all-day"
                      checked={formData.is_all_day}
                      onChange={(e) => handleAllDayChange(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="all-day">Dia todo</Label>
                  </div>
                  <div className="flex-1">
                    <Label>Início</Label>
                    <Input
                      type="time"
                      value={formData.time_start}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      disabled={formData.is_all_day}
                      className={formData.is_all_day ? "bg-muted" : ""}
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Fim</Label>
                    <Input
                      type="time"
                      value={formData.time_end}
                      onChange={(e) => handleEndTimeChange(e.target.value)}
                      disabled={formData.is_all_day}
                      className={formData.is_all_day ? "bg-muted" : ""}
                    />
                  </div>
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
                   rows={6}
                   className="min-h-[140px]"
                 />
               </div>

               <div>
                 <Label>Endereço</Label>
                 <Input
                   value={formData.address}
                   onChange={(e) => setFormData({...formData, address: e.target.value})}
                   placeholder="Endereço completo do local"
                 />
               </div>

               <div>
                 <Label>Site Oficial</Label>
                 <Input
                   value={formData.website_link}
                   onChange={(e) => setFormData({...formData, website_link: e.target.value})}
                   placeholder="https://www.site.com"
                 />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                   <Label>TripAdvisor</Label>
                   <Input
                     value={formData.tripadvisor_link}
                     onChange={(e) => setFormData({...formData, tripadvisor_link: e.target.value})}
                     placeholder="https://www.tripadvisor.com/..."
                   />
                 </div>
                 <div>
                   <Label>Google Maps</Label>
                   <Input
                     value={formData.google_maps_link}
                     onChange={(e) => setFormData({...formData, google_maps_link: e.target.value})}
                     placeholder="https://maps.google.com/..."
                   />
                 </div>
                 <div>
                   <Label>Waze</Label>
                   <Input
                     value={formData.waze_link}
                     onChange={(e) => setFormData({...formData, waze_link: e.target.value})}
                     placeholder="https://waze.com/ul?..."
                   />
                 </div>
               </div>

                {/* Upload de imagens */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    📸 Imagens do Local
                    <Badge variant="secondary" className="text-xs">Fotos para galeria</Badge>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Adicione fotos do local que aparecerão na galeria de imagens
                  </p>
                  <ItineraryImageUpload
                    images={formData.images}
                    onImagesChange={(images) => setFormData({...formData, images})}
                    maxImages={5}
                  />
                </div>

                {/* Upload de vouchers */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    📄 Vouchers e Documentos
                    <Badge variant="secondary" className="text-xs">PDF, tickets, etc</Badge>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Anexe documentos, vouchers, tickets ou comprovantes
                  </p>
                  <VoucherUpload
                    vouchers={formData.vouchers}
                    onVouchersChange={(vouchers) => setFormData({...formData, vouchers})}
                  />
                </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsAddingPonto(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  onClick={() => {
                    console.log('🔵 BOTÃO SALVAR ROTEIRO CLICADO');
                    handleAddPonto();
                  }} 
                  className="flex-1"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Image Viewer Dialog */}
         <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
           <DialogContent className="max-w-4xl max-h-[90vh] p-0">
             <DialogHeader className="sr-only">
               <DialogTitle>Visualizador de Imagem</DialogTitle>
             </DialogHeader>
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