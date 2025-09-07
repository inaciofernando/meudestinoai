import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  MapPin, 
  Calendar, 
  Wallet, 
  Clock,
  Plane,
  CheckCircle,
  Search,
  Plus
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
  const [showTripSelector, setShowTripSelector] = useState(false);
  const [showDestinationSelector, setShowDestinationSelector] = useState(false);
  const [showItinerarySelector, setShowItinerarySelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchTrips = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("trips")
          .select("*")
          .eq("user_id", user.id)
          .order("start_date", { ascending: false, nullsFirst: false });

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
      case 'completed':
        return 'default';
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
      case 'completed':
        return 'Realizada';
      default:
        return 'Rascunho';
    }
  };

  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate && !endDate) {
      return "Datas não definidas";
    }
    
    if (startDate && endDate) {
      // Parse das datas como UTC para evitar problemas de fuso horário
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T00:00:00');
      return `${format(start, "dd")} - ${format(end, "dd MMM", { locale: ptBR })}`;
    }
    
    if (startDate) {
      // Parse da data como UTC para evitar problemas de fuso horário
      const start = new Date(startDate + 'T00:00:00');
      return `A partir de ${format(start, "dd MMM", { locale: ptBR })}`;
    }
    
    return "Datas não definidas";
  };

  // Função para filtrar viagens baseada no termo de busca
  const filterTrips = (tripsList: Trip[]) => {
    if (!searchTerm.trim()) return tripsList;
    
    const term = searchTerm.toLowerCase();
    return tripsList.filter(trip => 
      trip.destination.toLowerCase().includes(term) ||
      trip.title.toLowerCase().includes(term) ||
      (trip.description && trip.description.toLowerCase().includes(term))
    );
  };

  // Calcular estatísticas e filtros dinâmicos
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const completedTrips = trips.filter(trip => trip.status === 'completed');
  const completedThisYear = completedTrips.filter(trip => {
    if (!trip.end_date) return false;
    const tripYear = new Date(trip.end_date).getFullYear();
    return tripYear === currentYear;
  });
  
  const upcomingTrips = trips.filter(trip => 
    trip.status === 'confirmed'
  );
  const upcomingThisMonth = upcomingTrips.filter(trip => {
    if (!trip.start_date) return false;
    const tripDate = new Date(trip.start_date);
    return tripDate.getFullYear() === currentYear && tripDate.getMonth() === currentMonth;
  });
  
  const planningTrips = trips.filter(trip => 
    trip.status === 'planned' || trip.status === 'draft' || !trip.status
  );

  const renderTripsList = (tripsList: Trip[], emptyMessage: string) => {
    if (loading) {
      return (
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Carregando viagens...</p>
        </div>
      );
    }

    if (tripsList.length === 0) {
      return (
        <div className="text-center py-8">
          <Plane className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">{emptyMessage}</p>
          <Button 
            onClick={() => navigate("/nova-viagem")}
            className="bg-gradient-ocean hover:shadow-travel transition-all duration-300"
          >
            Criar viagem
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {tripsList.map((trip) => (
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
        ))}
      </div>
    );
  };

  const stats = [
    {
      title: "Viagens Realizadas",
      value: completedTrips.length.toString(),
      change: completedTrips.length > 0 ? `${completedTrips.length} ${completedTrips.length === 1 ? 'viagem' : 'viagens'}` : "Nenhuma viagem",
      icon: MapPin,
      color: "text-accent"
    },
    {
      title: "Próximas Viagens", 
      value: upcomingTrips.length.toString(),
      change: upcomingTrips.length > 0 ? `${upcomingTrips.length} ${upcomingTrips.length === 1 ? 'planejada' : 'planejadas'}` : "Nenhuma planejada",
      icon: Calendar,
      color: "text-primary"
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
          variant="outline" 
          size="icon"
          className="text-primary border-primary hover:bg-primary hover:text-primary-foreground transition-smooth"
          onClick={() => navigate("/nova-viagem")}
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 md:gap-6">
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

      {/* Seção de Viagens com Abas */}
      <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-primary" />
              Minhas Viagens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="proximas" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="proximas" className="text-xs">
                  Próximas ({upcomingTrips.length})
                </TabsTrigger>
                <TabsTrigger value="planejamento" className="text-xs">
                  Planejamento ({planningTrips.length})
                </TabsTrigger>
                <TabsTrigger value="realizadas" className="text-xs">
                  Realizadas ({completedTrips.length})
                </TabsTrigger>
              </TabsList>

              {/* Campo de busca */}
              <div className="relative mt-4 mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Buscar viagens por destino, título ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>
              
              <TabsContent value="proximas" className="mt-4">
                {renderTripsList(filterTrips(upcomingTrips), "Nenhuma viagem próxima encontrada")}
              </TabsContent>
              
              <TabsContent value="planejamento" className="mt-4">
                {renderTripsList(filterTrips(planningTrips), "Nenhuma viagem em planejamento")}
              </TabsContent>
              
              <TabsContent value="realizadas" className="mt-4">
                {renderTripsList(filterTrips(completedTrips), "Nenhuma viagem realizada ainda")}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 text-sm"
              onClick={() => navigate("/nova-viagem")}
            >
              <MapPin className="w-4 h-4" />
              Adicionar Destino
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 text-sm"
              onClick={() => {
                if (trips.length === 0) {
                  setShowTripSelector(true);
                } else if (trips.length === 1) {
                  navigate(`/viagem/${trips[0].id}/gastos?add=true`);
                } else {
                  setShowTripSelector(true);
                }
              }}
            >
              <Wallet className="w-4 h-4" />
              Registrar Gasto
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 text-sm"
              onClick={() => setShowItinerarySelector(true)}
            >
              <Calendar className="w-4 h-4" />
              Criar Roteiro
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Seleção de Viagem para Gasto */}
      <Dialog open={showTripSelector} onOpenChange={setShowTripSelector}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Selecionar Viagem para o Gasto
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {trips.length === 0 ? (
              <div className="text-center py-8">
                <Plane className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Nenhuma viagem encontrada</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Você precisa criar uma viagem antes de registrar gastos.
                </p>
                <Button 
                  onClick={() => {
                    setShowTripSelector(false);
                    navigate("/nova-viagem");
                  }}
                  className="bg-gradient-ocean hover:shadow-travel transition-all duration-300"
                >
                  Criar Primeira Viagem
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {trips.map((trip) => (
                  <button
                    key={trip.id}
                    onClick={() => {
                      setShowTripSelector(false);
                      navigate(`/viagem/${trip.id}/gastos?add=true`);
                    }}
                    className="w-full p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {trip.destination}
                        </h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {trip.description || trip.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="w-3 h-3" />
                          {formatDateRange(trip.start_date, trip.end_date)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={getStatusColor(trip.status)}
                          className="text-xs"
                        >
                          {getStatusText(trip.status)}
                        </Badge>
                        <CheckCircle className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowTripSelector(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Seleção de Viagem para Destino */}
      <Dialog open={showDestinationSelector} onOpenChange={setShowDestinationSelector}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Selecionar Viagem para Adicionar Destino
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {trips.length === 0 ? (
              <div className="text-center py-8">
                <Plane className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Nenhuma viagem encontrada</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Você precisa criar uma viagem antes de adicionar destinos.
                </p>
                <Button 
                  onClick={() => {
                    setShowDestinationSelector(false);
                    navigate("/nova-viagem");
                  }}
                  className="bg-gradient-ocean hover:shadow-travel transition-all duration-300"
                >
                  Criar Primeira Viagem
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {trips.map((trip) => (
                  <button
                    key={trip.id}
                    onClick={() => {
                      setShowDestinationSelector(false);
                      navigate(`/viagem/${trip.id}/planejamento`);
                    }}
                    className="w-full p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {trip.destination}
                        </h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {trip.description || trip.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="w-3 h-3" />
                          {formatDateRange(trip.start_date, trip.end_date)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={getStatusColor(trip.status)}
                          className="text-xs"
                        >
                          {getStatusText(trip.status)}
                        </Badge>
                        <CheckCircle className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowDestinationSelector(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Seleção de Viagem para Roteiro */}
      <Dialog open={showItinerarySelector} onOpenChange={setShowItinerarySelector}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Selecionar Viagem para Criar Roteiro
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {trips.length === 0 ? (
              <div className="text-center py-8">
                <Plane className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Nenhuma viagem encontrada</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Você precisa criar uma viagem antes de criar roteiros.
                </p>
                <Button 
                  onClick={() => {
                    setShowItinerarySelector(false);
                    navigate("/nova-viagem");
                  }}
                  className="bg-gradient-ocean hover:shadow-travel transition-all duration-300"
                >
                  Criar Primeira Viagem
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {trips.map((trip) => (
                  <button
                    key={trip.id}
                    onClick={() => {
                      setShowItinerarySelector(false);
                      navigate(`/viagem/${trip.id}/roteiro`);
                    }}
                    className="w-full p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {trip.destination}
                        </h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {trip.description || trip.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="w-3 h-3" />
                          {formatDateRange(trip.start_date, trip.end_date)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={getStatusColor(trip.status)}
                          className="text-xs"
                        >
                          {getStatusText(trip.status)}
                        </Badge>
                        <CheckCircle className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowItinerarySelector(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}