import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, ArrowLeft, MapPin, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ImageUpload";
import { TripLocation } from "@/components/TripLocations";

const formSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  destination: z.string().optional(),
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

export default function NovaViagem() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [locations, setLocations] = useState<TripLocation[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      destination: "",
      description: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para criar uma viagem",
        variant: "destructive",
      });
      return;
    }

    // Check if we have at least one destination (either in the field or in locations)
    if (!data.destination && locations.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um destino para sua viagem",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the trip first
      const { data: tripData, error: tripError } = await supabase
        .from("trips")
        .insert([{
          title: data.title,
          destination: data.destination || locations[0]?.location_name || "Múltiplos destinos",
          description: data.description || null,
          start_date: data.start_date ? format(data.start_date, "yyyy-MM-dd") : null,
          end_date: data.end_date ? format(data.end_date, "yyyy-MM-dd") : null,
          user_id: user.id,
          status: "planned",
          images: images,
        }])
        .select();

      if (tripError) {
        throw tripError;
      }

      // Create trip locations if any
      if (locations.length > 0) {
        const { error: locationsError } = await supabase
          .from("trip_locations")
          .insert(
            locations.map((location) => ({
              trip_id: tripData[0].id,
              user_id: user.id,
              location_name: location.location_name,
              location_type: location.location_type,
              order_index: location.order_index,
              notes: location.notes,
            }))
          );

        if (locationsError) {
          throw locationsError;
        }
      }

      toast({
        title: "Sucesso!",
        description: "Viagem criada com sucesso",
      });

      // Clear form after success
      form.reset();
      setImages([]);
      setLocations([]);

      navigate("/viagens");
    } catch (error) {
      console.error("Erro ao criar viagem:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao criar a viagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addLocationFromDestination = () => {
    const destinationValue = form.getValues("destination");
    if (destinationValue && destinationValue.trim()) {
      const locationName = destinationValue.trim();
      
      // Check if destination already exists
      const isDuplicate = locations.some(
        location => location.location_name.toLowerCase() === locationName.toLowerCase()
      );
      
      if (isDuplicate) {
        toast({
          title: "Destino duplicado",
          description: "Este destino já foi adicionado à lista",
          variant: "destructive",
        });
        return;
      }
      
      const newLocation: TripLocation = {
        location_name: locationName,
        location_type: 'city',
        order_index: locations.length
      };
      setLocations([...locations, newLocation]);
      
      // Clear destination input after adding
      form.setValue("destination", "");
    }
  };

  const removeLocation = (index: number) => {
    const updatedLocations = locations.filter((_, i) => i !== index)
      .map((loc, i) => ({ ...loc, order_index: i }));
    setLocations(updatedLocations);
  };

  return (
    <ProtectedRoute>
      <PWALayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Nova Viagem</h1>
              <p className="text-muted-foreground">Planeje sua próxima aventura</p>
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 shadow-card">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título da Viagem</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Férias em Paris" 
                          {...field} 
                        />
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
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Input 
                              placeholder="Ex: Paris, França" 
                              {...field} 
                            />
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon"
                              className="shrink-0"
                              onClick={addLocationFromDestination}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {/* Lista de destinos adicionais */}
                          {locations.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <p className="text-sm text-muted-foreground">Destinos adicionais:</p>
                              {locations.map((location, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                                  <MapPin className="h-4 w-4 text-primary" />
                                  <span className="flex-1 text-sm">{location.location_name}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {location.location_type === 'city' ? 'Cidade' : 
                                     location.location_type === 'region' ? 'Região' : 
                                     location.location_type === 'attraction' ? 'Atração' : 'Aeroporto'}
                                  </Badge>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeLocation(index)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (opcional)</FormLabel>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              initialFocus
                              className="p-3 pointer-events-auto"
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
                                return startDate ? date < startDate : false;
                              }}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Imagens da Viagem</label>
                  <ImageUpload 
                    images={images} 
                    onImagesChange={setImages} 
                    maxImages={5}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-ocean hover:shadow-travel transition-all duration-300"
                  >
                    {isSubmitting ? "Salvando..." : "Criar Viagem"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </PWALayout>
    </ProtectedRoute>
  );
}