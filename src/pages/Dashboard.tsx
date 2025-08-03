import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  MapPin, 
  Calendar, 
  Wallet, 
  TrendingUp, 
  Clock,
  Plane
} from "lucide-react";

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

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

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
          return;
        }

        setTrips(data || []);
      } catch (error) {
        console.error("Erro ao buscar viagens:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();

    // Setup real-time subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchTrips(); // Refetch data on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'planned':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'planned':
        return 'Planejando';
      default:
        return 'Rascunho';
    }
  };

  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate && !endDate) {
      return "Datas não definidas";
    }
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return `${format(start, "dd")} - ${format(end, "dd MMM", { locale: ptBR })}`;
    }
    
    if (startDate) {
      const start = new Date(startDate);
      return `A partir de ${format(start, "dd MMM", { locale: ptBR })}`;
    }
    
    return "Datas não definidas";
  };

  const stats = [
    {
      title: "Viagens Realizadas",
      value: trips.filter(trip => trip.status === 'completed').length.toString(),
      change: "+2 este ano",
      icon: MapPin,
      color: "text-accent"
    },
    {
      title: "Próximas Viagens",
      value: trips.filter(trip => trip.status === 'planned' || trip.status === 'confirmed').length.toString(),
      change: "2 este mês",
      icon: Calendar,
      color: "text-primary"
    },
    {
      title: "Orçamento Total",
      value: "R$ 15.400",
      change: "+12% vs último ano",
      icon: Wallet,
      color: "text-highlight"
    },
    {
      title: "Economia",
      value: "R$ 2.100",
      change: "vs orçamento planejado",
      icon: TrendingUp,
      color: "text-accent"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Bem-vindo de volta! Aqui está o resumo das suas viagens</p>
        </div>
        <Button 
          variant="travel" 
          className="gap-2 text-sm"
          onClick={() => navigate("/nova-viagem")}
        >
          <Plane className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Viagem</span>
          <span className="sm:hidden">Nova</span>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-card transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-4 h-4 md:w-5 md:h-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
        {/* Próximas Viagens */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Próximas Viagens
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Carregando viagens...</p>
              </div>
            ) : trips.length === 0 ? (
              <div className="text-center py-8">
                <Plane className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Nenhuma viagem encontrada</p>
                <Button 
                  onClick={() => navigate("/nova-viagem")}
                  className="bg-gradient-ocean hover:shadow-travel transition-all duration-300"
                >
                  Criar primeira viagem
                </Button>
              </div>
            ) : (
              trips.slice(0, 3).map((trip) => (
                <div 
                  key={trip.id}
                  className="relative group cursor-pointer transition-all duration-300 hover:scale-[1.02] rounded-xl overflow-hidden"
                  onClick={() => navigate(`/viagem/${trip.id}`)}
                >
                  {trip.images && trip.images.length > 0 ? (
                    <div 
                      className="h-32 md:h-40 bg-cover bg-center relative rounded-xl"
                      style={{ backgroundImage: `url(${trip.images[0]})` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent rounded-xl" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex items-center gap-2 text-white mb-1">
                          <MapPin className="w-4 h-4" />
                          <h4 className="font-bold text-lg">{trip.destination}</h4>
                        </div>
                        <p className="text-white/90 text-sm">{trip.description || trip.title}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 text-white/80 text-xs">
                            <Clock className="w-3 h-3" />
                            {formatDateRange(trip.start_date, trip.end_date)}
                          </div>
                          <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                            {getStatusText(trip.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-muted/50 hover:bg-muted transition-smooth">
                      <div className="space-y-1 flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground text-sm md:text-base truncate">{trip.destination}</h4>
                        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                          <Clock className="w-3 h-3 md:w-4 md:h-4" />
                          {formatDateRange(trip.start_date, trip.end_date)}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge 
                          variant={getStatusColor(trip.status)}
                          className="mb-1 text-xs"
                        >
                          {getStatusText(trip.status)}
                        </Badge>
                        <div className="text-xs md:text-sm font-medium text-foreground">{trip.title}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start gap-2 text-sm">
              <MapPin className="w-4 h-4" />
              Adicionar Destino
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 text-sm">
              <Wallet className="w-4 h-4" />
              Registrar Gasto
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 text-sm">
              <Calendar className="w-4 h-4" />
              Criar Roteiro
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}