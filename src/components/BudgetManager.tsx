import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { PlusCircle } from "lucide-react";

interface BudgetManagerProps {
  tripId: string;
  totalBudget?: number;
  budgetCurrency?: string;
  onBudgetUpdate?: () => void;
}

const CURRENCIES = [
  { code: "BRL", symbol: "R$", name: "Real Brasileiro" },
  { code: "USD", symbol: "$", name: "Dólar Americano" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "Libra Esterlina" }
];

export function BudgetManager({ tripId, totalBudget = 0, budgetCurrency = "BRL" }: BudgetManagerProps) {
  const selectedCurrency = CURRENCIES.find(c => c.code === budgetCurrency) || CURRENCIES[0];

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
      {/* Budget Summary */}
      <div className="flex-shrink-0 space-y-4 p-4 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Orçamento da Viagem</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground mb-2">Orçamento Total</div>
              <div className="text-3xl font-bold text-primary">
                {selectedCurrency.symbol} {totalBudget.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground mb-2">Status</div>
              <div className="text-lg font-medium">
                Planejamento de gastos em desenvolvimento
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <PlusCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            Funcionalidade de Gastos
          </h3>
          <p className="text-muted-foreground mb-6">
            O sistema de lançamento e controle de gastos será implementado em breve com uma nova proposta.
          </p>
          <Button disabled variant="outline">
            Em Desenvolvimento
          </Button>
        </div>
      </div>
    </div>
  );
}