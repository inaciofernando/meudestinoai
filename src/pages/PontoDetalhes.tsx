import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import TripSectionHeader from "@/components/TripSectionHeader";
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
  MoreVertical,
  FileText,
  Download,
  ShoppingCart,
  Trees,
  Building2,
  Music,
  Waves,
  Leaf,
  Paintbrush,
  Dumbbell
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
  address?: string;
  website_link?: string;
  tripadvisor_link?: string;
  google_maps_link?: string;
  waze_link?: string;
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
        
        // Parse voucher_files se existir e converter para o tipo correto
        const voucherFiles = pontoResult.data.voucher_files;
        const parsedVoucherFiles = Array.isArray(voucherFiles) 
          ? voucherFiles as Array<{ url: string; name: string; type: string; description?: string; }>
          : [];
        
        const pontoData: RoteiroPonto = {
          id: pontoResult.data.id,
          roteiro_id: pontoResult.data.roteiro_id,
          day_number: pontoResult.data.day_number,
          time_start: pontoResult.data.time_start,
          time_end: pontoResult.data.time_end || undefined,
          title: pontoResult.data.title,
          description: pontoResult.data.description || undefined,
          location: pontoResult.data.location,
          address: pontoResult.data.address || undefined,
          website_link: pontoResult.data.website_link || undefined,
          tripadvisor_link: pontoResult.data.tripadvisor_link || undefined,
          google_maps_link: pontoResult.data.google_maps_link || undefined,
          waze_link: pontoResult.data.waze_link || undefined,
          category: pontoResult.data.category,
          order_index: pontoResult.data.order_index,
          images: pontoResult.data.images || [],
          voucher_files: parsedVoucherFiles
        };
        
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

  const downloadVoucher = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Erro ao baixar voucher:", error);
      toast({
        title: "Erro",
        description: "Não foi possível baixar o arquivo.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <PWALayout showFooter={false}>
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
        <PWALayout showFooter={false}>
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
      <PWALayout showFooter={false}>
        <div className="space-y-6">
          {/* Header integrado seguindo padrão do catálogo */}
          <TripSectionHeader
            title={ponto.title}
            subtitle={ponto.location}
            onBack={() => navigate(`/roteiro/${tripId}`)}
            right={
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/roteiro/${tripId}/ponto/${pontoId}/edit`)}
                  className="rounded-lg flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  <span className="hidden sm:inline">Editar</span>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-destructive hover:text-destructive flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Excluir</span>
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
            }
          />

          {/* Conteúdo principal */}
          <div className="px-4">
            <div className="space-y-6">
              {/* Galeria de imagens */}
              {ponto.images && ponto.images.length > 0 && (
                <div className="relative rounded-xl overflow-hidden">
                  <img
                    src={ponto.images[currentImageIndex]}
                    alt={ponto.title}
                    className="w-full h-64 md:h-96 object-cover"
                  />
                  
                  {/* Badge com contador de imagens */}
                  <div className="absolute top-4 right-4 bg-black/70 text-white text-sm px-3 py-1 rounded-full flex items-center gap-1">
                    📸 {currentImageIndex + 1} / {ponto.images.length}
                  </div>
                  
                  {/* Navegação das imagens */}
                  {ponto.images.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 hover:bg-white shadow-lg"
                        onClick={prevImage}
                        disabled={currentImageIndex === 0}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 hover:bg-white shadow-lg"
                        onClick={nextImage}
                        disabled={currentImageIndex === ponto.images.length - 1}
                      />
                      
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
              )}

              {/* Detalhes do Ponto */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
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
                   </div>
                 </CardContent>
               </Card>

               {/* Links Úteis */}
               {(ponto.address || ponto.website_link || ponto.tripadvisor_link || ponto.google_maps_link || ponto.waze_link) && (
                 <Card>
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                       <MapPin className="w-5 h-5" />
                       Informações e Links
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4">
                     {ponto.address && (
                       <div>
                         <strong>Endereço:</strong>
                         <p className="text-muted-foreground mt-1">{ponto.address}</p>
                       </div>
                     )}
                     
                     {(ponto.website_link || ponto.tripadvisor_link || ponto.google_maps_link || ponto.waze_link) && (
                       <div>
                         <strong>Links Úteis:</strong>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                           {ponto.website_link && (
                             <Button
                               variant="outline"
                               size="sm"
                               className="justify-start"
                               onClick={() => window.open(ponto.website_link, '_blank')}
                             >
                               <Eye className="w-4 h-4 mr-2" />
                               Site Oficial
                             </Button>
                           )}
                           
                           {ponto.tripadvisor_link && (
                             <Button
                               variant="outline"
                               size="sm"
                               className="justify-start"
                               onClick={() => window.open(ponto.tripadvisor_link, '_blank')}
                             >
                               <Star className="w-4 h-4 mr-2" />
                               TripAdvisor
                             </Button>
                           )}
                           
                           {ponto.google_maps_link && (
                             <Button
                               variant="outline"
                               size="sm"
                               className="justify-start"
                               onClick={() => window.open(ponto.google_maps_link, '_blank')}
                             >
                               <MapPin className="w-4 h-4 mr-2" />
                               Google Maps
                             </Button>
                           )}
                           
                           {ponto.waze_link && (
                             <Button
                               variant="outline"
                               size="sm"
                               className="justify-start"
                               onClick={() => window.open(ponto.waze_link, '_blank')}
                             >
                               <Route className="w-4 h-4 mr-2" />
                               Waze
                             </Button>
                           )}
                         </div>
                       </div>
                     )}
                   </CardContent>
                 </Card>
               )}

               {/* Vouchers e Documentos - só mostra se houver arquivos válidos */}
               {ponto.voucher_files && ponto.voucher_files.length > 0 && ponto.voucher_files.some(v => v.url && v.name) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      📄 Vouchers e Documentos
                      <Badge variant="secondary" className="text-xs">
                        {ponto.voucher_files.length} arquivo{ponto.voucher_files.length !== 1 ? 's' : ''}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-3">
                      {ponto.voucher_files.map((voucher, index) => (
                        <Card key={index} className="border-muted/50">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="p-2 rounded-lg bg-primary/10">
                                  <FileText className="w-5 h-5 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-sm font-semibold truncate">{voucher.name}</h4>
                                  {voucher.description && (
                                    <p className="text-xs text-muted-foreground mt-1">{voucher.description}</p>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {voucher.type || 'Documento'}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadVoucher(voucher.url, voucher.name)}
                                className="flex items-center gap-2 flex-shrink-0"
                              >
                                <Download className="w-4 h-4" />
                                <span className="hidden sm:inline">Baixar</span>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

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