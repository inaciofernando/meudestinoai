import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  Plane, 
  Train, 
  Car, 
  Bus, 
  Ship, 
  MapPin,
  Calendar,
  Clock,
  Hash,
  User,
  CreditCard,
  FileText,
  Download,
  Edit,
  Eye
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TransportBooking } from "@/pages/Transporte";
import { EditTransportDialog } from "@/components/transport/EditTransportDialog";
import { DocumentPreview } from "@/components/DocumentPreview";

const TRANSPORT_TYPES = {
  flight: { name: "Voo", icon: Plane, color: "bg-blue-500" },
  bus: { name: "Ônibus", icon: Bus, color: "bg-green-500" },
  train: { name: "Trem", icon: Train, color: "bg-purple-500" },
  car_rental: { name: "Aluguel de Carro", icon: Car, color: "bg-orange-500" },
  transfer: { name: "Transfer", icon: Car, color: "bg-yellow-500" },
  boat: { name: "Barco", icon: Ship, color: "bg-cyan-500" },
  other: { name: "Outro", icon: MapPin, color: "bg-gray-500" }
};

export default function DetalhesTransporte() {
  const { tripId, transportId } = useParams<{ tripId: string; transportId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [booking, setBooking] = useState<TransportBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{url: string, name: string, type?: string} | null>(null);

  useEffect(() => {
    fetchBooking();
  }, [transportId, user]);

  const fetchBooking = async () => {
    if (!user || !transportId) return;

    try {
      const { data, error } = await supabase
        .from("transport_bookings")
        .select("*")
        .eq("id", transportId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Erro ao buscar transporte:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar o transporte",
          variant: "destructive",
        });
        return;
      }

      setBooking(data);
    } catch (error) {
      console.error("Erro ao buscar transporte:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBooking = (updatedBooking: TransportBooking) => {
    setBooking(updatedBooking);
    setIsEditDialogOpen(false);
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
              <p className="mt-4 text-muted-foreground">Carregando transporte...</p>
            </div>
          </div>
        </PWALayout>
      </ProtectedRoute>
    );
  }

  if (!booking) {
    return (
      <ProtectedRoute>
        <PWALayout showHeader={true}>
          <div className="container mx-auto p-4">
            <div className="text-center py-16">
              <h2 className="text-2xl font-semibold mb-2">Transporte não encontrado</h2>
              <p className="text-muted-foreground mb-6">O transporte que você está procurando não existe ou foi removido.</p>
              <Button onClick={() => navigate(`/viagem/${tripId}/transporte`)}>
                Voltar para Transportes
              </Button>
            </div>
          </div>
        </PWALayout>
      </ProtectedRoute>
    );
  }

  const transportConfig = TRANSPORT_TYPES[booking.transport_type as keyof typeof TRANSPORT_TYPES] || TRANSPORT_TYPES.other;
  const IconComponent = transportConfig.icon;

  return (
    <ProtectedRoute>
      <PWALayout showHeader={true}>
        <div className="container mx-auto p-4 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/viagem/${tripId}/transporte`)}
                className="h-9 w-9 p-0 hover:bg-muted rounded-lg"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Detalhes do Transporte</h1>
                <p className="text-muted-foreground text-sm">{booking.title}</p>
              </div>
            </div>
            
            <Button
              onClick={() => setIsEditDialogOpen(true)}
              size="sm"
              variant="outline"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>

          {/* Main Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${transportConfig.color} text-white`}>
                  <IconComponent className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{booking.title}</CardTitle>
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="outline">{transportConfig.name}</Badge>
                    {getStatusBadge(booking.booking_status)}
                  </div>
                  {booking.description && (
                    <p className="text-muted-foreground">{booking.description}</p>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Rota */}
              {(booking.departure_location || booking.arrival_location) && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Rota
                  </h3>
                  <div className="text-lg">
                    {booking.departure_location && booking.arrival_location
                      ? `${booking.departure_location} → ${booking.arrival_location}`
                      : booking.departure_location || booking.arrival_location
                    }
                  </div>
                </div>
              )}

              {/* Datas e Horários */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(booking.departure_date || booking.departure_time) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Partida
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-lg font-medium">
                        {formatDateTime(booking.departure_date, booking.departure_time)}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {(booking.arrival_date || booking.arrival_time) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Chegada
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-lg font-medium">
                        {formatDateTime(booking.arrival_date, booking.arrival_time)}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Informações da Reserva */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Informações da Reserva</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {booking.provider_name && (
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Operadora</p>
                        <p className="font-medium">{booking.provider_name}</p>
                      </div>
                    </div>
                  )}

                  {booking.confirmation_number && (
                    <div className="flex items-center gap-3">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Confirmação</p>
                        <p className="font-medium">{booking.confirmation_number}</p>
                      </div>
                    </div>
                  )}

                  {booking.booking_reference && (
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Referência</p>
                        <p className="font-medium">{booking.booking_reference}</p>
                      </div>
                    </div>
                  )}

                  {booking.seat_number && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Assento</p>
                        <p className="font-medium">{booking.seat_number}</p>
                      </div>
                    </div>
                  )}

                  {booking.gate_info && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Portão</p>
                        <p className="font-medium">{booking.gate_info}</p>
                      </div>
                    </div>
                  )}

                  {booking.vehicle_info && (
                    <div className="flex items-center gap-3">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Veículo</p>
                        <p className="font-medium">{booking.vehicle_info}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Valor */}
              {booking.total_amount && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Valor Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold">
                      {booking.currency === 'BRL' ? 'R$' : booking.currency} {booking.total_amount.toFixed(2)}
                    </div>
                    {booking.payment_method && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Pago via {booking.payment_method}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Arquivos */}
              {(booking.ticket_file_url || booking.voucher_file_url) && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Documentos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {booking.ticket_file_url && (
                      <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Ticket/Bilhete</p>
                                  <p className="text-sm text-muted-foreground">{booking.ticket_file_name}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setPreviewFile({
                                    url: booking.ticket_file_url!,
                                    name: booking.ticket_file_name || 'Ticket',
                                    type: booking.ticket_file_name?.split('.').pop()
                                  })}
                                  title="Visualizar arquivo"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={booking.ticket_file_url} target="_blank" rel="noopener noreferrer" title="Fazer download">
                                    <Download className="h-4 w-4" />
                                  </a>
                                </Button>
                              </div>
                            </div>
                        </CardContent>
                      </Card>
                    )}

                    {booking.voucher_file_url && (
                      <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Voucher/Comprovante</p>
                                  <p className="text-sm text-muted-foreground">{booking.voucher_file_name}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setPreviewFile({
                                    url: booking.voucher_file_url!,
                                    name: booking.voucher_file_name || 'Voucher',
                                    type: booking.voucher_file_name?.split('.').pop()
                                  })}
                                  title="Visualizar arquivo"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={booking.voucher_file_url} target="_blank" rel="noopener noreferrer" title="Fazer download">
                                    <Download className="h-4 w-4" />
                                  </a>
                                </Button>
                              </div>
                            </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {/* Observações */}
              {booking.notes && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Observações</h3>
                  <Card>
                    <CardContent className="p-4">
                      <p className="whitespace-pre-wrap">{booking.notes}</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document Preview Modal */}
          {previewFile && (
            <DocumentPreview
              isOpen={!!previewFile}
              onClose={() => setPreviewFile(null)}
              fileUrl={previewFile.url}
              fileName={previewFile.name}
              fileType={previewFile.type}
            />
          )}

          {/* Edit Dialog */}
          {booking && (
            <EditTransportDialog
              isOpen={isEditDialogOpen}
              onClose={() => setIsEditDialogOpen(false)}
              onUpdate={handleUpdateBooking}
              booking={booking}
            />
          )}
        </div>
      </PWALayout>
    </ProtectedRoute>
  );
}