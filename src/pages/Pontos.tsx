import { PWALayout } from "@/components/layout/PWALayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Camera, Coffee } from "lucide-react";

export default function Pontos() {
  const pontos = [
    {
      id: 1,
      nome: "Cristo Redentor",
      cidade: "Rio de Janeiro",
      categoria: "Turístico",
      avaliacao: 4.8,
      visitado: true,
    },
    {
      id: 2,
      nome: "Museu de Arte de São Paulo",
      cidade: "São Paulo",
      categoria: "Cultural",
      avaliacao: 4.6,
      visitado: false,
    },
    {
      id: 3,
      nome: "Café Tortoni",
      cidade: "Buenos Aires",
      categoria: "Gastronomia",
      avaliacao: 4.7,
      visitado: true,
    },
  ];

  const getCategoryIcon = (categoria: string) => {
    switch (categoria) {
      case "Turístico":
        return Camera;
      case "Cultural":
        return Star;
      case "Gastronomia":
        return Coffee;
      default:
        return MapPin;
    }
  };

  return (
    <PWALayout>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">Pontos de Interesse</h1>
          <p className="text-muted-foreground">Descubra e organize seus locais favoritos</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pontos</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">Locais salvos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visitados</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-muted-foreground">75% concluído</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.7</div>
              <p className="text-xs text-muted-foreground">Dos locais visitados</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Pontos Recentes</h2>
          <div className="space-y-3">
            {pontos.map((ponto) => {
              const IconComponent = getCategoryIcon(ponto.categoria);
              return (
                <Card key={ponto.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="font-medium">{ponto.nome}</h3>
                          <p className="text-sm text-muted-foreground">{ponto.cidade}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={ponto.visitado ? "default" : "secondary"}>
                          {ponto.visitado ? "Visitado" : "Pendente"}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">{ponto.avaliacao}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </PWALayout>
  );
}