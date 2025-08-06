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
  FileText,
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
  Route
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ImageUpload";


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
  destination: z.string().min(1, "Destino é obrigatório"),
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      destination: "",
      description: "",
    },
  });

  useEffect(() => {
    const fetchTrip = async () => {
      if (!user || !id) return;

      try {
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
          destination: data.destination,
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

    setUpdating(true);

    try {
      const { error } = await supabase
        .from("trips")
        .update({
          title: data.title,
          destination: data.destination,
          description: data.description || null,
          start_date: data.start_date ? format(data.start_date, "yyyy-MM-dd") : null,
          end_date: data.end_date ? format(data.end_date, "yyyy-MM-dd") : null,
          images: images,
        })
        .eq("id", trip.id)
        .eq("user_id", user.id);

      if (error) {
        throw error;
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
    
    // Reset form to original trip data
    form.reset({
      title: trip.title,
      destination: trip.destination,
          description: trip.description || "",
          start_date: trip.start_date ? parseISO(trip.start_date) : undefined,
          end_date: trip.end_date ? parseISO(trip.end_date) : undefined,
    });
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
        <div className="space-y-0">
          {/* Header */}
          <div className="flex items-center gap-4 p-4 md:p-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/viagens")}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{trip.title}</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {trip.destination}
              </p>
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
                      <FormField
                        control={form.control}
                        name="destination"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Destino</FormLabel>
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
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-destructive" />
                    Datas da Viagem
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {trip.start_date && trip.end_date ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-medium text-foreground">
                          {format(parseISO(trip.start_date), "dd/MMM", { locale: ptBR })} - {format(parseISO(trip.end_date), "dd/MMM/yy", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">
                          {(() => {
                            const start = parseISO(trip.start_date);
                            const end = parseISO(trip.end_date);
                            const diffTime = Math.abs(end.getTime() - start.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                            return `${diffDays} dias`;
                          })()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Datas não definidas</p>
                  )}
                </CardContent>
              </Card>

            </div>
          )}

          {/* Travel Management Menu */}
          {!isEditing && (
            <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Gestão da Viagem
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 hover:bg-primary/10 hover:border-primary/30 transition-all"
                    onClick={() => navigate(`/viagem/${id}/gastos`)}
                  >
                    <DollarSign className="w-6 h-6 text-green-600" />
                    <span className="text-xs font-medium">Gastos</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 hover:bg-primary/10 hover:border-primary/30 transition-all"
                    disabled
                  >
                    <Plane className="w-6 h-6 text-blue-600" />
                    <span className="text-xs font-medium">Transporte</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 hover:bg-primary/10 hover:border-primary/30 transition-all"
                    onClick={() => navigate(`/viagem/${id}/hospedagem`)}
                  >
                    <Hotel className="w-6 h-6 text-purple-600" />
                    <span className="text-xs font-medium">Hospedagem</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 hover:bg-primary/10 hover:border-primary/30 transition-all"
                    onClick={() => navigate(`/viagem/${id}/restaurantes`)}
                  >
                    <UtensilsCrossed className="w-6 h-6 text-orange-600" />
                    <span className="text-xs font-medium">Restaurantes</span>
                  </Button>
                  
                  
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 hover:bg-primary/10 hover:border-primary/30 transition-all"
                    onClick={() => navigate(`/viagem/${id}/roteiro`)}
                  >
                    <Route className="w-6 h-6 text-yellow-600" />
                    <span className="text-xs font-medium">Roteiro</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 hover:bg-primary/10 hover:border-primary/30 transition-all"
                    onClick={() => navigate(`/viagem/${id}/documentos`)}
                  >
                    <FileText className="w-6 h-6 text-pink-600" />
                    <span className="text-xs font-medium">Documentos</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Descrição */}
          {!isEditing && trip.description && (
            <Card>
              <CardHeader>
                <CardTitle>Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">{trip.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Ações */}
          {!isEditing && (
            <div className="flex gap-4 pt-4">
              <Button 
                onClick={() => navigate("/viagens")}
                variant="outline"
                className="flex-1"
              >
                Voltar ao Dashboard
              </Button>
              <Button 
                onClick={() => setIsEditing(true)}
                className="flex-1 bg-gradient-ocean hover:shadow-travel transition-all duration-300"
              >
                Editar Viagem
              </Button>
            </div>
          )}
          </div>
        </div>
      </PWALayout>
    </ProtectedRoute>
  );
}