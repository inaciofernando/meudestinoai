import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Utensils,
  Car,
  Hotel,
  Route,
  Sun,
  Moon,
  Share,
  Heart,
  Star,
  Calendar,
  Eye,
  Edit,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

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

interface Trip {
  id: string;
  title: string;
  destination: string;
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

export default function PontoDetalhes() {
  const { tripId, pontoId } = useParams<{ tripId: string; pontoId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [ponto, setPonto] = useState<RoteiroPonto | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  const getTimePeriod = (time: string): keyof typeof TIME_PERIODS => {
    const hour = parseInt(time.split(':')[0]);
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  useEffect(() => {
    if (!user?.id || !tripId || !pontoId) return;
    
    const fetchData = async () => {
      try {
        // Fetch trip data
        const { data: tripData, error: tripError } = await supabase
          .from("trips")
          .select("id, title, destination")
          .eq("id", tripId)
          .eq("user_id", user.id)
          .single();

        if (tripError) {
          navigate("/viagens");
          return;
        }

        setTrip(tripData);

        // Fetch ponto data
        const { data: pontoData, error: pontoError } = await supabase
          .from("roteiro_pontos")
          .select("*")
          .eq("id", pontoId)
          .eq("user_id", user.id)
          .single();

        if (pontoError) {
          navigate(`/roteiro/${tripId}`);
          return;
        }

        setPonto(pontoData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, tripId, pontoId]);

  const nextImage = () => {
    if (ponto?.images && currentImageIndex < ponto.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: ponto?.title,
          text: ponto?.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Erro ao compartilhar:', err);
      }
    } else {
      // Fallback para copiar URL
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência.",
      });
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <PWALayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Carregando detalhes...</p>
            </div>
          </div>
        </PWALayout>
      </ProtectedRoute>
    );
  }

  if (!ponto || !trip) {
    return (
      <ProtectedRoute>
        <PWALayout>
          <div className="text-center py-12">
            <p>Ponto não encontrado</p>
            <Button onClick={() => navigate(`/roteiro/${tripId}`)} className="mt-4">
              Voltar ao roteiro
            </Button>
          </div>
        </PWALayout>
      </ProtectedRoute>
    );
  }

  const category = CATEGORY_CONFIG[ponto.category] || CATEGORY_CONFIG.activity;
  const CategoryIcon = category.icon;
  const period = TIME_PERIODS[getTimePeriod(ponto.time_start)];
  const PeriodIcon = period.icon;

  return (
    <ProtectedRoute>
      <PWALayout>
        <div className="min-h-screen pb-20">
          {/* Header fixo com overlay */}
          <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-background/80 backdrop-blur-md border-b">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/roteiro/${tripId}`)}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                className="rounded-full"
              >
                <Share className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsLiked(!isLiked)}
                className="rounded-full"
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Galeria de imagens estilo Airbnb */}
          <div className="relative h-[60vh] bg-muted">
            {ponto.images && ponto.images.length > 0 ? (
              <div className="relative h-full">
                <img
                  src={ponto.images[currentImageIndex]}
                  alt={ponto.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Navegação das imagens */}
                {ponto.images.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 hover:bg-white"
                      onClick={prevImage}
                      disabled={currentImageIndex === 0}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 hover:bg-white"
                      onClick={nextImage}
                      disabled={currentImageIndex === ponto.images.length - 1}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    
                    {/* Indicadores */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                      {ponto.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentImageIndex 
                              ? 'bg-white scale-125' 
                              : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Contador de imagens */}
                {ponto.images.length > 1 && (
                  <div className="absolute top-4 right-4 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                    {currentImageIndex + 1} / {ponto.images.length}
                  </div>
                )}
              </div>
            ) : (
              <div className={`h-full ${category.color} flex items-center justify-center`}>
                <CategoryIcon className="w-20 h-20 text-white" />
              </div>
            )}
          </div>

          {/* Conteúdo principal */}
          <div className="p-6 space-y-6">
            {/* Título e badges */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold text-foreground">{ponto.title}</h1>
                <div className="flex gap-2 shrink-0">
                  <Badge variant="outline" className="text-xs">
                    <PeriodIcon className="w-3 h-3 mr-1" />
                    {period.name}
                  </Badge>
                  <Badge className={`text-xs text-white ${category.color}`}>
                    {category.name}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{ponto.location}</span>
              </div>
            </div>

            {/* Informações de tempo */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Horário da visita</p>
                      <p className="text-sm text-muted-foreground">
                        {ponto.time_start} {ponto.time_end && `- ${ponto.time_end}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {ponto.day_number}
                    </div>
                    <div>
                      <p className="font-medium">Dia {ponto.day_number}</p>
                      <p className="text-sm text-muted-foreground">da viagem</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Descrição */}
            {ponto.description && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Sobre este ponto</h2>
                <p className="text-muted-foreground leading-relaxed">{ponto.description}</p>
              </div>
            )}

            {/* Grid de informações adicionais */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Calendar className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Viagem</p>
                  <p className="text-sm text-muted-foreground">{trip.destination}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Eye className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Categoria</p>
                  <p className="text-sm text-muted-foreground">{category.name}</p>
                </CardContent>
              </Card>
            </div>

            {/* Galeria de miniaturas */}
            {ponto.images && ponto.images.length > 1 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Todas as fotos</h2>
                <div className="grid grid-cols-3 gap-2">
                  {ponto.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${ponto.title} - Foto ${index + 1}`}
                      className={`aspect-square object-cover rounded-lg cursor-pointer border-2 transition-all ${
                        index === currentImageIndex 
                          ? 'border-primary scale-105' 
                          : 'border-transparent hover:border-muted-foreground'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer fixo com ações */}
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate(`/roteiro/${tripId}/ponto/${pontoId}/edit`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button
                className="flex-1"
                onClick={() => navigate(`/roteiro/${tripId}`)}
              >
                Voltar ao Roteiro
              </Button>
            </div>
          </div>
        </div>
      </PWALayout>
    </ProtectedRoute>
  );
}