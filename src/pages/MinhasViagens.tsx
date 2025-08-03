import { useState, useEffect } from "react";
import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { 
  MapPin, 
  Calendar, 
  Clock,
  Plus,
  Filter,
  Eye
} from "lucide-react";

type Trip = {
  id: string;
  title: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  description: string | null;
  images: string[];
  created_at: string;
  updated_at: string;
};

export default function MinhasViagens() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrips = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("trips")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Erro ao buscar viagens:", error);
          toast({
            title: "Erro",
            description: "Erro ao carregar suas viagens",
            variant: "destructive",
          });
          return;
        }

        setTrips(data || []);
      } catch (error) {
        console.error("Erro inesperado:", error);
        toast({
          title: "Erro",
          description: "Erro inesperado ao carregar viagens",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [user, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-accent text-accent-foreground";
      case "planned": return "bg-primary text-primary-foreground";
      case "completed": return "bg-muted text-muted-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed": return "Confirmada";
      case "planned": return "Planejando";
      case "completed": return "Realizada";
      default: return "Rascunho";
    }
  };

  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate) return "Data não definida";
    
    const start = format(new Date(startDate), "dd MMM", { locale: ptBR });
    
    if (!endDate) return start;
    
    const end = format(new Date(endDate), "dd MMM yyyy", { locale: ptBR });
    return `${start} - ${end}`;
  };

  const calculateDuration = (startDate: string | null, endDate: string | null) => {
    if (!startDate || !endDate) return "Duração não definida";
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return `${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
  };

  const getDestinationEmoji = (destination: string) => {
    const dest = destination.toLowerCase();
    if (dest.includes('paris') || dest.includes('frança')) return '🗼';
    if (dest.includes('tokyo') || dest.includes('japão')) return '🗾';
    if (dest.includes('bali') || dest.includes('indonésia')) return '🏝️';
    if (dest.includes('roma') || dest.includes('itália')) return '🏛️';
    if (dest.includes('brasil') || dest.includes('brazil')) return '🇧🇷';
    if (dest.includes('eua') || dest.includes('america')) return '🇺🇸';
    return '✈️';
  };

  const handleTripClick = (tripId: string) => {
    navigate(`/viagem/${tripId}`);
  };

  const handleNewTrip = () => {
    navigate('/nova-viagem');
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <PWALayout>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Minhas Viagens</h1>
                <p className="text-muted-foreground text-sm">Gerencie todas as suas aventuras</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
                <Button variant="travel" size="sm" className="gap-2" onClick={handleNewTrip}>
                  <Plus className="w-4 h-4" />
                  Nova
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3 flex-1">
                        <Skeleton className="w-8 h-8 rounded" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-1/3" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </PWALayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PWALayout>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Minhas Viagens</h1>
              <p className="text-muted-foreground text-sm">
                {trips.length === 0 ? 'Nenhuma viagem encontrada' : `${trips.length} ${trips.length === 1 ? 'viagem' : 'viagens'}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
              <Button variant="travel" size="sm" className="gap-2" onClick={handleNewTrip}>
                <Plus className="w-4 h-4" />
                Nova
              </Button>
            </div>
          </div>

          {/* Lista de Viagens */}
          {trips.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="space-y-4">
                <div className="text-6xl">✈️</div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Nenhuma viagem ainda</h3>
                  <p className="text-muted-foreground">Comece planejando sua primeira aventura!</p>
                </div>
                <Button variant="travel" onClick={handleNewTrip} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Criar primeira viagem
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {trips.map((trip) => (
                <Card 
                  key={trip.id} 
                  className="hover:shadow-card transition-smooth cursor-pointer"
                  onClick={() => handleTripClick(trip.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3 flex-1">
                        <div className="text-2xl">{getDestinationEmoji(trip.destination)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground truncate">
                              {trip.title}
                            </h3>
                            <Badge 
                              className={`text-xs ${getStatusColor(trip.status)}`}
                            >
                              {getStatusLabel(trip.status)}
                            </Badge>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {trip.destination}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {formatDateRange(trip.start_date, trip.end_date)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {calculateDuration(trip.start_date, trip.end_date)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PWALayout>
    </ProtectedRoute>
  );
}