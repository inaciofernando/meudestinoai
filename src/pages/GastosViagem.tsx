import { useState, useEffect, useMemo, useCallback } from "react";
import { formatCurrency } from "@/lib/utils";
import { useParams, useNavigate } from "react-router-dom";
import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExpenseStats } from "@/components/expense/ExpenseStats";
import { ExpenseCharts } from "@/components/expense/ExpenseCharts";
import { ExpenseList } from "@/components/expense/ExpenseList";
import { ExpenseFilters } from "@/components/expense/ExpenseFilters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plane,
  Hotel,
  UtensilsCrossed,
  Car,
  ShoppingBag,
  MapPin,
  Ticket,
  Camera,
  Briefcase,
  Receipt,
  Target,
  AlertCircle,
  CheckCircle,
  Edit2,
  Trash2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Bot,
  MoreVertical
} from "lucide-react";

interface Trip {
  id: string;
  title: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  total_budget?: number;
  budget_currency?: string;
}

interface Expense {
  id: string;
  trip_id: string;
  category: string;
  subcategory?: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  establishment?: string;
  expense_type: string;
  payment_method_type?: string;
  receipt_image_url?: string;
  created_at: string;
}

interface UserPaymentMethod {
  id: string;
  name: string;
  type: string;
  currency: string;
  color: string;
  is_active: boolean;
  user_id: string;
  trip_id: string | null;
  created_at: string;
  updated_at: string;
}

// Utility function to handle dates correctly
const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return '';
  // Se já está no formato YYYY-MM-DD, retorna direto
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString;
  }
  // Se tem timestamp, pega só a parte da data
  return dateString.split('T')[0];
};

const formatDateForBrazilian = (dateString: string): string => {
  if (!dateString) return '';
  const cleanDate = formatDateForDisplay(dateString);
  const [year, month, day] = cleanDate.split('-');
  return `${day}/${month}/${year}`;
};

const getTodayString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const EXPENSE_CATEGORIES = [
  { id: "transport", name: "Transporte", icon: Plane, color: "bg-blue-500", subcategories: ["Voo", "Táxi", "Uber", "Ônibus", "Trem", "Aluguel de Carro"] },
  { id: "accommodation", name: "Hospedagem", icon: Hotel, color: "bg-purple-500", subcategories: ["Hotel", "Pousada", "Airbnb", "Hostel", "Resort"] },
  { id: "food", name: "Alimentação", icon: UtensilsCrossed, color: "bg-green-500", subcategories: ["Restaurante", "Fast Food", "Supermercado", "Café", "Bar"] },
  { id: "transport_local", name: "Transporte Local", icon: Car, color: "bg-orange-500", subcategories: ["Combustível", "Pedágio", "Estacionamento", "Transporte Público"] },
  { id: "shopping", name: "Compras", icon: ShoppingBag, color: "bg-pink-500", subcategories: ["Lembranças", "Roupas", "Eletrônicos", "Artesanato"] },
  { id: "attractions", name: "Atrações", icon: MapPin, color: "bg-indigo-500", subcategories: ["Museus", "Parques", "Tours", "Shows", "Esportes"] },
  { id: "entertainment", name: "Entretenimento", icon: Ticket, color: "bg-red-500", subcategories: ["Cinema", "Teatro", "Balada", "Eventos", "Jogos"] },
  { id: "miscellaneous", name: "Diversos", icon: Briefcase, color: "bg-gray-500", subcategories: ["Medicamentos", "Comunicação", "Seguro", "Emergência"] }
];

const CURRENCIES = [
  { code: "BRL", symbol: "R$", name: "Real Brasileiro" },
  { code: "USD", symbol: "$", name: "Dólar Americano" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "Libra Esterlina" }
];

const EXPENSE_TYPES = [
  { id: "planejado", name: "Planejado", color: "bg-blue-100 text-blue-800" },
  { id: "realizado", name: "Realizado", color: "bg-green-100 text-green-800" }
];

const PAYMENT_METHODS = [
  { id: "dinheiro", name: "Dinheiro" },
  { id: "cartao_credito", name: "Cartão de Crédito" },
  { id: "cartao_debito", name: "Cartão de Débito" },
  { id: "pix", name: "PIX" },
  { id: "transferencia", name: "Transferência" },
  { id: "outros", name: "Outros" }
];

