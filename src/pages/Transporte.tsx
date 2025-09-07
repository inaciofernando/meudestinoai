import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TripSectionHeader from "@/components/TripSectionHeader";
import { AddTransportDialog } from "@/components/transport/AddTransportDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Plane, 
  Train, 
  Car, 
  Bus, 
  Ship, 
  Clock,
  MapPin,
  Eye,
  Trash2,
  Calendar,
  Hash
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export interface TransportBooking {
  id: string;
  trip_id: string;
  user_id: string;
  transport_type: string;
  title: string;
  description?: string;
  departure_location?: string;
  arrival_location?: string;
  departure_date?: string;
  departure_time?: string;
  arrival_date?: string;
  arrival_time?: string;
  booking_reference?: string;
  confirmation_number?: string;
  provider_name?: string;
  seat_number?: string;
  gate_info?: string;
  vehicle_info?: string;
  total_amount?: number;
  currency: string;
  booking_status: string;
  payment_method?: string;
  ticket_file_name?: string;
  ticket_file_url?: string;
  voucher_file_name?: string;
  voucher_file_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const TRANSPORT_TYPES = {
  flight: { name: "Voo", icon: Plane, color: "bg-blue-500" },
  bus: { name: "Ônibus", icon: Bus, color: "bg-green-500" },
  train: { name: "Trem", icon: Train, color: "bg-purple-500" },
  car_rental: { name: "Aluguel de Carro", icon: Car, color: "bg-orange-500" },
  transfer: { name: "Transfer", icon: Car, color: "bg-yellow-500" },
  boat: { name: "Barco", icon: Ship, color: "bg-cyan-500" },
  other: { name: "Outro", icon: MapPin, color: "bg-gray-500" }
};

export default function Transporte() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [bookings, setBookings] = useState<TransportBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [id, user]);

  const fetchBookings = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from("transport_bookings")
        .select("*")
        .eq("trip_id", id)
        .eq("user_id", user.id)
        .order("departure_date", { ascending: true });

      if (error) {
        console.error("Erro ao buscar transportes:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os transportes",
          variant: "destructive",
        });
        return;
      }

      setBookings(data || []);
    } catch (error) {
      console.error("Erro ao buscar transportes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBooking = (newBooking: TransportBooking) => {
    setBookings(prev => [...prev, newBooking]);
    setIsAddDialogOpen(false);
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("transport_bookings")
        .delete()
        .eq("id", bookingId)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      setBookings(prev => prev.filter(booking => booking.id !== bookingId));
      
      toast({
        title: "Sucesso!",
        description: "Transporte excluído com sucesso",
      });
    } catch (error) {
      console.error("Erro ao excluir transporte:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o transporte",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { label: "Confirmado", variant: "default" },
      cancelled: { label: "Cancelado", variant: "destructive" },
      pending: { label: "Pendente", variant: "secondary" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.confirmed;
    return (
      <Badge variant={config.variant as any}>
        {config.label}
      </Badge>
    );
  };

  const formatDateTime = (date: string | null, time: string | null) => {
    if (!date) return "Não definido";
    
    const dateStr = format(parseISO(date), "dd/MM/yyyy", { locale: ptBR });
    if (time) {
      return `${dateStr} às ${time}`;
    }
    return dateStr;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <PWALayout showHeader={true}>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Carregando transportes...</p>
            </div>
          </div>
        </PWALayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PWALayout showHeader={true}>
        <div className="container mx-auto p-4 space-y-6">
          <TripSectionHeader
            title="Transporte"
            subtitle="Gerencie seus tickets e reservas de transporte"
            onBack={() => navigate(`/viagem/${id}`)}
            onAdd={() => setIsAddDialogOpen(true)}
            addAriaLabel="Adicionar transporte"
          />

          {bookings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 rounded-full bg-primary/10 mb-6">
                  <Plane className="h-16 w-16 text-primary" />
                </div>
                <h3 className="font-semibold text-xl mb-3">Nenhum transporte cadastrado</h3>
                <p className="text-muted-foreground text-center mb-8 max-w-md">
                  Adicione seus tickets de voo, reservas de carro e outros transportes para organizar sua viagem.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={() => setIsAddDialogOpen(true)}
                    size="lg"
                    className="px-8"
                  >
                    <Plane className="w-5 h-5 mr-2" />
                    Adicionar Primeiro Transporte
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const transportConfig = TRANSPORT_TYPES[booking.transport_type as keyof typeof TRANSPORT_TYPES] || TRANSPORT_TYPES.other;
                const IconComponent = transportConfig.icon;
                
                return (
                  <Card key={booking.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${transportConfig.color} text-white`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{booking.title}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">{transportConfig.name}</Badge>
                              {getStatusBadge(booking.booking_status)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/viagem/${id}/transporte/${booking.id}`)}
                            className="text-foreground hover:text-foreground"
                            title="Ver detalhes do transporte"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir este transporte? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteBooking(booking.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {booking.description && (
                        <p className="text-muted-foreground">{booking.description}</p>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(booking.departure_location || booking.arrival_location) && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {booking.departure_location && booking.arrival_location
                                ? `${booking.departure_location} → ${booking.arrival_location}`
                                : booking.departure_location || booking.arrival_location
                              }
                            </span>
                          </div>
                        )}
                        
                        {(booking.departure_date || booking.departure_time) && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              Partida: {formatDateTime(booking.departure_date, booking.departure_time)}
                            </span>
                          </div>
                        )}
                        
                        {booking.provider_name && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              <strong>Operadora:</strong> {booking.provider_name}
                            </span>
                          </div>
                        )}
                        
                        {booking.confirmation_number && (
                          <div className="flex items-center gap-2">
                            <Hash className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              <strong>Confirmação:</strong> {booking.confirmation_number}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {booking.total_amount && (
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-sm text-muted-foreground">Valor Total</span>
                          <span className="font-medium">
                            {booking.currency === 'BRL' ? 'R$' : booking.currency} {booking.total_amount.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <AddTransportDialog
            isOpen={isAddDialogOpen}
            onClose={() => setIsAddDialogOpen(false)}
            onAdd={handleAddBooking}
            tripId={id!}
          />
        </div>
      </PWALayout>
    </ProtectedRoute>
  );
}