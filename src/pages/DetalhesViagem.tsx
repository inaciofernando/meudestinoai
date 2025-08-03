import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
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
  X
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
          navigate("/");
          return;
        }

        setTrip(data);
        setImages(data.images || []);
        
        // Update form with trip data when trip is loaded
        form.reset({
          title: data.title,
          destination: data.destination,
          description: data.description || "",
          start_date: data.start_date ? new Date(data.start_date) : undefined,
          end_date: data.end_date ? new Date(data.end_date) : undefined,
        });
      } catch (error) {
        console.error("Erro ao buscar viagem:", error);
        navigate("/");
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
      start_date: trip.start_date ? new Date(trip.start_date) : undefined,
      end_date: trip.end_date ? new Date(trip.end_date) : undefined,
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

      navigate("/");
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

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'planned':
        return 'Planejando';
      case 'completed':
        return 'Concluída';
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
    const date = new Date(dateString);
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate && !endDate) {
      return "Datas não definidas";
    }
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return `${format(start, "dd")} - ${format(end, "dd 'de' MMM", { locale: ptBR })} • ${diffDays} dias`;
    }
    
    if (startDate) {
      const start = new Date(startDate);
      return `A partir de ${format(start, "dd 'de' MMM", { locale: ptBR })}`;
    }
    
    return "Datas não definidas";
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
              <Button onClick={() => navigate("/")} variant="outline">
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
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{trip.title}</h1>
                <Badge variant={getStatusColor(trip.status)}>
                  {getStatusText(trip.status)}
                </Badge>
              </div>
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
                  </CardContent>
                </Card>
              </form>
            </Form>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                    Datas da Viagem
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data de Início</label>
                    <p className="text-foreground">{formatDate(trip.start_date)}</p>
                  </div>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data de Término</label>
                    <p className="text-foreground">{formatDate(trip.end_date)}</p>
                  </div>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Duração</label>
                    <p className="text-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {formatDateRange(trip.start_date, trip.end_date)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Informações Gerais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <p className="text-foreground">{getStatusText(trip.status)}</p>
                  </div>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Criada em</label>
                    <p className="text-foreground">{format(new Date(trip.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</p>
                  </div>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Última atualização</label>
                    <p className="text-foreground">{format(new Date(trip.updated_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Galeria de Imagens */}
          {!isEditing && trip.images && trip.images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Galeria de Imagens</CardTitle>
              </CardHeader>
              <CardContent>
                {trip.images.length === 1 ? (
                  <div className="rounded-lg overflow-hidden">
                    <img 
                      src={trip.images[0]} 
                      alt="Imagem da viagem"
                      className="w-full h-64 md:h-96 object-cover"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg overflow-hidden">
                      <img 
                        src={trip.images[0]} 
                        alt="Imagem principal da viagem"
                        className="w-full h-64 md:h-80 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {trip.images.slice(1, 5).map((image, index) => (
                        <div key={index} className="rounded-lg overflow-hidden relative">
                          <img 
                            src={image} 
                            alt={`Imagem ${index + 2} da viagem`}
                            className="w-full h-[calc(50%-4px)] md:h-[calc((20rem-8px)/2)] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          />
                          {index === 3 && trip.images!.length > 5 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-medium">
                              +{trip.images!.length - 4} fotos
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                onClick={() => navigate("/")}
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
      </PWALayout>
    </ProtectedRoute>
  );
}