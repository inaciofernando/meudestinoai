import { PWALayout } from "@/components/layout/PWALayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Calendar, 
  Clock,
  Plus,
  Filter
} from "lucide-react";

export default function MinhasViagens() {
  const viagens = [
    {
      id: 1,
      destino: "Paris, França",
      data: "15-22 Março 2024",
      status: "Confirmada",
      orcamento: "R$ 8.500",
      imagem: "🗼",
      duracao: "7 dias"
    },
    {
      id: 2,
      destino: "Tokyo, Japão",
      data: "10-20 Maio 2024", 
      status: "Planejando",
      orcamento: "R$ 12.000",
      imagem: "🗾",
      duracao: "10 dias"
    },
    {
      id: 3,
      destino: "Bali, Indonésia",
      data: "5-15 Julho 2024",
      status: "Orçamento",
      orcamento: "R$ 6.800",
      imagem: "🏝️",
      duracao: "10 dias"
    },
    {
      id: 4,
      destino: "Roma, Itália",
      data: "20-27 Set 2023",
      status: "Concluída",
      orcamento: "R$ 7.200",
      imagem: "🏛️",
      duracao: "7 dias"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmada": return "bg-accent text-accent-foreground";
      case "Planejando": return "bg-primary text-primary-foreground";
      case "Orçamento": return "bg-highlight text-highlight-foreground";
      case "Concluída": return "bg-muted text-muted-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <PWALayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Minhas Viagens</h1>
            <p className="text-muted-foreground text-sm">Gerencie todas as suas aventuras</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
            <Button variant="travel" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Nova
            </Button>
          </div>
        </div>

        {/* Lista de Viagens */}
        <div className="space-y-3">
          {viagens.map((viagem) => (
            <Card key={viagem.id} className="hover:shadow-card transition-smooth">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3 flex-1">
                    <div className="text-2xl">{viagem.imagem}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">
                          {viagem.destino}
                        </h3>
                        <Badge 
                          className={`text-xs ${getStatusColor(viagem.status)}`}
                        >
                          {viagem.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {viagem.data}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {viagem.duracao}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-semibold text-foreground">
                      {viagem.orcamento}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PWALayout>
  );
}