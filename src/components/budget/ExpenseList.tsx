import { useState } from "react";
import { Plus, Search, Filter, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ExpenseCard } from "./ExpenseCard";
import { ExpenseForm } from "./ExpenseForm";

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

interface ExpenseListProps {
  expenses: BudgetItem[];
  currencySymbol: string;
  tripId: string;
  budgetCurrency: string;
  onExpenseUpdate: () => void;
  onToggleConfirmed: (item: BudgetItem) => void;
}

const CATEGORIES = [
  "Todos",
  "Transporte",
  "Hospedagem", 
  "Alimentação",
  "Atividades",
  "Compras",
  "Emergência",
  "Outros"
];

const STATUS_FILTERS = [
  { value: "all", label: "Todos" },
  { value: "planned", label: "Planejados" },
  { value: "confirmed", label: "Realizados" }
];

export function ExpenseList({ 
  expenses, 
  currencySymbol, 
  tripId, 
  budgetCurrency, 
  onExpenseUpdate, 
  onToggleConfirmed 
}: ExpenseListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("all");

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "Todos" || expense.category === categoryFilter;
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "planned" && !expense.is_confirmed) ||
                         (statusFilter === "confirmed" && expense.is_confirmed);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleEdit = (item: BudgetItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold mb-1">Gastos da Viagem</h3>
          <p className="text-sm text-muted-foreground">
            {filteredExpenses.length} {filteredExpenses.length === 1 ? 'item' : 'itens'} encontrado{filteredExpenses.length === 1 ? '' : 's'}
          </p>
        </div>
        <Button 
          onClick={handleAddNew}
          className="bg-primary hover:bg-primary/90 shadow-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Gasto
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar gastos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Expense List */}
      <div className="space-y-4">
        {filteredExpenses.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <DollarSign className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {expenses.length === 0 ? "Nenhum gasto ainda" : "Nenhum resultado encontrado"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {expenses.length === 0 
                  ? "Adicione seus primeiros gastos para começar a controlar seu orçamento de viagem."
                  : "Tente ajustar os filtros para encontrar o que você procura."
                }
              </p>
              {expenses.length === 0 && (
                <Button onClick={handleAddNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Gasto
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredExpenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                item={expense}
                currencySymbol={currencySymbol}
                onEdit={handleEdit}
                onToggleConfirmed={onToggleConfirmed}
              />
            ))}
          </div>
        )}
      </div>

      {/* Expense Form */}
      <ExpenseForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        tripId={tripId}
        budgetCurrency={budgetCurrency}
        editingItem={editingItem}
        onExpenseUpdate={onExpenseUpdate}
      />
    </div>
  );
}