export default function GastosViagem() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isEditingExpense, setIsEditingExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isViewingExpense, setIsViewingExpense] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'todos' | 'planejado' | 'realizado'>('todos');
  const [showChart, setShowChart] = useState(false);

  // Form states for new expense
  const [newExpense, setNewExpense] = useState({
    category: "",
    subcategory: "",
    amount: "",
    currency: "BRL",
    description: "",
    establishment: "",
    expense_type: "realizado",
    payment_method_type: "",
    date: getTodayString(),
    receiptFile: null as File | null,
    isRecurring: false,
    recurrenceCount: 1,
    recurrencePeriod: "diario" as "diario" | "semanal" | "mensal"
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !id) return;

      try {
        // Fetch trip details
        const { data: tripData, error: tripError } = await supabase
          .from("trips")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (tripError) {
          console.error("Erro ao buscar viagem:", tripError);
          navigate("/viagens");
          return;
        }

        setTrip(tripData);
        
        // Fetch expenses for this trip
        const { data: expenseData, error: expenseError } = await supabase
          .from('budget_items')
          .select('*')
          .eq('trip_id', tripData.id)
          .eq('user_id', user.id)
          .order('expense_date', { ascending: false });

        if (!expenseError && expenseData) {
          const formattedExpenses = expenseData.map(item => ({
            id: item.id,
            trip_id: item.trip_id,
            category: item.category || 'miscellaneous',
            amount: item.actual_amount || 0,
            currency: item.currency,
            establishment: item.establishment,
            expense_type: item.expense_type || 'realizado',
            payment_method_type: item.payment_method_type,
            description: item.title,
            date: formatDateForDisplay(item.expense_date || item.created_at),
            receipt_image_url: item.receipt_image_url,
            created_at: item.created_at
          }));

          setExpenses(formattedExpenses);
        }

      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        navigate("/viagens");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, id, navigate]);

  const selectedCurrency = useMemo(() => 
    CURRENCIES.find(c => c.code === (trip?.budget_currency || "BRL")) || CURRENCIES[0],
    [trip?.budget_currency]
  );

  // Memoized calculations for better performance
  const calculations = useMemo(() => {
    const totalExpenses = expenses.reduce((total, expense) => total + (Number(expense.amount) || 0), 0);
    const realizedExpenses = expenses
      .filter(expense => expense.expense_type === 'realizado')
      .reduce((total, expense) => total + (Number(expense.amount) || 0), 0);
    const plannedExpenses = expenses
      .filter(expense => expense.expense_type === 'planejado')
      .reduce((total, expense) => total + (Number(expense.amount) || 0), 0);

    const budget = trip?.total_budget || 0;
    let budgetStatus: { status: "no-budget" | "over-budget" | "warning" | "on-track", percentage: number } = { status: "no-budget", percentage: 0 };
    
    if (budget > 0) {
      const percentage = (totalExpenses / budget) * 100;
      if (percentage > 100) budgetStatus = { status: "over-budget", percentage };
      else if (percentage > 80) budgetStatus = { status: "warning", percentage };
      else budgetStatus = { status: "on-track", percentage };
    }

    // Daily average calculation
    let dailyAverage = 0;
    if (trip?.start_date && expenses.length > 0) {
      const startDate = new Date(trip.start_date);
      const endDate = trip.end_date ? new Date(trip.end_date) : new Date();
      const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      dailyAverage = totalExpenses / daysDiff;
    }

    // Projected total
    let projectedTotal = 0;
    if (trip?.start_date && trip?.end_date) {
      const startDate = new Date(trip.start_date);
      const endDate = new Date(trip.end_date);
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      projectedTotal = dailyAverage * totalDays;
    }

    return {
      totalExpenses,
      realizedExpenses,
      plannedExpenses,
      budgetStatus,
      dailyAverage,
      projectedTotal
    };
  }, [expenses, trip]);

  // Filtered expenses with memoization
  const filteredExpenses = useMemo(() => {
    if (activeFilter === 'todos') return expenses;
    return expenses.filter(expense => expense.expense_type === activeFilter);
  }, [expenses, activeFilter]);

  // Expenses grouped by day with memoization
  const expensesByDay = useMemo(() => {
    const expensesByDay = filteredExpenses.reduce((acc, expense) => {
      const date = expense.date.split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(expense);
      return acc;
    }, {} as Record<string, Expense[]>);

    return Object.entries(expensesByDay)
      .map(([date, dayExpenses]) => ({
        date,
        expenses: dayExpenses,
        total: dayExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0)
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredExpenses]);

  // Callbacks for better performance
  const handleFilterChange = useCallback((filter: 'todos' | 'planejado' | 'realizado') => {
    setActiveFilter(filter);
  }, []);

  const handleToggleDay = useCallback((date: string) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  }, []);

  const handleViewExpense = useCallback((expense: Expense) => {
    setSelectedExpense(expense);
    setIsViewingExpense(true);
  }, []);

  const handleEditExpense = useCallback((expense: Expense) => {
    setEditingExpense(expense);
    setIsEditingExpense(true);
  }, []);

  const handleDeleteExpenseDialog = useCallback((expense: Expense) => {
    setSelectedExpense(expense);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleViewReceipt = useCallback((imageUrl: string) => {
    // Handle receipt viewing
  }, []);

  if (loading) {
    return (
      <ProtectedRoute>
        <PWALayout showHeader={true}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </PWALayout>
      </ProtectedRoute>
    );
  }

  if (!trip) {
    return (
      <ProtectedRoute>
        <PWALayout showHeader={true}>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Viagem não encontrada</p>
          </div>
        </PWALayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PWALayout showHeader={true}>
        <div className="pb-20">
          {/* Header */}
          <div className="px-4 py-6 bg-gradient-travel text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate("/viagens")}
                  className="text-white hover:bg-white/20 p-2 h-auto"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-xl font-bold">{trip.title}</h1>
                  <p className="text-white/80 text-sm">{trip.destination}</p>
                </div>
              </div>
              <Button 
                className="w-10 h-10 p-0 rounded-full bg-white/20 hover:bg-white/30 transition-all" 
                onClick={() => setIsAddingExpense(true)}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Financial Summary Cards */}
          <ExpenseStats
            totalExpenses={calculations.totalExpenses}
            realizedExpenses={calculations.realizedExpenses}
            plannedExpenses={calculations.plannedExpenses}
            budget={trip.total_budget || 0}
            budgetStatus={calculations.budgetStatus}
            currency={selectedCurrency.code}
            dailyAverage={calculations.dailyAverage}
            projectedTotal={calculations.projectedTotal}
          />

          {/* Filters */}
          <ExpenseFilters
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            totalCount={expenses.length}
            plannedCount={expenses.filter(e => e.expense_type === 'planejado').length}
            realizedCount={expenses.filter(e => e.expense_type === 'realizado').length}
            showChart={showChart}
            onToggleChart={() => setShowChart(!showChart)}
          />

          {/* Charts */}
          <ExpenseCharts
            expenses={filteredExpenses}
            showChart={showChart}
            onToggleChart={() => setShowChart(!showChart)}
          />

          {/* Modern Expense List */}
          <ExpenseList
            expensesByDay={expensesByDay}
            expandedDays={expandedDays}
            onToggleDay={handleToggleDay}
            onEditExpense={handleEditExpense}
            onDeleteExpense={handleDeleteExpenseDialog}
            onViewExpense={handleViewExpense}
            onViewReceipt={handleViewReceipt}
            currencySymbol={selectedCurrency.symbol}
          />
        </div>

        {/* Add Expense Dialog */}
        <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Gasto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Categoria *</Label>
                <Select 
                  value={newExpense.category} 
                  onValueChange={(value) => setNewExpense({...newExpense, category: value, subcategory: ""})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <category.icon className="w-4 h-4" />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Descrição *</Label>
                <Textarea
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  placeholder="Ex: Almoço no restaurante, táxi para o hotel..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Valor *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                      placeholder="0,00"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => setIsAddingExpense(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={() => {
                    // Handle add expense
                    setIsAddingExpense(false);
                  }}
                  disabled={!newExpense.category || !newExpense.description || !newExpense.amount}
                  className="flex-1"
                >
                  Adicionar Gasto
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </PWALayout>
    </ProtectedRoute>
  );
}
