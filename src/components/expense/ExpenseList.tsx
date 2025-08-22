import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { 
  Plane, Hotel, UtensilsCrossed, Car, ShoppingBag, MapPin, 
  Ticket, Briefcase, Clock, Edit2, Trash2, Receipt, Eye 
} from "lucide-react";

interface Expense {
  id: string;
  category: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  establishment?: string;
  expense_type: string;
  receipt_image_url?: string;
}

interface ExpenseListProps {
  expensesByDay: Array<{
    date: string;
    expenses: Expense[];
    total: number;
  }>;
  expandedDays: Set<string>;
  onToggleDay: (date: string) => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => void;
  onViewExpense: (expense: Expense) => void;
  onViewReceipt: (imageUrl: string) => void;
  currencySymbol: string;
}

const EXPENSE_CATEGORIES = [
  { id: "transport", name: "Transporte", icon: Plane, color: "bg-blue-500" },
  { id: "accommodation", name: "Hospedagem", icon: Hotel, color: "bg-purple-500" },
  { id: "food", name: "Alimentação", icon: UtensilsCrossed, color: "bg-green-500" },
  { id: "transport_local", name: "Transporte Local", icon: Car, color: "bg-orange-500" },
  { id: "shopping", name: "Compras", icon: ShoppingBag, color: "bg-pink-500" },
  { id: "attractions", name: "Atrações", icon: MapPin, color: "bg-indigo-500" },
  { id: "entertainment", name: "Entretenimento", icon: Ticket, color: "bg-red-500" },
  { id: "miscellaneous", name: "Diversos", icon: Briefcase, color: "bg-gray-500" }
];

const formatDateForBrazilian = (dateString: string): string => {
  if (!dateString) return '';
  const cleanDate = dateString.split('T')[0];
  const [year, month, day] = cleanDate.split('-');
  return `${day}/${month}/${year}`;
};

export const ExpenseList = memo(({ 
  expensesByDay, 
  expandedDays, 
  onToggleDay, 
  onEditExpense, 
  onDeleteExpense, 
  onViewExpense,
  onViewReceipt,
  currencySymbol 
}: ExpenseListProps) => {
  if (expensesByDay.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Nenhum gasto registrado ainda</p>
          <p className="text-sm text-muted-foreground">
            Clique em "Adicionar Gasto" para começar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {expensesByDay.map((dayData) => {
        const isExpanded = expandedDays.has(dayData.date);
        const mainCategory = EXPENSE_CATEGORIES.find(cat => 
          cat.id === dayData.expenses[0]?.category
        ) || EXPENSE_CATEGORIES[0];
        const MainCategoryIcon = mainCategory.icon;

        return (
          <Card key={dayData.date} className="overflow-hidden">
            {/* Day Header - Clickable */}
            <button
              onClick={() => onToggleDay(dayData.date)}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${mainCategory.color} flex items-center justify-center`}>
                  <MainCategoryIcon className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">
                    {formatDateForBrazilian(dayData.date)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {dayData.expenses.length} {dayData.expenses.length === 1 ? 'gasto' : 'gastos'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-foreground">
                  {formatCurrency(dayData.total, currencySymbol)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isExpanded ? 'Fechar' : 'Expandir'}
                </div>
              </div>
            </button>

            {/* Expenses List - Expandable */}
            {isExpanded && (
              <CardContent className="pt-0 pb-4">
                <div className="space-y-2">
                  {dayData.expenses.map((expense) => {
                    const category = EXPENSE_CATEGORIES.find(cat => cat.id === expense.category) || 
                                    EXPENSE_CATEGORIES.find(cat => cat.id === "miscellaneous")!;
                    const CategoryIcon = category.icon;

                    return (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-8 h-8 rounded-full ${category.color} flex items-center justify-center flex-shrink-0`}>
                            <CategoryIcon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-foreground truncate">
                                {expense.description}
                              </h4>
                              <Badge 
                                variant={expense.expense_type === 'realizado' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {expense.expense_type === 'realizado' ? 'Realizado' : 'Planejado'}
                              </Badge>
                            </div>
                            {expense.establishment && (
                              <p className="text-sm text-muted-foreground truncate">
                                {expense.establishment}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {category.name}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="font-semibold text-foreground">
                              {formatCurrency(expense.amount, currencySymbol)}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {expense.receipt_image_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => onViewReceipt(expense.receipt_image_url!)}
                              >
                                <Receipt className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => onViewExpense(expense)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => onEditExpense(expense)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => onDeleteExpense(expense)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
});

ExpenseList.displayName = "ExpenseList";