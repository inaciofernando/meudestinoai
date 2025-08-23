import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Calendar, CreditCard, Plane, TrendingUp, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DashboardStatsProps {
  stats: {
    totalTrips: number;
    activeTrips: number;
    totalSpent: number;
    upcomingTrips: number;
    savedPlaces: number;
    collaborators: number;
  };
}

export const DashboardStats = ({ stats }: DashboardStatsProps) => {
  const statCards = [
    {
      title: "Viagens Ativas",
      value: stats.activeTrips.toString(),
      description: "Em andamento",
      icon: MapPin,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Próximas Viagens",
      value: stats.upcomingTrips.toString(),
      description: "Planejadas",
      icon: Calendar,
      color: "text-highlight",
      bgColor: "bg-highlight/10"
    },
    {
      title: "Total Investido",
      value: formatCurrency(stats.totalSpent),
      description: "Em todas as viagens",
      icon: CreditCard,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    {
      title: "Total de Viagens",
      value: stats.totalTrips.toString(),
      description: "Realizadas",
      icon: Plane,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Lugares Salvos",
      value: stats.savedPlaces.toString(),
      description: "Para explorar",
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      title: "Colaboradores",
      value: stats.collaborators.toString(),
      description: "Nas viagens",
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-all duration-200 border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-1">
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};