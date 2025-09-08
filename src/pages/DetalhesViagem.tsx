import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar as CalendarIcon, 
  Clock, 
  Edit,
  Trash2,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Move,
  Settings,
  DollarSign,
  Plane,
  Hotel,
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Ticket,
  Route,
  Bot,
  FileText,
  Image
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ImageUpload";
import { TripLocations, TripLocation } from "@/components/TripLocations";


interface Trip {
  id: string;
  title: string;
  destination: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  images: string[] | null;
}

const formSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
}).refine((data) => {
  if (data.start_date && data.end_date) {
    return data.end_date >= data.start_date;
  }
  return true;
}, {
  message: "Data de término deve ser maior ou igual à data de início",
  path: ["end_date"],
});

type FormData = z.infer<typeof formSchema>;

export default function DetalhesViagem() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [locations, setLocations] = useState<TripLocation[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  useEffect(() => {
    const fetchTrip = async () => {
      if (!user || !id) return;

      try {
        // Fetch trip data
        const { data, error } = await supabase
          .from("trips")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Erro ao buscar viagem:", error);
          toast({
            title: "Erro",
            description: "Viagem não encontrada",
            variant: "destructive",
          });
          navigate("/viagens");
          return;
        }

        // Fetch trip locations
        const { data: locationsData, error: locationsError } = await supabase
          .from("trip_locations")
          .select("*")
          .eq("trip_id", id)
          .eq("user_id", user.id)
          .order("order_index", { ascending: true });

        if (locationsError) {
          console.error("Erro ao buscar locais:", locationsError);
        }

        setLocations(locationsData || []);

        if (error) {
          console.error("Erro ao buscar viagem:", error);
          toast({
            title: "Erro",
            description: "Viagem não encontrada",
            variant: "destructive",
          });
          navigate("/viagens");
          return;
        }

        // Check if trip has expired and should be marked as completed
        if (data.end_date && data.status !== 'completed') {
          const today = new Date();
          const endDate = parseISO(data.end_date);
          
          if (endDate < today) {
            // Trip has expired, update status to completed
            const { error: updateError } = await supabase
              .from('trips')
              .update({ status: 'completed' })
              .eq('id', id)
              .eq('user_id', user.id);
              
            if (!updateError) {
              data.status = 'completed';
              toast({
                title: "Status atualizado",
                description: "Viagem marcada como realizada automaticamente",
              });
            }
          }
        }

        setTrip(data);
        setImages(data.images || []);
        
        // Update form with trip data when trip is loaded
        form.reset({
          title: data.title,
          description: data.description || "",
          start_date: data.start_date ? parseISO(data.start_date) : undefined,
          end_date: data.end_date ? parseISO(data.end_date) : undefined,
        });
      } catch (error) {
        console.error("Erro ao buscar viagem:", error);
        navigate("/viagens");
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, [user, id, navigate, toast, form]);

  const handleUpdate = async (data: FormData) => {
    if (!trip || !user) return;

    // Validation: must have at least one location
    if (locations.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um destino para sua viagem",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);

    try {
      // Update trip data - use first location as main destination
      const { error: tripError } = await supabase
        .from("trips")
        .update({
          title: data.title,
          destination: locations[0]?.location_name || "Múltiplos destinos",
          description: data.description || null,
          start_date: data.start_date ? format(data.start_date, "yyyy-MM-dd") : null,
          end_date: data.end_date ? format(data.end_date, "yyyy-MM-dd") : null,
          images: images,
        })
        .eq("id", trip.id)
        .eq("user_id", user.id);

      if (tripError) {
        throw tripError;
      }

      // Update locations - delete existing and create new ones
      const { error: deleteError } = await supabase
        .from("trip_locations")
        .delete()
        .eq("trip_id", trip.id)
        .eq("user_id", user.id);

      if (deleteError) {
        throw deleteError;
      }

      // Insert new locations if any
      if (locations.length > 0) {
        const { error: insertError } = await supabase
          .from("trip_locations")
          .insert(
            locations.map((location) => ({
              trip_id: trip.id,
              user_id: user.id,
              location_name: location.location_name,
              location_type: location.location_type,
              order_index: location.order_index,
              notes: location.notes,
            }))
          );

        if (insertError) {
          throw insertError;
        }
      }

      // Refresh trip data
      const { data: updatedTrip, error: fetchError } = await supabase
        .from("trips")
        .select("*")
        .eq("id", trip.id)
        .eq("user_id", user.id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      setTrip(updatedTrip);
      setIsEditing(false);

      toast({
        title: "Sucesso!",
        description: "Viagem atualizada com sucesso",
      });
    } catch (error) {
      console.error("Erro ao atualizar viagem:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar a viagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    if (!trip) return;
    
    // Reset form and locations to original trip data
    form.reset({
      title: trip.title,
      description: trip.description || "",
      start_date: trip.start_date ? parseISO(trip.start_date) : undefined,
      end_date: trip.end_date ? parseISO(trip.end_date) : undefined,
    });
    setImages(trip.images || []);
    // Reload locations from database
    if (id && user) {
      supabase
        .from("trip_locations")
        .select("*")
        .eq("trip_id", id)
        .eq("user_id", user.id)
        .order("order_index", { ascending: true })
        .then(({ data }) => {
          setLocations(data || []);
        });
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!trip || !user) return;

    setDeleting(true);

    try {
      const { error } = await supabase
        .from("trips")
        .delete()
        .eq("id", trip.id)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso!",
        description: "Viagem excluída com sucesso",
      });

      navigate("/viagens");
    } catch (error) {
      console.error("Erro ao excluir viagem:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir a viagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!trip || !user) return;

    // Validação: não pode concluir viagem se a data de término não passou
    if (newStatus === 'completed' && trip.end_date) {
      const today = new Date();
      const endDate = parseISO(trip.end_date);
      
      if (endDate > today) {
        toast({
          title: "Não é possível concluir",
          description: "A viagem só pode ser concluída após a data de término",
          variant: "destructive",
        });
        return;
      }
    }

    setStatusUpdating(true);

    try {
      const { error } = await supabase
        .from("trips")
        .update({ status: newStatus })
        .eq("id", trip.id)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      setTrip({ ...trip, status: newStatus });

      toast({
        title: "Sucesso!",
        description: "Status da viagem atualizado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar o status. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setStatusUpdating(false);
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'planned':
        return 'Planejando';
      case 'completed':
        return 'Realizada';
      default:
        return 'Rascunho';
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'planned':
        return 'secondary';
      case 'completed':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Não definida";
    const date = parseISO(dateString);
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate && !endDate) {
      return "Datas não definidas";
    }
    
    if (startDate && endDate) {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return `${format(start, "dd")} - ${format(end, "dd 'de' MMM", { locale: ptBR })} • ${diffDays} dias`;
    }
    
    if (startDate) {
      const start = parseISO(startDate);
      return `A partir de ${format(start, "dd 'de' MMM", { locale: ptBR })}`;
    }
    
    return "Datas não definidas";
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setImages(newImages);
  };

  const nextImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  // Funcionalidade de swipe para PWA
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && images.length > 1) {
      nextImage();
    }
    if (isRightSwipe && images.length > 1) {
      prevImage();
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <PWALayout>
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando viagem...</p>
            </div>
          </div>
        </PWALayout>
      </ProtectedRoute>
    );
  }

  if (!trip) {
    return (
      <ProtectedRoute>
        <PWALayout>
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Viagem não encontrada</p>
              <Button onClick={() => navigate("/viagens")} variant="outline">
                Voltar ao Dashboard
              </Button>
            </div>
          </div>
        </PWALayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PWALayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/viagens")}
                className="h-9 w-9 p-0 hover:bg-muted rounded-lg"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Detalhes da Viagem</h1>
                <p className="text-muted-foreground text-sm">Gerencie informações e documentos da sua viagem</p>
              </div>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={updating}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm"
                    onClick={form.handleSubmit(handleUpdate)}
                    disabled={updating}
                    className="bg-gradient-ocean hover:shadow-travel transition-all duration-300"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Viagem</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir esta viagem? 
                          <br />
                          <br />
                          <strong>Todas as informações desta viagem serão apagadas permanentemente.</strong>
                          <br />
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDelete}
                          disabled={deleting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleting ? "Excluindo..." : "Excluir Viagem"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>

          {/* Galeria de Imagens no Topo - Estilo Airbnb */}
          {images.length > 0 && (
            <div className="relative px-4 md:px-6 pb-6">
              {images.length === 1 ? (
                <div className="aspect-[16/9] md:aspect-[3/2] max-h-[400px] overflow-hidden rounded-2xl border border-border">
                  <img 
                    src={images[0]} 
                    alt="Imagem da viagem"
                    className="w-full h-full object-cover"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  />
                </div>
              ) : (
                <div className="w-full">
                  {/* Mobile: Imagem única com navegação por swipe */}
                  <div className="md:hidden aspect-[16/9] overflow-hidden relative rounded-2xl border border-border">
                    <img 
                      src={images[currentImageIndex]} 
                      alt={`Imagem ${currentImageIndex + 1} da viagem`}
                      className="w-full h-full object-cover"
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {images.map((_, index) => (
                        <div
                          key={index}
                          className={cn(
                            "w-2 h-2 rounded-full transition-all",
                            index === currentImageIndex ? "bg-white" : "bg-white/50"
                          )}
                        />
                      ))}
                    </div>
                    {images.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black rounded-full w-8 h-8 p-0"
                          onClick={prevImage}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black rounded-full w-8 h-8 p-0"
                          onClick={nextImage}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Desktop: Grid layout estilo Airbnb */}
                  <div className="hidden md:grid grid-cols-4 gap-2 h-[400px] w-full border border-border rounded-2xl overflow-hidden">
                    {/* Imagem Principal */}
                    <div className="col-span-2 h-full overflow-hidden relative group">
                      <img 
                        src={images[currentImageIndex]} 
                        alt="Imagem principal da viagem"
                        className="w-full h-full object-cover cursor-pointer hover:brightness-95 transition-all"
                        onClick={() => {
                          const nextIndex = currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1;
                          setCurrentImageIndex(nextIndex);
                        }}
                      />
                      
                      {/* Navegação da imagem principal */}
                      {images.length > 1 && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black rounded-full w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              prevImage();
                            }}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black rounded-full w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              nextImage();
                            }}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                          
                          {/* Indicadores */}
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {images.map((_, index) => (
                              <div
                                key={index}
                                className={cn(
                                  "w-2 h-2 rounded-full transition-all cursor-pointer",
                                  index === currentImageIndex ? "bg-white" : "bg-white/50"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentImageIndex(index);
                                }}
                              />
                            ))}
                          </div>
                        </>
                      )}

                      {isEditing && images.length > 1 && (
                        <div className="absolute top-2 left-2 flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="bg-white/80 hover:bg-white text-black rounded-full w-6 h-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveImage(currentImageIndex, currentImageIndex === 0 ? 1 : currentImageIndex - 1);
                            }}
                          >
                            <Move className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Grid de Imagens Menores */}
                    <div className="col-span-2 grid grid-cols-2 gap-2 h-full">
                      {images.slice(1, 5).map((image, index) => {
                        const realIndex = index + 1;
                        return (
                          <div 
                            key={realIndex} 
                            className="h-full overflow-hidden relative cursor-pointer hover:brightness-95 transition-all"
                            onClick={() => setCurrentImageIndex(realIndex)}
                          >
                            <img 
                              src={image} 
                              alt={`Imagem ${realIndex + 1} da viagem`}
                              className="w-full h-full object-cover"
                            />
                            {index === 3 && images.length > 5 && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-medium text-lg">
                                +{images.length - 5}
                              </div>
                            )}
                            {isEditing && (
                              <div className="absolute top-2 right-2 flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="bg-white/80 hover:bg-white text-black rounded-full w-6 h-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveImage(realIndex, realIndex > 0 ? realIndex - 1 : realIndex + 1);
                                  }}
                                >
                                  <Move className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Modo de Edição - Controles de Reordenar */}
              {isEditing && images.length > 1 && (
                <div className="absolute top-8 left-8 bg-white/90 backdrop-blur-sm rounded-lg p-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Move className="w-4 h-4" />
                    <span>Clique nas setas para reordenar</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="p-4 md:p-6 space-y-6">

          {/* Informações Principais */}
          {isEditing ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informações Básicas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título da Viagem</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Datas da Viagem</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="start_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Data de Início</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP", { locale: ptBR })
                                    ) : (
                                      <span>Selecione uma data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < new Date(new Date().setHours(0, 0, 0, 0))
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="end_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Data de Término</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP", { locale: ptBR })
                                    ) : (
                                      <span>Selecione uma data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => {
                                    const startDate = form.getValues("start_date");
                                    return startDate 
                                      ? date < startDate 
                                      : date < new Date(new Date().setHours(0, 0, 0, 0));
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Descrição</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva sua viagem, atividades planejadas, pontos de interesse..."
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Imagens da Viagem</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ImageUpload 
                      images={images} 
                      onImagesChange={setImages}
                      maxImages={5}
                    />
                    {images.length > 1 && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          💡 Dica: Arraste as imagens para reordenar ou use as setas nas imagens em miniatura na visualização acima.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Destinos da Viagem</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TripLocations
                      locations={locations}
                      onChange={setLocations}
                    />
                    {locations.length === 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Adicione pelo menos um destino para sua viagem
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-primary" />
                      Status da Viagem
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Status Atual</label>
                        <div className="mt-1">
                          <Badge variant={getStatusColor(trip.status)}>
                            {getStatusText(trip.status)}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Alterar Status</label>
                        <Select 
                          value={trip.status || 'planned'} 
                          onValueChange={handleStatusUpdate}
                          disabled={statusUpdating}
                        >
                          <SelectTrigger className="w-full mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planned">Planejando</SelectItem>
                            <SelectItem value="confirmed">Confirmada</SelectItem>
                            <SelectItem value="completed">Realizada</SelectItem>
                          </SelectContent>
                        </Select>
                        {statusUpdating && (
                          <p className="text-sm text-muted-foreground mt-1">Atualizando status...</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </form>
            </Form>
          ) : (
            <div className="space-y-0">
              {/* Hero Section with Trip Title */}
              <div className="relative bg-gradient-to-br from-primary/5 via-background to-secondary/5 rounded-2xl p-6 mb-6">
                <div className="space-y-4">
                  {/* Trip Overview */}
                  <div className="space-y-4">
                    <div>
                      <h1 className="text-2xl font-bold text-foreground mb-2">{trip.title}</h1>
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={getStatusColor(trip.status)} 
                          className="text-sm px-3 py-1 font-medium"
                        >
                          {getStatusText(trip.status)}
                        </Badge>
                      </div>
                    </div>

                    {/* Quick Trip Stats */}
                    {trip.start_date && trip.end_date && (
                      <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4 backdrop-blur-sm border border-white/20 max-w-md">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium text-muted-foreground mb-1">Partida</div>
                            <div className="text-lg font-bold text-foreground">
                              {format(parseISO(trip.start_date), "dd MMM", { locale: ptBR })}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(parseISO(trip.start_date), "yyyy", { locale: ptBR })}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-muted-foreground mb-1">Retorno</div>
                            <div className="text-lg font-bold text-foreground">
                              {format(parseISO(trip.end_date), "dd MMM", { locale: ptBR })}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(parseISO(trip.end_date), "yyyy", { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/20">
                          <div className="flex items-center gap-2 text-primary">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {(() => {
                                const start = parseISO(trip.start_date);
                                const end = parseISO(trip.end_date);
                                const diffTime = Math.abs(end.getTime() - start.getTime());
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                                return `${diffDays} dias de aventura`;
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Destinations Section */}
              {locations.length > 0 && (
                <Card className="mb-8 border-0 shadow-lg bg-gradient-to-r from-background via-background to-primary/5">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-bold flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      Roteiro de Destinos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {locations.map((location, index) => (
                        <div key={location.id || location.order_index} 
                             className="group p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-white/20 hover:bg-white/70 dark:hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                          <div className="flex items-start gap-4">
                            <div className="relative">
                              <div className={cn(
                                "w-4 h-4 rounded-full border-2 border-white shadow-lg",
                                index === 0 ? "bg-primary" : "bg-muted-foreground"
                              )}></div>
                              {index === 0 && (
                                <div className="absolute -inset-1 bg-primary/20 rounded-full animate-pulse" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-foreground text-lg truncate">
                                  {location.location_name}
                                </h4>
                                {index === 0 && (
                                  <Badge variant="secondary" className="text-xs bg-primary text-white border-0 shadow-sm">
                                    Principal
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                                  {location.location_type === 'city' && 'Cidade'}
                                  {location.location_type === 'region' && 'Região'}
                                  {location.location_type === 'attraction' && 'Atração'}
                                  {location.location_type === 'airport' && 'Aeroporto'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Travel Management Dashboard */}
              <Card className="mb-8 border-0 shadow-lg bg-gradient-to-br from-background to-secondary/5">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl font-bold flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <DollarSign className="w-6 h-6 text-primary" />
                    </div>
                    Central de Gestão
                  </CardTitle>
                  <p className="text-muted-foreground">Organize todos os aspectos da sua viagem</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card 
                      className="group cursor-pointer border-2 border-transparent hover:border-green-200 dark:hover:border-green-800 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900"
                      onClick={() => navigate(`/viagem/${id}/gastos`)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="font-semibold text-green-700 dark:text-green-300">Gastos</h3>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">Controle financeiro</p>
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className="group cursor-pointer border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900"
                      onClick={() => navigate(`/viagem/${id}/transporte`)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Plane className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="font-semibold text-blue-700 dark:text-blue-300">Transporte</h3>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Voos e deslocamentos</p>
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className="group cursor-pointer border-2 border-transparent hover:border-purple-200 dark:hover:border-purple-800 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900"
                      onClick={() => navigate(`/viagem/${id}/hospedagem`)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Hotel className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="font-semibold text-purple-700 dark:text-purple-300">Hospedagem</h3>
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Hotéis e estadias</p>
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className="group cursor-pointer border-2 border-transparent hover:border-orange-200 dark:hover:border-orange-800 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900"
                      onClick={() => navigate(`/viagem/${id}/restaurantes`)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-orange-100 dark:bg-orange-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <UtensilsCrossed className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <h3 className="font-semibold text-orange-700 dark:text-orange-300">Restaurantes</h3>
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Gastronomia local</p>
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className="group cursor-pointer border-2 border-transparent hover:border-yellow-200 dark:hover:border-yellow-800 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900"
                      onClick={() => navigate(`/viagem/${id}/roteiro`)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-yellow-100 dark:bg-yellow-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Route className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <h3 className="font-semibold text-yellow-700 dark:text-yellow-300">Roteiro</h3>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Planejamento diário</p>
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className="group cursor-pointer border-2 border-transparent hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900"
                      onClick={() => navigate(`/viagem/${id}/documentos`)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="font-semibold text-emerald-700 dark:text-emerald-300">Documentos</h3>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Papelada importante</p>
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className="group cursor-pointer border-2 border-transparent hover:border-primary/40 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-primary/5 to-primary/10"
                      onClick={() => navigate(`/viagem/${id}/concierge`)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Bot className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-primary">Concierge AI</h3>
                        <p className="text-xs text-primary/80 mt-1">Assistente inteligente</p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* Description Section */}
              {trip.description && (
                <Card className="mb-8 border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      Sobre Esta Viagem
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground leading-relaxed text-lg">{trip.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button 
                  onClick={() => navigate("/viagens")}
                  variant="outline"
                  size="lg"
                  className="flex-1 h-14 text-lg font-medium hover:bg-muted transition-all duration-300"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Voltar ao Dashboard
                </Button>
                <Button 
                  onClick={() => setIsEditing(true)}
                  size="lg"
                  className="flex-1 h-14 text-lg font-medium bg-primary hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Edit className="w-5 h-5 mr-2" />
                  Editar Viagem
                </Button>
              </div>
            </div>
          )}
          </div>
        </div>
      </PWALayout>
    </ProtectedRoute>
  );
}