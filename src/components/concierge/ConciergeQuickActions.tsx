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
    <div className="space-y-6 max-w-2xl mx-auto px-4 pt-4">
      {/* Hero Section */}
      <div className="text-center py-6">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold mb-2">Como posso ajudar?</h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            Sou seu concierge pessoal. Posso ajudá-lo com recomendações, roteiros e tudo sobre sua viagem.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h3 className="text-base sm:text-lg font-medium text-center">Escolhas Rápidas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card
                key={index}
                className="p-3 sm:p-4 cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] border-primary/20 hover:border-primary/40 aspect-square flex flex-col"
                onClick={() => onQuickAction(action.query)}
              >
                <div className="flex flex-col items-center justify-center text-center space-y-2 h-full">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h4 className="font-medium text-xs sm:text-sm">{action.title}</h4>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 leading-tight">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Additional Suggestions */}
      <div className="space-y-3 mt-6">
        <p className="text-xs sm:text-sm text-muted-foreground text-center">
          Ou pergunte algo específico:
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 rounded-full hover:bg-primary/5 whitespace-nowrap"
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