import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";

interface Expense {
  id: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  expense_type: string;
}

interface ExpenseChartsProps {
  expenses: Expense[];
  showChart: boolean;
  onToggleChart: () => void;
}

const EXPENSE_CATEGORIES = [
  { id: "transport", name: "Transporte", color: "#3b82f6" },
  { id: "accommodation", name: "Hospedagem", color: "#8b5cf6" },
  { id: "food", name: "Alimentação", color: "#10b981" },
  { id: "transport_local", name: "Transporte Local", color: "#f97316" },
  { id: "shopping", name: "Compras", color: "#ec4899" },
  { id: "attractions", name: "Atrações", color: "#6366f1" },
  { id: "entertainment", name: "Entretenimento", color: "#ef4444" },
  { id: "miscellaneous", name: "Diversos", color: "#6b7280" }
];

export const ExpenseCharts = memo(({ expenses, showChart, onToggleChart }: ExpenseChartsProps) => {
  const chartData = useMemo(() => {
    const categoryTotals = expenses.reduce((acc, expense) => {
      const category = EXPENSE_CATEGORIES.find(cat => cat.id === expense.category) || 
                      EXPENSE_CATEGORIES.find(cat => cat.id === "miscellaneous")!;
      
      const key = category.name;
      acc[key] = (acc[key] || 0) + (Number(expense.amount) || 0);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => {
        const category = EXPENSE_CATEGORIES.find(cat => cat.name === name);
        return {
          name,
          value,
          color: category?.color || "#6b7280"
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const timelineData = useMemo(() => {
    const dailyTotals = expenses.reduce((acc, expense) => {
      const date = expense.date.split('T')[0];
      acc[date] = (acc[date] || 0) + (Number(expense.amount) || 0);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(dailyTotals)
      .map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        amount
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7); // Últimos 7 dias
  }, [expenses]);

  if (!showChart || expenses.length === 0) return null;

  return (
    <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
      {/* Pie Chart - Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gastos por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Valor']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <p>Nenhum dado disponível</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Line Chart - Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gastos dos Últimos Dias</CardTitle>
        </CardHeader>
        <CardContent>
          {timelineData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Gastos']} />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <p>Dados insuficientes para gráfico temporal</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Toggle Chart Button */}
      <div className="lg:col-span-2 flex justify-center">
        <Button 
          variant="outline" 
          onClick={onToggleChart}
          className="gap-2"
        >
          <TrendingUp className="w-4 h-4" />
          Ocultar Gráficos
        </Button>
      </div>
    </div>
  );
});

ExpenseCharts.displayName = "ExpenseCharts";