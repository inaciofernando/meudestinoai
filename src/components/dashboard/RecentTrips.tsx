import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, MoreHorizontal, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/utils";

interface Trip {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  status: 'active' | 'upcoming' | 'completed';
  image?: string;
}

interface RecentTripsProps {
  trips: Trip[];
}

export const RecentTrips = ({ trips }: RecentTripsProps) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: Trip['status']) => {
    console.log('getStatusBadge called with status:', status, typeof status);
    
    const variants = {
      active: { variant: "default" as const, label: "Em Andamento", color: "bg-green-500" },
      upcoming: { variant: "secondary" as const, label: "Planejada", color: "bg-blue-500" },
      completed: { variant: "outline" as const, label: "Concluída", color: "bg-gray-500" }
    };
    
    // More defensive programming - check if status exists and is a string
    if (!status || typeof status !== 'string') {
      console.warn('Invalid status received:', status, 'defaulting to upcoming');
      const config = variants.upcoming;
      return (
        <Badge variant={config.variant} className="text-xs">
          <div className={`w-2 h-2 rounded-full ${config.color} mr-1`} />
          {config.label}
        </Badge>
      );
    }
    
    const config = variants[status as keyof typeof variants] || variants.upcoming;
    console.log('config selected:', config);
    
    if (!config) {
      console.error('No config found for status:', status);
      return <span className="text-xs text-muted-foreground">Status desconhecido</span>;
    }
    
    return (
      <Badge variant={config.variant} className="text-xs">
        <div className={`w-2 h-2 rounded-full ${config.color} mr-1`} />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    });
  };

  return (
    <Card className="shadow-card border-0">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Viagens Recentes</CardTitle>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate("/minhas-viagens")}
          className="text-primary hover:text-primary/80"
        >
          Ver todas
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0">
          {trips.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-2">Nenhuma viagem encontrada</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Comece planejando sua primeira aventura!
              </p>
              <Button onClick={() => navigate("/nova-viagem")}>
                Criar Nova Viagem
              </Button>
            </div>
          ) : (
            trips.map((trip, index) => (
              <div 
                key={trip.id}
                className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                  index < trips.length - 1 ? 'border-b' : ''
                }`}
                onClick={() => navigate(`/viagem/${trip.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-foreground truncate">
                        {trip.title}
                      </h3>
                      {getStatusBadge(trip.status)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{trip.destination}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(trip.start_date)} - {formatDate(trip.end_date)}</span>
                      </div>
                    </div>
                    
                    {trip.total_budget > 0 && (
                      <div className="mt-1 text-sm font-medium text-foreground">
                        Orçamento: {formatCurrency(trip.total_budget)}
                      </div>
                    )}
                  </div>

                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="flex-shrink-0 ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/viagem/${trip.id}`);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};