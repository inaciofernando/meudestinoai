import { useState } from "react";
import { Edit2, TrendingUp, TrendingDown, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const CURRENCIES = [
  { code: "BRL", symbol: "R$", name: "Real Brasileiro" },
  { code: "USD", symbol: "$", name: "Dólar Americano" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "Libra Esterlina" }
];

interface BudgetHeaderProps {
  tripId: string;
  totalBudget: number;
  budgetCurrency: string;
  totalPlanned: number;
  totalSpent: number;
  onBudgetUpdate: () => void;
}

export function BudgetHeader({
  tripId,
  totalBudget,
  budgetCurrency,
  totalPlanned,
  totalSpent,
  onBudgetUpdate,
}: BudgetHeaderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [editBudgetAmount, setEditBudgetAmount] = useState(totalBudget.toString());
  const [editBudgetCurrency, setEditBudgetCurrency] = useState(budgetCurrency);

  const selectedCurrency = CURRENCIES.find(c => c.code === budgetCurrency) || CURRENCIES[0];
  const remainingBudget = totalBudget - totalSpent;
  const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const plannedPercentage = totalBudget > 0 ? (totalPlanned / totalBudget) * 100 : 0;

  const handleBudgetUpdate = async () => {
    if (!user || !editBudgetAmount) {
      toast({
        title: "Erro",
        description: "Preencha o valor do orçamento",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("trips")
        .update({ 
          total_budget: parseFloat(editBudgetAmount),
          budget_currency: editBudgetCurrency
        })
        .eq("id", tripId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Orçamento atualizado com sucesso",
      });

      setIsBudgetDialogOpen(false);
      onBudgetUpdate();
    } catch (error) {
      console.error("Erro ao atualizar orçamento:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar orçamento",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Budget Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">Orçamento da Viagem</h2>
              <p className="text-muted-foreground">Gerencie seus gastos de forma inteligente</p>
            </div>
            <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="hover:bg-primary/10"
                  onClick={() => {
                    setEditBudgetAmount(totalBudget.toString());
                    setEditBudgetCurrency(budgetCurrency);
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Editar Orçamento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="budget-amount">Orçamento Total *</Label>
                    <Input
                      id="budget-amount"
                      type="number"
                      step="0.01"
                      value={editBudgetAmount}
                      onChange={(e) => setEditBudgetAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="budget-currency">Moeda</Label>
                    <Select value={editBudgetCurrency} onValueChange={setEditBudgetCurrency}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a moeda" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(currency => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.symbol} - {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleBudgetUpdate} className="flex-1">
                      Salvar
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsBudgetDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Budget Amount */}
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-primary mb-2">
              {selectedCurrency.symbol} {totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-muted-foreground">Orçamento total disponível</div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Progresso de gastos</span>
              <span>{spentPercentage.toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out"
                style={{ width: `${Math.min(spentPercentage, 100)}%` }}
              />
              {spentPercentage < 100 && (
                <div 
                  className="h-full bg-primary/30 transition-all duration-500 ease-out" 
                  style={{ width: `${Math.min(plannedPercentage - spentPercentage, 100 - spentPercentage)}%` }}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Planejado</p>
                <p className="text-lg font-semibold">
                  {selectedCurrency.symbol} {totalPlanned.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Gasto</p>
                <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                  {selectedCurrency.symbol} {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${remainingBudget >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                {remainingBudget >= 0 ? (
                  <TrendingDown className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Restante</p>
                <p className={`text-lg font-semibold ${remainingBudget >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {selectedCurrency.symbol} {Math.abs(remainingBudget).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  {remainingBudget < 0 && ' (excedido)'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}