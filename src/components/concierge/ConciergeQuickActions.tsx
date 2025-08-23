import { memo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, UtensilsCrossed, MapPinPlus, MapPin, Calendar } from "lucide-react";

interface ConciergeQuickActionsProps {
  onQuickAction: (query: string) => void;
}

const ConciergeQuickActions = memo(({ onQuickAction }: ConciergeQuickActionsProps) => {
  const quickActions = [
    {
      icon: UtensilsCrossed,
      title: "Restaurantes",
      description: "Onde comer bem",
      query: "Quais são os melhores restaurantes locais que você recomenda para minha viagem?"
    },
    {
      icon: MapPinPlus,
      title: "Atrações",
      description: "O que visitar",
      query: "Quais são as principais atrações turísticas que devo conhecer no meu destino?"
    },
    {
      icon: MapPin,
      title: "Transporte",
      description: "Como se locomover",
      query: "Qual a melhor forma de me locomover durante minha viagem? Transporte público, uber ou aluguel de carro?"
    },
    {
      icon: Calendar,
      title: "Roteiro",
      description: "Planeje seus dias",
      query: "Pode me sugerir um roteiro detalhado para os dias da minha viagem?"
    }
  ];

  const suggestions = [
    "Melhor época para visitar?",
    "Dicas de segurança",
    "Quanto levar em dinheiro?",
    "Documentos necessários"
  ];

  return (
    <div className="space-y-3 max-w-md mx-auto px-4">
      {/* Hero Section - Muito compacta */}
      <div className="text-center py-2">
        <div className="mb-3">
          <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-base font-semibold mb-1">Como posso ajudar?</h2>
          <p className="text-muted-foreground text-xs max-w-xs mx-auto">
            Seu assistente de viagem para recomendações e planejamento.
          </p>
        </div>
      </div>

      {/* Quick Actions - Cards bem menores */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-center text-muted-foreground">Escolhas Rápidas</h3>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card
                key={index}
                className="p-2 cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] border-primary/20 hover:border-primary/40 h-12 flex items-center"
                onClick={() => onQuickAction(action.query)}
              >
                <div className="flex items-center gap-2 w-full">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3 h-3 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-[10px] truncate">{action.title}</h4>
                    <p className="text-[9px] text-muted-foreground truncate">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Additional Suggestions - Muito compactas */}
      <div className="space-y-1">
        <p className="text-[10px] text-muted-foreground text-center">
          Ou pergunte algo específico:
        </p>
        <div className="flex flex-wrap gap-1 justify-center">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="text-[9px] h-5 px-2 rounded-full hover:bg-primary/5 whitespace-nowrap"
              onClick={() => onQuickAction(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
});

ConciergeQuickActions.displayName = "ConciergeQuickActions";

export { ConciergeQuickActions };