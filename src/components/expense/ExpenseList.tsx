import { memo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/utils";
import { 
  Plane, Hotel, UtensilsCrossed, Car, ShoppingBag, MapPin, 
  Ticket, Briefcase, Clock, Edit2, Trash2, Receipt, Eye,
  ChevronDown, ChevronRight, MoreVertical, TrendingUp, TrendingDown 
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
      <Card className="border-0 shadow-none">
        <CardContent className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Briefcase className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Nenhuma transação registrada</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Suas transações aparecerão aqui quando você começar a registrar seus gastos
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate summary statistics
  const totalTransactions = expensesByDay.reduce((sum, day) => sum + day.expenses.length, 0);
  const totalAmount = expensesByDay.reduce((sum, day) => sum + day.total, 0);
  const realizedAmount = expensesByDay.reduce((sum, day) => 
    sum + day.expenses
      .filter(exp => exp.expense_type === 'realizado')
      .reduce((daySum, exp) => daySum + exp.amount, 0), 0);

  return (
    <div className="space-y-6">
      {/* Modern Summary Header */}
      <Card className="border-0 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Extrato de Gastos</h2>
              <p className="text-sm text-muted-foreground">
                {totalTransactions} transaç{totalTransactions === 1 ? 'ão' : 'ões'} registrada{totalTransactions === 1 ? '' : 's'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(totalAmount, currencySymbol)}
              </div>
              {realizedAmount > 0 && (
                <div className="flex items-center justify-end gap-1 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  {formatCurrency(realizedAmount, currencySymbol)} realizados
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Modern Transaction List */}
      <div className="space-y-3">
        {expensesByDay.map((dayData, index) => {
          const isExpanded = expandedDays.has(dayData.date);
          const isToday = new Date().toISOString().split('T')[0] === dayData.date;
          const isRecent = index <= 2; // First 3 days are "recent"
          
          return (
            <Card key={dayData.date} className={`transition-all duration-200 ${isExpanded ? 'ring-2 ring-primary/20' : ''}`}>
              {/* Bank-style Day Header */}
              <button
                onClick={() => onToggleDay(dayData.date)}
                className={`w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors ${isExpanded ? 'bg-muted/20' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    {index < expensesByDay.length - 1 && (
                      <div className="absolute top-3 left-1.5 w-px h-8 bg-border"></div>
                    )}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">
                        {formatDateForBrazilian(dayData.date)}
                      </h3>
                      {isToday && (
                        <Badge variant="secondary" className="text-xs px-2 py-0">Hoje</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {dayData.expenses.length} {dayData.expenses.length === 1 ? 'transação' : 'transações'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-semibold text-foreground">
                      {formatCurrency(dayData.total, currencySymbol)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {dayData.expenses.some(exp => exp.expense_type === 'realizado') ? (
                        <TrendingDown className="w-3 h-3 text-red-500" />
                      ) : (
                        <Clock className="w-3 h-3 text-yellow-500" />
                      )}
                      <span>
                        {dayData.expenses.filter(exp => exp.expense_type === 'realizado').length > 0 
                          ? 'Gastos efetivados' 
                          : 'Gastos planejados'}
                      </span>
                    </div>
                  </div>
                  
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Bank-style Transaction Details */}
              {isExpanded && (
                <div className="border-t bg-muted/10">
                  <ScrollArea className="max-h-96">
                    <div className="p-1">
                      {dayData.expenses.map((expense, expIndex) => {
                        const category = EXPENSE_CATEGORIES.find(cat => cat.id === expense.category) || 
                                        EXPENSE_CATEGORIES.find(cat => cat.id === "miscellaneous")!;
                        const CategoryIcon = category.icon;
                        const isRealized = expense.expense_type === 'realizado';

                        return (
                          <div
                            key={expense.id}
                            className={`flex items-center gap-4 p-3 mx-2 my-1 rounded-lg transition-colors group hover:bg-background/60 ${
                              expIndex < dayData.expenses.length - 1 ? 'border-b border-border/30' : ''
                            }`}
                          >
                            {/* Category Icon */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isRealized ? category.color : 'bg-muted'
                            }`}>
                              <CategoryIcon className={`w-5 h-5 ${isRealized ? 'text-white' : 'text-muted-foreground'}`} />
                            </div>

                            {/* Transaction Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-foreground truncate text-sm">
                                  {expense.description}
                                </h4>
                                <Badge 
                                  variant={isRealized ? 'default' : 'outline'}
                                  className="text-xs px-2 py-0.5"
                                >
                                  {isRealized ? 'Pago' : 'Planejado'}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{category.name}</span>
                                {expense.establishment && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate">{expense.establishment}</span>
                                  </>
                                )}
                                {expense.receipt_image_url && (
                                  <>
                                    <span>•</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onViewReceipt(expense.receipt_image_url!);
                                      }}
                                      className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors cursor-pointer p-1 rounded hover:bg-muted/50"
                                      title="Visualizar comprovante ampliado"
                                    >
                                      <Eye className="w-3 h-3" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Amount and Actions */}
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className={`text-lg font-semibold ${
                                  isRealized ? 'text-foreground' : 'text-muted-foreground'
                                }`}>
                                  {formatCurrency(expense.amount, currencySymbol)}
                                </div>
                              </div>
                              
                              {/* Action Menu */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => onViewExpense(expense)}
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
});

ExpenseList.displayName = "ExpenseList";