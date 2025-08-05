import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { useParams, useNavigate } from "react-router-dom";
import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  Calendar,
  ChevronDown,
  ChevronUp
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
  location?: string;
  receipt_url?: string;
  created_at: string;
}

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

export default function GastosViagem() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isViewingExpense, setIsViewingExpense] = useState(false);

  // Form states for budget editing
  const [budgetForm, setBudgetForm] = useState({
    total_budget: "",
    budget_currency: "BRL"
  });

  // Form states for new expense
  const [newExpense, setNewExpense] = useState({
    category: "",
    subcategory: "",
    amount: "",
    currency: "BRL",
    description: "",
    date: new Date().toISOString().split('T')[0],
    location: "",
    receiptFile: null as File | null
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
        setBudgetForm({
          total_budget: (tripData.total_budget || 0).toString(),
          budget_currency: tripData.budget_currency || "BRL"
        });

        // Set default currency for new expenses based on trip currency
        setNewExpense(prev => ({
          ...prev,
          currency: tripData.budget_currency || "BRL"
        }));
        
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
            description: item.title,
            date: item.expense_date || item.created_at,
            location: item.location,
            receipt_url: item.receipt_image_url,
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

  const selectedCurrency = CURRENCIES.find(c => c.code === (trip?.budget_currency || "BRL")) || CURRENCIES[0];

  const getTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  const getBudgetStatus = () => {
    const totalExpenses = getTotalExpenses();
    const budget = trip?.total_budget || 0;
    
    if (budget === 0) return { status: "no-budget", percentage: 0 };
    
    const percentage = (totalExpenses / budget) * 100;
    
    if (percentage > 100) return { status: "over-budget", percentage };
    if (percentage > 80) return { status: "warning", percentage };
    return { status: "on-track", percentage };
  };

  // Função para organizar gastos por dia
  const getExpensesByDay = () => {
    const expensesByDay = expenses.reduce((acc, expense) => {
      const date = expense.date.split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(expense);
      return acc;
    }, {} as Record<string, Expense[]>);

    // Converter para array e ordenar por data (mais recente primeiro)
    return Object.entries(expensesByDay)
      .map(([date, dayExpenses]) => ({
        date,
        expenses: dayExpenses,
        total: dayExpenses.reduce((sum, expense) => sum + expense.amount, 0),
        mainCategory: getMostFrequentCategory(dayExpenses)
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getMostFrequentCategory = (dayExpenses: Expense[]) => {
    const categoryCount = dayExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostFrequent = Object.entries(categoryCount).reduce((max, [category, count]) => 
      count > max.count ? { category, count } : max, 
      { category: '', count: 0 }
    );

    return EXPENSE_CATEGORIES.find(cat => cat.id === mostFrequent.category);
  };

  // Funções para KPIs
  const getDailyAverage = () => {
    if (!trip?.start_date || expenses.length === 0) return 0;
    
    const startDate = new Date(trip.start_date);
    const endDate = trip.end_date ? new Date(trip.end_date) : new Date();
    const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    return getTotalExpenses() / daysDiff;
  };

  const getProjectedTotal = () => {
    if (!trip?.start_date || !trip?.end_date) return 0;
    
    const startDate = new Date(trip.start_date);
    const endDate = new Date(trip.end_date);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const dailyAverage = getDailyAverage();
    
    return dailyAverage * totalDays;
  };

  const fetchExpenses = async () => {
    if (!user || !trip) return;

    try {
      const { data, error } = await supabase
        .from('budget_items')
        .select('*')
        .eq('trip_id', trip.id)
        .eq('user_id', user.id)
        .order('expense_date', { ascending: false });

      if (error) throw error;

      const formattedExpenses = data.map(item => ({
        id: item.id,
        trip_id: item.trip_id,
        category: item.category || 'miscellaneous',
        amount: item.actual_amount || 0,
        currency: item.currency,
        description: item.title,
        date: item.expense_date || item.created_at,
        location: item.location,
        receipt_url: item.receipt_image_url,
        created_at: item.created_at
      }));

      setExpenses(formattedExpenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const handleAddExpense = async () => {
    if (!user || !trip) return;

    try {
      let receiptUrl = null;

      // Upload receipt if provided
      if (newExpense.receiptFile) {
        const fileExt = newExpense.receiptFile.name.split('.').pop();
        const fileName = `${user.id}/${trip.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('trip-documents')
          .upload(fileName, newExpense.receiptFile);

        if (uploadError) {
          throw uploadError;
        }

        receiptUrl = uploadData.path;
      }

      // Save expense to database
      const { error } = await supabase
        .from('budget_items')
        .insert({
          trip_id: trip.id,
          user_id: user.id,
          title: newExpense.description,
          category: newExpense.category,
          actual_amount: parseFloat(newExpense.amount),
          planned_amount: parseFloat(newExpense.amount),
          currency: newExpense.currency,
          expense_date: newExpense.date,
          location: newExpense.location,
          receipt_image_url: receiptUrl,
          is_confirmed: true
        });

      if (error) throw error;

      toast({
        title: "Gasto adicionado!",
        description: "Seu gasto foi registrado com sucesso.",
      });

      // Reset form and close dialog
      setNewExpense({
        category: "",
        subcategory: "",
        amount: "",
        currency: "BRL",
        description: "",
        date: new Date().toISOString().split('T')[0],
        location: "",
        receiptFile: null
      });
      
      setIsAddingExpense(false);

      // Refresh expenses
      fetchExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o gasto. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateBudget = async () => {
    if (!user || !trip) return;

    try {
      const { error } = await supabase
        .from("trips")
        .update({
          total_budget: parseFloat(budgetForm.total_budget) || 0,
          budget_currency: budgetForm.budget_currency
        })
        .eq("id", trip.id)
        .eq("user_id", user.id);

      if (error) throw error;

      setTrip({
        ...trip,
        total_budget: parseFloat(budgetForm.total_budget) || 0,
        budget_currency: budgetForm.budget_currency
      });

      setIsEditingBudget(false);

      toast({
        title: "Sucesso!",
        description: "Orçamento atualizado com sucesso.",
      });

    } catch (error) {
      console.error("Erro ao atualizar orçamento:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar o orçamento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const toggleDayExpansion = (date: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDays(newExpanded);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <PWALayout>
          <div className="c6-gradient-bg min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="c6-text-secondary">Carregando gastos...</p>
            </div>
          </div>
        </PWALayout>
      </ProtectedRoute>
    );
  }

  if (!trip) {
    return (
      <ProtectedRoute>
        <PWALayout>
          <div className="c6-gradient-bg min-h-screen flex items-center justify-center">
            <div className="text-center">
              <p className="c6-text-secondary mb-4">Viagem não encontrada</p>
              <Button onClick={() => navigate("/viagens")} variant="outline">
                Voltar às Viagens
              </Button>
            </div>
          </div>
        </PWALayout>
      </ProtectedRoute>
    );
  }

  const budgetStatus = getBudgetStatus();

  return (
    <ProtectedRoute>
      <PWALayout>
        <div className="c6-gradient-bg min-h-screen pb-6">
          {/* Header estilo C6 Bank */}
          <div className="c6-card mx-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/viagem/${id}`)}
                  className="h-9 w-9 p-0 hover:bg-muted rounded-lg"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <p className="c6-text-secondary text-xs uppercase tracking-wide">Extrato da viagem</p>
                  <h1 className="text-xl font-semibold text-foreground">{trip.title}</h1>
                  <p className="c6-text-secondary text-sm">{trip.destination}</p>
                </div>
              </div>
              <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
                <DialogTrigger asChild>
                  <Button className="c6-button-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Adicionar Gasto</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Categoria *</Label>
                      <Select value={newExpense.category} onValueChange={(value) => setNewExpense({...newExpense, category: value})}>
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
                        placeholder="Ex: Almoço no restaurante"
                        rows={2}
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
                        onClick={handleAddExpense}
                        disabled={!newExpense.category || !newExpense.description || !newExpense.amount}
                        className="flex-1 c6-button-primary"
                      >
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* KPIs estilo C6 Bank - 2 cards por linha */}
          <div className="px-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Orçamento */}
              <div className="c6-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="c6-text-secondary text-xs uppercase tracking-wide">Orçamento</p>
                    <p className="text-2xl font-semibold text-foreground">
                      {formatCurrency(trip.total_budget || 0, selectedCurrency.symbol)}
                    </p>
                    <p className="c6-text-secondary text-xs mt-1">
                      Gasto: {formatCurrency(getTotalExpenses(), selectedCurrency.symbol)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingBudget(true)}
                    className="h-8 w-8 p-0 hover:bg-muted rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Barra de progresso */}
                <div className="space-y-3">
                  <div className="w-full bg-muted/30 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        budgetStatus.status === "over-budget" ? "bg-destructive" :
                        budgetStatus.status === "warning" ? "bg-orange-500" : "bg-primary"
                      }`}
                      style={{ width: `${Math.min(100, budgetStatus.percentage)}%` }}
                    />
                  </div>
                  <p className="c6-text-secondary text-xs">{budgetStatus.percentage.toFixed(1)}% do orçamento utilizado</p>
                </div>
              </div>

              {/* Saldo disponível */}
              <div className="c6-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="c6-text-secondary text-xs uppercase tracking-wide">Saldo disponível</p>
                    <p className={`text-2xl font-semibold ${
                      budgetStatus.status === "over-budget" ? "text-destructive" :
                      budgetStatus.status === "warning" ? "text-orange-600" : "text-green-600"
                    }`}>
                      {formatCurrency(Math.max(0, (trip.total_budget || 0) - getTotalExpenses()), selectedCurrency.symbol)}
                    </p>
                    <Badge 
                      variant="outline"
                      className={`text-xs mt-2 ${
                        budgetStatus.status === "over-budget" ? "border-destructive text-destructive" :
                        budgetStatus.status === "warning" ? "border-orange-500 text-orange-600" : 
                        "border-green-500 text-green-600"
                      }`}
                    >
                      {budgetStatus.status === "over-budget" ? "Excedido" :
                       budgetStatus.status === "warning" ? "Atenção" : "No controle"}
                    </Badge>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    budgetStatus.status === "over-budget" ? "bg-destructive/10" :
                    budgetStatus.status === "warning" ? "bg-orange-100 dark:bg-orange-900/30" :
                    "bg-green-100 dark:bg-green-900/30"
                  }`}>
                    {budgetStatus.status === "over-budget" ? (
                      <AlertCircle className="w-6 h-6 text-destructive" />
                    ) : budgetStatus.status === "warning" ? (
                      <AlertCircle className="w-6 h-6 text-orange-600" />
                    ) : (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Média diária */}
              <div className="c6-card">
                <div>
                  <p className="c6-text-secondary text-xs uppercase tracking-wide">Média diária</p>
                  <p className="text-2xl font-semibold text-primary">
                    {formatCurrency(getDailyAverage(), selectedCurrency.symbol)}
                  </p>
                  <p className="c6-text-secondary text-xs mt-1">Por dia de viagem</p>
                </div>
              </div>

              {/* Projeção total */}
              <div className="c6-card">
                <div>
                  <p className="c6-text-secondary text-xs uppercase tracking-wide">Projeção total</p>
                  <p className="text-2xl font-semibold text-purple-600">
                    {formatCurrency(getProjectedTotal(), selectedCurrency.symbol)}
                  </p>
                  <p className="c6-text-secondary text-xs mt-1">Baseado no padrão atual</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gastos por dia - Estilo C6 Bank */}
          <div className="px-4 mt-6">
            <div className="c6-card">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-foreground mb-1">Gastos por dia</h2>
                <p className="c6-text-secondary text-sm">Histórico de transações da viagem</p>
              </div>

              {expenses.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="c6-text-secondary">Nenhum gasto registrado</p>
                  <p className="c6-text-secondary text-xs">Comece adicionando seus primeiros gastos</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {getExpensesByDay().map((dayData) => {
                    const isExpanded = expandedDays.has(dayData.date);
                    const category = dayData.mainCategory;
                    
                    return (
                      <div key={dayData.date} className="border border-border rounded-lg">
                        {/* Header do dia */}
                        <button
                          onClick={() => toggleDayExpansion(dayData.date)}
                          className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <div className="text-left">
                              <p className="c6-text-primary font-medium">
                                {format(new Date(dayData.date), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                              <p className="c6-text-secondary text-xs">
                                {dayData.expenses.length} transação{dayData.expenses.length > 1 ? 'ões' : ''}
                                {category && ` • ${category.name}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="c6-text-value">
                              {formatCurrency(dayData.total, selectedCurrency.symbol)}
                            </p>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                        </button>

                        {/* Lista de gastos do dia */}
                        {isExpanded && (
                          <div className="border-t border-border">
                            {dayData.expenses.map((expense) => {
                              const expenseCategory = EXPENSE_CATEGORIES.find(cat => cat.id === expense.category);
                              
                              return (
                                <button 
                                  key={expense.id} 
                                  onClick={() => {
                                    setSelectedExpense(expense);
                                    setIsViewingExpense(true);
                                  }}
                                  className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors cursor-pointer text-left"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                                      {expenseCategory ? (
                                        <expenseCategory.icon className="w-4 h-4 text-muted-foreground" />
                                      ) : (
                                        <Receipt className="w-4 h-4 text-muted-foreground" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="c6-text-primary text-sm font-medium">
                                        {expense.description}
                                      </p>
                                      <p className="c6-text-secondary text-xs">
                                        {expenseCategory?.name || 'Outros'}
                                        {expense.location && ` • ${expense.location}`}
                                      </p>
                                    </div>
                                  </div>
                                  <p className="c6-text-value text-sm">
                                    {formatCurrency(expense.amount, selectedCurrency.symbol)}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Dialog para editar orçamento */}
          <Dialog open={isEditingBudget} onOpenChange={setIsEditingBudget}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Orçamento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Orçamento Total</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={budgetForm.total_budget}
                    onChange={(e) => setBudgetForm({...budgetForm, total_budget: e.target.value})}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <Label>Moeda</Label>
                  <Select value={budgetForm.budget_currency} onValueChange={(value) => setBudgetForm({...budgetForm, budget_currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(currency => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditingBudget(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button onClick={handleUpdateBudget} className="flex-1">
                    Salvar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog para visualizar detalhes do gasto */}
          <Dialog open={isViewingExpense} onOpenChange={setIsViewingExpense}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Detalhes do Gasto</DialogTitle>
              </DialogHeader>
              {selectedExpense && (
                <div className="space-y-4">
                  <div className="c6-card">
                    <div className="flex items-center gap-3 mb-4">
                      {(() => {
                        const category = EXPENSE_CATEGORIES.find(cat => cat.id === selectedExpense.category);
                        return category ? (
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <category.icon className="w-6 h-6 text-primary" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                            <Receipt className="w-6 h-6 text-muted-foreground" />
                          </div>
                        );
                      })()}
                      <div>
                        <h3 className="font-semibold text-foreground">{selectedExpense.description}</h3>
                        <p className="c6-text-secondary text-sm">
                          {EXPENSE_CATEGORIES.find(cat => cat.id === selectedExpense.category)?.name || 'Outros'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="c6-text-secondary">Valor:</span>
                        <span className="font-semibold text-primary text-lg">
                          {formatCurrency(selectedExpense.amount, selectedCurrency.symbol)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="c6-text-secondary">Data:</span>
                        <span className="c6-text-primary">
                          {format(new Date(selectedExpense.date), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>

                      {selectedExpense.location && (
                        <div className="flex justify-between">
                          <span className="c6-text-secondary">Local:</span>
                          <span className="c6-text-primary">{selectedExpense.location}</span>
                        </div>
                      )}

                      {selectedExpense.receipt_url && (
                        <div>
                          <span className="c6-text-secondary block mb-2">Comprovante:</span>
                          <div className="bg-muted rounded-lg p-3 flex items-center justify-center">
                            <Receipt className="w-8 h-8 text-muted-foreground" />
                            <span className="ml-2 c6-text-secondary text-sm">Comprovante anexado</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button 
                    onClick={() => setIsViewingExpense(false)}
                    className="w-full c6-button-primary"
                  >
                    Fechar
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </PWALayout>
    </ProtectedRoute>
  );
}