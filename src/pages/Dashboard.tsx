import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Calendar, 
  Wallet, 
  TrendingUp, 
  Clock,
  Plane
} from "lucide-react";

export default function Dashboard() {
  const stats = [
    {
      title: "Viagens Realizadas",
      value: "12",
      change: "+2 este ano",
      icon: MapPin,
      color: "text-accent"
    },
    {
      title: "Próximas Viagens",
      value: "3",
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

  const upcomingTrips = [
    {
      destination: "Paris, França",
      date: "15-22 Março",
      status: "Confirmada",
      budget: "R$ 8.500"
    },
    {
      destination: "Tokyo, Japão",
      date: "10-20 Maio",
      status: "Planejando",
      budget: "R$ 12.000"
    },
    {
      destination: "Bali, Indonésia",
      date: "5-15 Julho",
      status: "Orçamento",
      budget: "R$ 6.800"
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
        <Button variant="travel" className="gap-2 text-sm">
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
            {upcomingTrips.map((trip, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-muted/50 hover:bg-muted transition-smooth"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground text-sm md:text-base truncate">{trip.destination}</h4>
                  <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                    <Clock className="w-3 h-3 md:w-4 md:h-4" />
                    {trip.date}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <Badge 
                    variant={trip.status === 'Confirmada' ? 'default' : 'secondary'}
                    className="mb-1 text-xs"
                  >
                    {trip.status}
                  </Badge>
                  <div className="text-xs md:text-sm font-medium text-foreground">{trip.budget}</div>
                </div>
              </div>
            ))}
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