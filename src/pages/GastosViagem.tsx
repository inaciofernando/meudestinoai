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
  
  // Check URL params for auto-opening add expense modal
  const urlParams = new URLSearchParams(window.location.search);
  const shouldAutoOpenAdd = urlParams.get('add') === 'true';
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingExpense, setIsAddingExpense] = useState(shouldAutoOpenAdd);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [isEditingExpense, setIsEditingExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isAnalyzingReceipt, setIsAnalyzingReceipt] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>("");
  const [isViewingReceipt, setIsViewingReceipt] = useState(false);
  const [receiptImageUrl, setReceiptImageUrl] = useState("");
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
    establishment: "",
    expense_type: "realizado",
    payment_method_type: "",
    date: new Date().toISOString().split('T')[0],
    receiptFile: null as File | null
  });

  // Form states for editing expense
  const [editForm, setEditForm] = useState({
    category: "",
    subcategory: "",
    amount: "",
    currency: "BRL",
    description: "",
    date: "",
    establishment: "",
    expense_type: "realizado",
    payment_method_type: "",
    receiptFile: null as File | null
  });

  // Remove URL parameter when modal is closed
  useEffect(() => {
    if (!isAddingExpense && shouldAutoOpenAdd) {
      const url = new URL(window.location.href);
      url.searchParams.delete('add');
      window.history.replaceState({}, '', url.toString());
    }
  }, [isAddingExpense, shouldAutoOpenAdd]);

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
            establishment: item.establishment,
            expense_type: item.expense_type || 'realizado',
            payment_method_type: item.payment_method_type,
            description: item.title,
            date: item.expense_date || item.created_at,
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
        establishment: item.establishment,
        expense_type: item.expense_type || 'realizado',
        payment_method_type: item.payment_method_type,
        description: item.title,
        date: item.expense_date || item.created_at,
        receipt_image_url: item.receipt_image_url,
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
          establishment: newExpense.establishment,
          expense_type: newExpense.expense_type,
          payment_method_type: newExpense.payment_method_type,
          actual_amount: parseFloat(newExpense.amount),
          planned_amount: parseFloat(newExpense.amount),
          currency: newExpense.currency,
          expense_date: newExpense.date,
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
        establishment: "",
        expense_type: "realizado",
        payment_method_type: "",
        date: new Date().toISOString().split('T')[0],
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
                  <Button className="c6-button-primary w-10 h-10 p-0 rounded-full">
                    <Plus className="w-5 h-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Adicionar Gasto</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Upload de Comprovante */}
                    <div>
                      <Label htmlFor="receipt" className="flex items-center gap-2">
                        <Camera className="w-4 h-4" />
                        Comprovante (Opcional)
                      </Label>
                      <div className="mt-2">
                        <div className="flex items-center justify-center w-full">
                          <label htmlFor="receipt" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer bg-muted/10 hover:bg-muted/20 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              {newExpense.receiptFile ? (
                                <>
                                  <Receipt className="w-8 h-8 mb-2 text-green-600" />
                                  <p className="text-sm text-green-600 font-medium">{newExpense.receiptFile.name}</p>
                                  <p className="text-xs text-muted-foreground">Clique para alterar</p>
                                </>
                              ) : (
                                <>
                                  <Camera className="w-8 h-8 mb-2 text-muted-foreground" />
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-semibold">Clique para anexar</span> o comprovante
                                  </p>
                                  <p className="text-xs text-muted-foreground">PNG, JPG até 10MB</p>
                                </>
                              )}
                            </div>
                            <Input
                              id="receipt"
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setNewExpense({...newExpense, receiptFile: file});
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Análise com IA */}
                    {newExpense.receiptFile && (
                      <div className="mt-3">
                        <Button 
                          onClick={async () => {
                            if (!newExpense.receiptFile) return;
                            
                            setIsAnalyzingReceipt(true);
                            setAnalysisStep("Convertendo imagem...");
                            
                            try {
                              // Converter arquivo para base64
                              const reader = new FileReader();
                              reader.onload = async (e) => {
                                const base64 = e.target?.result as string;
                                const imageBase64 = base64.split(',')[1]; // Remove o prefixo data:image/...;base64,
                                
                                setAnalysisStep("Enviando para análise...");
                                
                                // Chamar a edge function
                                const { data, error } = await supabase.functions.invoke('analyze-receipt', {
                                  body: { imageBase64 }
                                });
                                
                                if (error) {
                                  console.error('Erro na análise:', error);
                                  setAnalysisStep("Erro na análise");
                                  setTimeout(() => {
                                    setIsAnalyzingReceipt(false);
                                    setAnalysisStep("");
                                  }, 2000);
                                  return;
                                }
                                
                                if (data.success) {
                                  setAnalysisStep("Preenchendo formulário...");
                                  
                                  // Preencher os campos automaticamente
                                  const extractedData = data.data;
                                  setNewExpense(prev => ({
                                    ...prev,
                                    amount: extractedData.amount?.toString() || prev.amount,
                                    description: extractedData.description || prev.description,
                                    category: extractedData.category || prev.category,
                                    subcategory: extractedData.subcategory || prev.subcategory,
                                    date: extractedData.date || prev.date
                                  }));
                                  
                                  setAnalysisStep("Análise concluída!");
                                  
                                  // Aguardar um pouco antes de fechar
                                  setTimeout(() => {
                                    setIsAnalyzingReceipt(false);
                                    setAnalysisStep("");
                                  }, 2500);
                                } else {
                                  setAnalysisStep("Erro: " + (data.error || "Não foi possível extrair dados"));
                                  setTimeout(() => {
                                    setIsAnalyzingReceipt(false);
                                    setAnalysisStep("");
                                  }, 3000);
                                }
                              };
                              
                              reader.readAsDataURL(newExpense.receiptFile);
                              
                            } catch (error) {
                              console.error('Erro na análise:', error);
                              setAnalysisStep("Erro interno");
                              setTimeout(() => {
                                setIsAnalyzingReceipt(false);
                                setAnalysisStep("");
                              }, 2000);
                            }
                          }}
                          disabled={isAnalyzingReceipt || !newExpense.receiptFile}
                          variant="outline"
                          className={`w-full transition-all duration-300 group ${
                            isAnalyzingReceipt 
                              ? 'bg-gradient-to-r from-purple-100 to-blue-100 border-purple-300 cursor-not-allowed opacity-90' 
                              : 'bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border-purple-200 hover:border-purple-300 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center justify-center py-1 transition-all duration-200 hover:scale-105">
                            <Bot className="w-5 h-5 mr-2 text-purple-600 transition-transform duration-200 group-hover:animate-bounce" />
                            <span className="font-medium text-purple-700">Analisar com IA</span>
                          </div>
                        </Button>
                      </div>
                    )}

                    {/* Modal de Progresso da IA */}
                    <Dialog open={isAnalyzingReceipt} onOpenChange={() => {}}>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Bot className="w-5 h-5 text-purple-600" />
                            {analysisStep.includes("Análise concluída") ? "Análise Concluída!" : "Processando com IA"}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col items-center justify-center py-8 space-y-6">
                          {analysisStep.includes("Análise concluída") ? (
                            // Estado de sucesso
                            <div className="flex flex-col items-center space-y-4">
                              <div className="relative">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                  <svg
                                    className="w-8 h-8 text-green-600 animate-scale-in"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </div>
                              </div>
                              <div className="text-center space-y-2">
                                <h3 className="text-lg font-semibold text-green-700">Sucesso!</h3>
                                <p className="text-sm text-muted-foreground">
                                  Dados extraídos e campos preenchidos automaticamente.
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Verifique as informações antes de salvar.
                                </p>
                              </div>
                            </div>
                          ) : analysisStep.includes("Erro") ? (
                            // Estado de erro
                            <div className="flex flex-col items-center space-y-4">
                              <div className="relative">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                  <svg
                                    className="w-8 h-8 text-red-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </div>
                              </div>
                              <div className="text-center space-y-2">
                                <h3 className="text-lg font-semibold text-red-700">Erro na Análise</h3>
                                <p className="text-sm text-muted-foreground">
                                  {analysisStep}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Tente novamente ou preencha manualmente.
                                </p>
                              </div>
                            </div>
                          ) : (
                            // Estado de processamento
                            <div className="flex flex-col items-center space-y-4">
                              <div className="relative">
                                <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                                <div className="absolute inset-2 border-2 border-purple-100 border-t-purple-400 rounded-full animate-spin animate-reverse" style={{ animationDuration: '1.5s' }} />
                                <Bot className="absolute inset-0 m-auto w-6 h-6 text-purple-600 animate-pulse" />
                              </div>
                              <div className="text-center space-y-2">
                                <h3 className="text-lg font-semibold text-purple-700">Analisando Cupom</h3>
                                <p className="text-sm text-purple-600 animate-pulse">
                                  {analysisStep}
                                </p>
                                <div className="flex justify-center space-x-1">
                                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    <div>
                      <Label>Categoria *</Label>
                      <Select value={newExpense.category} onValueChange={(value) => setNewExpense({...newExpense, category: value, subcategory: ""})}>
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

                    {/* Subcategoria */}
                    {newExpense.category && (
                      <div>
                        <Label>Subcategoria</Label>
                        <Select value={newExpense.subcategory} onValueChange={(value) => setNewExpense({...newExpense, subcategory: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma subcategoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {EXPENSE_CATEGORIES.find(c => c.id === newExpense.category)?.subcategories.map(sub => (
                              <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <Label>Estabelecimento</Label>
                      <Input
                        value={newExpense.establishment}
                        onChange={(e) => setNewExpense({...newExpense, establishment: e.target.value})}
                        placeholder="Ex: Restaurante Villa Rosa, Hotel Copacabana..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Tipo de Gasto *</Label>
                        <Select 
                          value={newExpense.expense_type} 
                          onValueChange={(value) => setNewExpense({...newExpense, expense_type: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {EXPENSE_TYPES.map(type => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Método de Pagamento</Label>
                        <Select 
                          value={newExpense.payment_method_type} 
                          onValueChange={(value) => setNewExpense({...newExpense, payment_method_type: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o método" />
                          </SelectTrigger>
                          <SelectContent>
                            {PAYMENT_METHODS.map(method => (
                              <SelectItem key={method.id} value={method.id}>
                                {method.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
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
                        <Label>Moeda</Label>
                        <Select value={newExpense.currency} onValueChange={(value) => setNewExpense({...newExpense, currency: value})}>
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
                    </div>

                    <div className="grid grid-cols-2 gap-3">
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
                        Adicionar Gasto
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* KPIs essenciais - Layout simplificado */}
          <div className="px-4">
            {/* Grade 2x2 responsiva - sempre 2 colunas mesmo no mobile */}
            <div className="grid grid-cols-2 gap-3">
              {/* Card Orçamento */}
              <div className="c6-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="c6-text-secondary text-xs uppercase tracking-wide font-medium">ORÇAMENTO</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingBudget(true)}
                    className="h-7 w-7 p-0 hover:bg-muted/50 rounded-full shrink-0"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-lg sm:text-2xl font-bold text-foreground mb-2">
                  {formatCurrency(trip.total_budget || 0, selectedCurrency.symbol)}
                </p>
                <p className="c6-text-secondary text-xs mb-3">
                  Gasto: {formatCurrency(getTotalExpenses(), selectedCurrency.symbol)}
                </p>
                
                {/* Barra de progresso compacta */}
                <div className="space-y-2">
                  <div className="w-full bg-muted/40 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        budgetStatus.status === "over-budget" ? "bg-destructive" :
                        budgetStatus.status === "warning" ? "bg-orange-500" : "bg-primary"
                      }`}
                      style={{ width: `${Math.min(100, budgetStatus.percentage)}%` }}
                    />
                  </div>
                  <p className="c6-text-secondary text-xs">
                    {budgetStatus.percentage.toFixed(1)}% utilizado
                  </p>
                </div>
              </div>

              {/* Card Saldo Disponível */}
              <div className="c6-card p-4">
                <p className="c6-text-secondary text-xs uppercase tracking-wide font-medium mb-3">SALDO DISPONÍVEL</p>
                <p className={`text-lg sm:text-2xl font-bold mb-2 ${
                  budgetStatus.status === "over-budget" ? "text-destructive" :
                  budgetStatus.status === "warning" ? "text-orange-600" : "text-green-600"
                }`}>
                  {formatCurrency(Math.max(0, (trip.total_budget || 0) - getTotalExpenses()), selectedCurrency.symbol)}
                </p>
                <div className="flex items-center justify-between">
                  <Badge 
                    variant="outline"
                    className={`text-xs font-medium px-2 py-1 ${
                      budgetStatus.status === "over-budget" ? "border-destructive/30 text-destructive bg-destructive/5" :
                      budgetStatus.status === "warning" ? "border-orange-500/30 text-orange-600 bg-orange-50 dark:bg-orange-900/20" : 
                      "border-green-500/30 text-green-600 bg-green-50 dark:bg-green-900/20"
                    }`}
                  >
                    {budgetStatus.status === "over-budget" ? "Excedido" :
                     budgetStatus.status === "warning" ? "Atenção" : "No controle"}
                  </Badge>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    budgetStatus.status === "over-budget" ? "bg-destructive/10" :
                    budgetStatus.status === "warning" ? "bg-orange-100 dark:bg-orange-900/30" :
                    "bg-green-100 dark:bg-green-900/30"
                  }`}>
                    {budgetStatus.status === "over-budget" ? (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    ) : budgetStatus.status === "warning" ? (
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* Card Média Diária */}
              <div className="c6-card p-4">
                <p className="c6-text-secondary text-xs uppercase tracking-wide font-medium mb-3">MÉDIA DIÁRIA</p>
                <p className="text-lg sm:text-2xl font-bold text-primary mb-1">
                  {formatCurrency(getDailyAverage(), selectedCurrency.symbol)}
                </p>
                <p className="c6-text-secondary text-xs">Por dia de viagem</p>
              </div>

              {/* Card Projeção Total */}
              <div className="c6-card p-4">
                <p className="c6-text-secondary text-xs uppercase tracking-wide font-medium mb-3">PROJEÇÃO TOTAL</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600 mb-1">
                  {formatCurrency(getProjectedTotal(), selectedCurrency.symbol)}
                </p>
                <p className="c6-text-secondary text-xs">Baseado no padrão atual</p>
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
                <div className="space-y-0">
                  {getExpensesByDay().map((dayData, dayIndex) => {
                    const isExpanded = expandedDays.has(dayData.date);
                    const category = dayData.mainCategory;
                    
                    return (
                      <div key={dayData.date}>
                        {/* Separador entre dias */}
                        {dayIndex > 0 && <div className="h-px bg-border/50" />}
                        
                        {/* Header do dia */}
                        <button
                          onClick={() => toggleDayExpansion(dayData.date)}
                          className="w-full flex items-center justify-between py-4 px-0 hover:bg-muted/30 transition-colors"
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
                          <div className="pt-2">
                            {dayData.expenses.map((expense, expenseIndex) => {
                              const expenseCategory = EXPENSE_CATEGORIES.find(cat => cat.id === expense.category);
                              
                              return (
                                <div key={expense.id}>
                                  {/* Separador entre gastos */}
                                  {expenseIndex > 0 && <div className="h-px bg-border/30 mx-0" />}
                                  
                                  <button 
                                    onClick={() => {
                                      setSelectedExpense(expense);
                                      setIsViewingExpense(true);
                                    }}
                                    className="w-full flex items-center justify-between py-3 px-0 hover:bg-muted/20 transition-colors cursor-pointer text-left"
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
                                        </p>
                                      </div>
                                    </div>
                                    <p className="c6-text-value text-sm">
                                      {formatCurrency(expense.amount, selectedCurrency.symbol)}
                                    </p>
                                  </button>
                                </div>
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

                      {selectedExpense.establishment && (
                        <div className="flex justify-between">
                          <span className="c6-text-secondary">Estabelecimento:</span>
                          <span className="c6-text-primary">{selectedExpense.establishment}</span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="c6-text-secondary">Tipo de Gasto:</span>
                        <span className="c6-text-primary">
                          <Badge variant="secondary" className={
                            EXPENSE_TYPES.find(type => type.id === selectedExpense.expense_type)?.color || "bg-gray-100 text-gray-800"
                          }>
                            {EXPENSE_TYPES.find(type => type.id === selectedExpense.expense_type)?.name || 'Realizado'}
                          </Badge>
                        </span>
                      </div>

                      {selectedExpense.payment_method_type && (
                        <div className="flex justify-between">
                          <span className="c6-text-secondary">Método de Pagamento:</span>
                          <span className="c6-text-primary">
                            {PAYMENT_METHODS.find(method => method.id === selectedExpense.payment_method_type)?.name || selectedExpense.payment_method_type}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="c6-text-secondary">Categoria:</span>
                        <span className="c6-text-primary">
                          {EXPENSE_CATEGORIES.find(cat => cat.id === selectedExpense.category)?.name || 'Outros'}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="c6-text-secondary">Descrição:</span>
                        <span className="c6-text-primary">{selectedExpense.description}</span>
                      </div>


                      {selectedExpense.receipt_image_url && (
                        <div>
                          <span className="c6-text-secondary block mb-2">Comprovante:</span>
                          <div 
                            className="bg-muted rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-muted/80 transition-colors"
                            onClick={() => {
                              // Abrir comprovante no modal
                              const url = selectedExpense.receipt_image_url!.startsWith('http') 
                                ? selectedExpense.receipt_image_url!
                                : `https://sqbdqqbvxrmxnmrlqynu.supabase.co/storage/v1/object/public/trip-documents/${selectedExpense.receipt_image_url}`;
                              setReceiptImageUrl(url);
                              setIsViewingReceipt(true);
                            }}
                          >
                            <div className="flex items-center">
                              <Receipt className="w-8 h-8 text-primary mr-3" />
                              <div>
                                <p className="c6-text-primary text-sm font-medium">Comprovante anexado</p>
                                <p className="c6-text-secondary text-xs">Clique para visualizar</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              Ver
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        setEditingExpense(selectedExpense);
                        setEditForm({
                          category: selectedExpense.category,
                          subcategory: "",
                          amount: selectedExpense.amount.toString(),
                          currency: selectedExpense.currency,
                          establishment: selectedExpense.establishment || "",
                          expense_type: selectedExpense.expense_type,
                          payment_method_type: selectedExpense.payment_method_type || "",
                          description: selectedExpense.description,
                          date: selectedExpense.date.split('T')[0],
                          receiptFile: null
                        });
                        setIsViewingExpense(false);
                        setIsEditingExpense(true);
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    
                    <Button 
                      onClick={async () => {
                        if (!selectedExpense || !user) return;
                        
                        // Confirmar exclusão
                        const confirmDelete = window.confirm(
                          `Tem certeza que deseja excluir este gasto?\n\n${selectedExpense.description}\nValor: ${formatCurrency(selectedExpense.amount)}\n\nEsta ação não pode ser desfeita.`
                        );
                        
                        if (!confirmDelete) return;
                        
                        try {
                          // Excluir do banco de dados
                          const { error } = await supabase
                            .from('budget_items')
                            .delete()
                            .eq('id', selectedExpense.id)
                            .eq('user_id', user.id);
                          
                          if (error) {
                            console.error('Erro ao excluir gasto:', error);
                            toast({
                              title: "Erro ao excluir",
                              description: "Não foi possível excluir o gasto. Tente novamente.",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          // Atualizar lista local
                          setExpenses(prev => prev.filter(exp => exp.id !== selectedExpense.id));
                          
                          // Fechar modal
                          setIsViewingExpense(false);
                          setSelectedExpense(null);
                          
                          toast({
                            title: "Gasto excluído",
                            description: "O gasto foi removido com sucesso.",
                          });
                          
                        } catch (error) {
                          console.error('Erro ao excluir gasto:', error);
                          toast({
                            title: "Erro ao excluir",
                            description: "Erro interno. Tente novamente.",
                            variant: "destructive",
                          });
                        }
                      }}
                      variant="destructive"
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </Button>
                    
                    <Button 
                      onClick={() => setIsViewingExpense(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Fechar
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Dialog para editar gasto */}
          <Dialog open={isEditingExpense} onOpenChange={setIsEditingExpense}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Gasto</DialogTitle>
              </DialogHeader>
              {editingExpense && (
                <div className="space-y-4">
                  {/* Upload de Comprovante para Edição */}
                  <div>
                    <Label htmlFor="editReceipt" className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Comprovante
                    </Label>
                    <div className="mt-2">
                      {editingExpense.receipt_image_url && !editForm.receiptFile ? (
                        <div className="space-y-2">
                          <div 
                            className="bg-muted rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-muted/80 transition-colors"
                            onClick={() => {
                              const url = editingExpense.receipt_image_url!.startsWith('http') 
                                ? editingExpense.receipt_image_url!
                                : `https://sqbdqqbvxrmxnmrlqynu.supabase.co/storage/v1/object/public/trip-documents/${editingExpense.receipt_image_url}`;
                              setReceiptImageUrl(url);
                              setIsViewingReceipt(true);
                            }}
                          >
                            <div className="flex items-center">
                              <Receipt className="w-6 h-6 text-primary mr-3" />
                              <div>
                                <p className="c6-text-primary text-sm font-medium">Comprovante atual</p>
                                <p className="c6-text-secondary text-xs">Clique para visualizar</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">Ver</Button>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => document.getElementById('editReceipt')?.click()}
                            className="w-full"
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Alterar Comprovante
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-full">
                          <label htmlFor="editReceipt" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer bg-muted/10 hover:bg-muted/20 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              {editForm.receiptFile ? (
                                <>
                                  <Receipt className="w-8 h-8 mb-2 text-green-600" />
                                  <p className="text-sm text-green-600 font-medium">{editForm.receiptFile.name}</p>
                                  <p className="text-xs text-muted-foreground">Clique para alterar</p>
                                </>
                              ) : (
                                <>
                                  <Camera className="w-8 h-8 mb-2 text-muted-foreground" />
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-semibold">Clique para anexar</span> um comprovante
                                  </p>
                                  <p className="text-xs text-muted-foreground">PNG, JPG até 10MB</p>
                                </>
                              )}
                            </div>
                          </label>
                        </div>
                      )}
                      <Input
                        id="editReceipt"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setEditForm({...editForm, receiptFile: file});
                          }
                        }}
                        className="hidden"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Categoria *</Label>
                    <Select value={editForm.category} onValueChange={(value) => setEditForm({...editForm, category: value, subcategory: ""})}>
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

                  {editForm.category && (
                    <div>
                      <Label>Subcategoria</Label>
                      <Select value={editForm.subcategory} onValueChange={(value) => setEditForm({...editForm, subcategory: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma subcategoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENSE_CATEGORIES.find(c => c.id === editForm.category)?.subcategories.map(sub => (
                            <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label>Estabelecimento</Label>
                    <Input
                      value={editForm.establishment}
                      onChange={(e) => setEditForm({...editForm, establishment: e.target.value})}
                      placeholder="Ex: Restaurante Villa Rosa, Hotel Copacabana..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Tipo de Gasto *</Label>
                      <Select 
                        value={editForm.expense_type} 
                        onValueChange={(value) => setEditForm({...editForm, expense_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENSE_TYPES.map(type => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Método de Pagamento</Label>
                      <Select 
                        value={editForm.payment_method_type} 
                        onValueChange={(value) => setEditForm({...editForm, payment_method_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o método" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map(method => (
                            <SelectItem key={method.id} value={method.id}>
                              {method.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Descrição *</Label>
                    <Textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
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
                          value={editForm.amount}
                          onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                          placeholder="0,00"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Moeda</Label>
                      <Select value={editForm.currency} onValueChange={(value) => setEditForm({...editForm, currency: value})}>
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
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Data</Label>
                      <Input
                        type="date"
                        value={editForm.date}
                        onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        setIsEditingExpense(false);
                        setEditingExpense(null);
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={async () => {
                        if (!user || !trip || !editingExpense) return;

                        try {
                          let receiptUrl = editingExpense.receipt_image_url;

                          // Upload new receipt if provided
                          if (editForm.receiptFile) {
                            const fileExt = editForm.receiptFile.name.split('.').pop();
                            const fileName = `${user.id}/${trip.id}/${Date.now()}.${fileExt}`;
                            
                            const { data: uploadData, error: uploadError } = await supabase.storage
                              .from('trip-documents')
                              .upload(fileName, editForm.receiptFile);

                            if (uploadError) {
                              throw uploadError;
                            }

                            receiptUrl = uploadData.path;
                          }

                          const { error } = await supabase
                            .from('budget_items')
                            .update({
                              title: editForm.description,
                              category: editForm.category,
                              establishment: editForm.establishment,
                              expense_type: editForm.expense_type,
                              payment_method_type: editForm.payment_method_type,
                              actual_amount: parseFloat(editForm.amount),
                              planned_amount: parseFloat(editForm.amount),
                              currency: editForm.currency,
                              expense_date: editForm.date,
                              receipt_image_url: receiptUrl
                            })
                            .eq('id', editingExpense.id)
                            .eq('user_id', user.id);

                          if (error) throw error;

                          toast({
                            title: "Gasto atualizado!",
                            description: "Suas alterações foram salvas com sucesso.",
                          });

                          setIsEditingExpense(false);
                          setEditingExpense(null);
                          fetchExpenses();
                        } catch (error) {
                          console.error('Error updating expense:', error);
                          toast({
                            title: "Erro",
                            description: "Não foi possível atualizar o gasto. Tente novamente.",
                            variant: "destructive"
                          });
                        }
                      }}
                      disabled={!editForm.category || !editForm.description || !editForm.amount}
                      className="flex-1 c6-button-primary"
                    >
                      Salvar Alterações
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Modal de Visualização do Comprovante */}
        <Dialog open={isViewingReceipt} onOpenChange={setIsViewingReceipt}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Visualizar Comprovante
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-4">
              {receiptImageUrl && (
                <div className="w-full max-w-3xl">
                  <img 
                    src={receiptImageUrl} 
                    alt="Comprovante" 
                    className="w-full h-auto rounded-lg shadow-lg border border-border"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                      toast({
                        title: "Erro ao carregar imagem",
                        description: "Não foi possível carregar o comprovante.",
                        variant: "destructive"
                      });
                    }}
                  />
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <Button 
                  onClick={() => setIsViewingReceipt(false)}
                  variant="outline"
                >
                  Fechar
                </Button>
                <Button 
                  onClick={() => {
                    if (receiptImageUrl) {
                      window.open(receiptImageUrl, '_blank');
                    }
                  }}
                  variant="default"
                >
                  Abrir em Nova Aba
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </PWALayout>
    </ProtectedRoute>
  );
}