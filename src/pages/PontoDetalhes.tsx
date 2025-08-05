import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  ChevronRight,
  Trash2,
  MoreVertical
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
  const [isDeleting, setIsDeleting] = useState(false);

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
        // Busca dados em paralelo para melhor performance
        const [tripResult, pontoResult] = await Promise.all([
          supabase
            .from("trips")
            .select("id, title, destination")
            .eq("id", tripId)
            .eq("user_id", user.id)
            .single(),
          supabase
            .from("roteiro_pontos")
            .select("*")
            .eq("id", pontoId)
            .eq("user_id", user.id)
            .single()
        ]);

        if (tripResult.error) {
          navigate("/viagens");
          return;
        }

        if (pontoResult.error) {
          navigate(`/roteiro/${tripId}`);
          return;
        }

        setTrip(tripResult.data);
        setPonto(pontoResult.data);
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

    // Evita execução desnecessária se já temos os dados do ponto
    if (!ponto || ponto.id !== pontoId) {
      fetchData();
    } else {
      setLoading(false);
    }
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

  const handleDelete = async () => {
    if (!ponto || !user?.id) return;
    
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from("roteiro_pontos")
        .delete()
        .eq("id", ponto.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Ponto excluído!",
        description: "O ponto foi removido do roteiro com sucesso.",
      });

      navigate(`/roteiro/${tripId}`, { replace: true });
    } catch (error) {
      console.error("Erro ao excluir ponto:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o ponto.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
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
        <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
          {/* Header fixo com botões */}
          <div className="flex-shrink-0 p-4 bg-background/95 backdrop-blur-sm border-b">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/roteiro/${tripId}`)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
                <h1 className="text-2xl font-bold">{ponto.title}</h1>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/roteiro/${tripId}/ponto/${pontoId}/edit`)}
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir ponto</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir "{ponto?.title}"? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting ? "Excluindo..." : "Excluir"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>

          {/* Conteúdo principal */}
          <div className="flex-1 overflow-auto p-4">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Galeria de imagens */}
              {ponto.images && ponto.images.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <div className="relative">
                      <img
                        src={ponto.images[currentImageIndex]}
                        alt={ponto.title}
                        className="w-full h-64 md:h-96 object-cover rounded-lg"
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
                          />
                          
                          {/* Contador de imagens */}
                          <div className="absolute top-4 right-4 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                            {currentImageIndex + 1} / {ponto.images.length}
                          </div>
                          
                          {/* Indicadores */}
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
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
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Detalhes do Ponto */}
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes do Ponto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <strong>Local:</strong>
                      <p className="text-lg mt-1 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        {ponto.location}
                      </p>
                    </div>
                    <div>
                      <strong>Categoria:</strong>
                      <p className="text-lg mt-1 flex items-center gap-2">
                        <CategoryIcon className="w-4 h-4 text-muted-foreground" />
                        {category.name}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <strong>Horário:</strong>
                      <p className="text-lg mt-1 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {ponto.time_start} {ponto.time_end && `- ${ponto.time_end}`}
                      </p>
                    </div>
                    <div>
                      <strong>Dia da viagem:</strong>
                      <p className="text-lg mt-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        Dia {ponto.day_number}
                      </p>
                    </div>
                  </div>

                  <div>
                    <strong>Período:</strong>
                    <p className="text-lg mt-1 flex items-center gap-2">
                      <PeriodIcon className={`w-4 h-4 ${period.color}`} />
                      {period.name}
                    </p>
                  </div>

                  {ponto.description && (
                    <div>
                      <strong>Descrição:</strong>
                      <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{ponto.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Informações da Viagem */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações da Viagem</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <strong>Destino:</strong>
                    <p className="text-lg mt-1">{trip.destination}</p>
                  </div>
                  <div>
                    <strong>Viagem:</strong>
                    <p className="text-lg mt-1">{trip.title}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Ações Rápidas */}
              <Card>
                <CardHeader>
                  <CardTitle>Ações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                      className="flex items-center gap-2"
                    >
                      <Share className="w-4 h-4" />
                      Compartilhar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsLiked(!isLiked)}
                      className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : ''}`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500' : ''}`} />
                      {isLiked ? 'Curtido' : 'Curtir'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PWALayout>
    </ProtectedRoute>
  );
}