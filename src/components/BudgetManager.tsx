import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { BudgetHeader } from "./budget/BudgetHeader";
import { ExpenseList } from "./budget/ExpenseList";

interface BudgetItem {
  id: string;
  title: string;
  category?: string;
  description?: string;
  planned_amount: number;
  actual_amount?: number;
  currency: string;
  is_confirmed: boolean;
  location?: string;
  expense_date?: string;
  payment_method?: string;
  receipt_image_url?: string;
  notes?: string;
}

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

export function BudgetManager({ 
  tripId, 
  totalBudget = 0, 
  budgetCurrency = "BRL", 
  onBudgetUpdate 
}: BudgetManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedCurrency = CURRENCIES.find(c => c.code === budgetCurrency) || CURRENCIES[0];

  useEffect(() => {
    fetchBudgetItems();
  }, [tripId]);

  const fetchBudgetItems = async () => {
    try {
      const { data, error } = await supabase
        .from("budget_items")
        .select("*")
        .eq("trip_id", tripId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBudgetItems(data || []);
    } catch (error) {
      console.error("Erro ao buscar gastos:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar gastos da viagem",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleConfirmed = async (item: BudgetItem) => {
    try {
      const { error } = await supabase
        .from("budget_items")
        .update({ 
          is_confirmed: !item.is_confirmed,
          actual_amount: !item.is_confirmed ? item.planned_amount : null
        })
        .eq("id", item.id);

      if (error) throw error;

      await fetchBudgetItems();
      toast({
        title: "Sucesso",
        description: item.is_confirmed 
          ? "Gasto movido para planejado" 
          : "Gasto confirmado como realizado",
      });
    } catch (error) {
      console.error("Erro ao atualizar gasto:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do gasto",
        variant: "destructive",
      });
    }
  };

  const totalPlanned = budgetItems.reduce((sum, item) => sum + item.planned_amount, 0);
  const totalSpent = budgetItems
    .filter(item => item.is_confirmed && item.actual_amount)
    .reduce((sum, item) => sum + (item.actual_amount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando orçamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <BudgetHeader
        tripId={tripId}
        totalBudget={totalBudget}
        budgetCurrency={budgetCurrency}
        totalPlanned={totalPlanned}
        totalSpent={totalSpent}
        onBudgetUpdate={() => {
          onBudgetUpdate?.();
          fetchBudgetItems();
        }}
      />

      <ExpenseList
        expenses={budgetItems}
        currencySymbol={selectedCurrency.symbol}
        tripId={tripId}
        budgetCurrency={budgetCurrency}
        onExpenseUpdate={fetchBudgetItems}
        onToggleConfirmed={handleToggleConfirmed}
      />
    </div>
  );
}