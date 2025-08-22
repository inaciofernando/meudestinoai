import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, TrendingUp, TrendingDown, Target, AlertCircle } from "lucide-react";

interface ExpenseStatsProps {
  totalExpenses: number;
  realizedExpenses: number;
  plannedExpenses: number;
  budget: number;
  budgetStatus: {
    status: "no-budget" | "over-budget" | "warning" | "on-track";
    percentage: number;
  };
  currency: string;
  dailyAverage: number;
  projectedTotal: number;
}

export const ExpenseStats = memo(({ 
  totalExpenses, 
  realizedExpenses, 
  plannedExpenses, 
  budget, 
  budgetStatus, 
  currency,
  dailyAverage,
  projectedTotal
}: ExpenseStatsProps) => {
  const currencySymbol = currency === "BRL" ? "R$" : 
                        currency === "USD" ? "$" : 
                        currency === "EUR" ? "€" : "R$";

  const stats = [
    {
      title: "Total de Gastos",
      value: formatCurrency(totalExpenses, currencySymbol),
      change: `${realizedExpenses > 0 ? `${Math.round((realizedExpenses / totalExpenses) * 100)}% realizados` : 'Nenhum gasto'}`,
      icon: DollarSign,
      color: "text-primary"
    },
    {
      title: "Orçamento",
      value: budget > 0 ? formatCurrency(budget, currencySymbol) : "Não definido",
      change: budget > 0 ? 
        budgetStatus.status === "over-budget" ? `${budgetStatus.percentage.toFixed(0)}% excedido` :
        budgetStatus.status === "warning" ? `${(100 - budgetStatus.percentage).toFixed(0)}% restante` :
        `${budgetStatus.percentage.toFixed(0)}% usado` : "Defina um orçamento",
      icon: budgetStatus.status === "over-budget" ? TrendingUp : 
           budgetStatus.status === "warning" ? AlertCircle : Target,
      color: budgetStatus.status === "over-budget" ? "text-destructive" :
             budgetStatus.status === "warning" ? "text-orange-500" : "text-accent"
    }
  ];

  return (
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
      
      {/* Budget Progress Bar */}
      {budget > 0 && (
        <Card className="col-span-2">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso do Orçamento</span>
                <span>{budgetStatus.percentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    budgetStatus.status === "over-budget" ? "bg-destructive" :
                    budgetStatus.status === "warning" ? "bg-orange-500" : "bg-primary"
                  }`}
                  style={{ width: `${Math.min(budgetStatus.percentage, 100)}%` }}
                />
              </div>
              {budgetStatus.status === "over-budget" && (
                <Badge variant="destructive" className="text-xs">
                  Orçamento excedido em {formatCurrency(totalExpenses - budget, currencySymbol)}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

ExpenseStats.displayName = "ExpenseStats";