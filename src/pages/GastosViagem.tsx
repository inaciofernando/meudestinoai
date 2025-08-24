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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ImageUpload";
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'todos' | 'planejado' | 'realizado'>('todos');
  const [showChart, setShowChart] = useState(false);

  // Form states for budget editing
  const [budgetForm, setBudgetForm] = useState({
    total_budget: "",
    budget_currency: "BRL"
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
    receiptImages: [] as string[]
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
    date: getTodayString(),
    receiptImages: [] as string[],
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
    setEditForm({
      category: expense.category,
      subcategory: expense.subcategory || "",
      amount: expense.amount.toString(),
      currency: expense.currency,
      description: expense.description,
      date: formatDateForDisplay(expense.date),
      establishment: expense.establishment || "",
      expense_type: expense.expense_type,
      payment_method_type: expense.payment_method_type || "",
      receiptImages: expense.receipt_image_url ? [expense.receipt_image_url] : []
    });
    setIsEditingExpense(true);
  }, []);

  const handleDeleteExpenseDialog = useCallback((expense: Expense) => {
    setSelectedExpense(expense);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleViewReceipt = useCallback((imageUrl: string) => {
    setReceiptImageUrl(imageUrl);
    setIsViewingReceipt(true);
  }, []);

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

      toast({
        title: "Orçamento atualizado!",
        description: "Suas alterações foram salvas com sucesso.",
      });

      setIsEditingBudget(false);
    } catch (error) {
      console.error("Erro ao atualizar orçamento:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar o orçamento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // AI Receipt Processing - Estados melhorados
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAIProcessingModal, setShowAIProcessingModal] = useState(false);
  const [aiProcessingStep, setAiProcessingStep] = useState('analyzing'); // analyzing, extracting, completing

  const processReceiptWithAI = async (imageUrl: string) => {
    if (!imageUrl) return;

    setShowAIProcessingModal(true);
    setAiProcessingStep('analyzing');
    
    try {
      // Step 1: Analyzing image
      await new Promise(resolve => setTimeout(resolve, 1500));
      setAiProcessingStep('extracting');
      
      // Convert image URL to base64
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.readAsDataURL(blob);
      });

      // Step 2: Extracting data
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAiProcessingStep('completing');

      // Call the analyze-receipt edge function
      const { data: aiResult, error: aiError } = await supabase.functions.invoke('analyze-receipt', {
        body: { imageBase64: base64 }
      });

      if (aiError) {
        console.error('AI analysis error:', aiError);
        setShowAIProcessingModal(false);
        toast({
          title: "⚠️ Processamento Falhou",
          description: "Não foi possível processar o recibo automaticamente. Preencha os campos manualmente.",
          variant: "destructive",
        });
        return;
      }

      if (aiResult?.success && aiResult?.data) {
        const aiData = aiResult.data;
        
        // Step 3: Completing
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Fill the form with AI extracted data
        setNewExpense(prev => ({
          ...prev,
          category: aiData.category || prev.category,
          amount: aiData.amount?.toString() || prev.amount,
          description: aiData.description || prev.description,
          establishment: aiData.location || aiData.establishment || prev.establishment,
          date: aiData.date || prev.date,
          payment_method_type: aiData.payment_method || prev.payment_method_type,
        }));

        setShowAIProcessingModal(false);
        toast({
          title: "✨ Recibo Processado com Sucesso!",
          description: "Os dados foram extraídos automaticamente. Revise e ajuste se necessário.",
        });
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      setShowAIProcessingModal(false);
      toast({
        title: "⚠️ Erro no Processamento",
        description: "Não foi possível processar o recibo automaticamente. Preencha os campos manualmente.",
        variant: "destructive",
      });
    }
  };

  const handleReceiptImagesChange = (images: string[]) => {
    const previousImages = newExpense.receiptImages;
    setNewExpense(prev => ({ ...prev, receiptImages: images }));
    
    // Show upload options modal when image is added
    if (images.length > 0 && images[images.length - 1] !== previousImages[previousImages.length - 1]) {
      setShowUploadModal(true);
    }
  };

  const handleProcessWithAI = () => {
    setShowUploadModal(false);
    if (newExpense.receiptImages.length > 0) {
      processReceiptWithAI(newExpense.receiptImages[0]);
    }
  };

  const handleJustAttach = () => {
    setShowUploadModal(false);
    toast({
      title: "📎 Recibo Anexado",
      description: "Recibo anexado com sucesso. Preencha os campos manualmente.",
    });
  };

  const handleEditReceiptImagesChange = (images: string[]) => {
    setEditForm(prev => ({ ...prev, receiptImages: images }));
  };

  const handleAddExpense = async () => {
    if (!user || !trip) return;

    try {
      const { data, error } = await supabase
        .from('budget_items')
        .insert({
          user_id: user.id,
          trip_id: trip.id,
          title: newExpense.description,
          category: newExpense.category,
          actual_amount: parseFloat(newExpense.amount),
          currency: newExpense.currency,
          expense_type: newExpense.expense_type,
          payment_method_type: newExpense.payment_method_type,
          establishment: newExpense.establishment,
          expense_date: newExpense.date,
          planned_amount: parseFloat(newExpense.amount),
          receipt_image_url: newExpense.receiptImages.length > 0 ? newExpense.receiptImages[0] : null
        });

      if (error) throw error;

      toast({
        title: "Gasto adicionado!",
        description: "Seu gasto foi registrado com sucesso.",
      });

      setIsAddingExpense(false);
      setNewExpense({
        category: "",
        subcategory: "",
        amount: "",
        currency: trip.budget_currency || "BRL",
        description: "",
        establishment: "",
        expense_type: "realizado",
        payment_method_type: "",
        date: getTodayString(),
        receiptImages: [],
        isRecurring: false,
        recurrenceCount: 1,
        recurrencePeriod: "diario"
      });

      // Refresh expenses
      const { data: expenseData } = await supabase
        .from('budget_items')
        .select('*')
        .eq('trip_id', trip.id)
        .eq('user_id', user.id)
        .order('expense_date', { ascending: false });

      if (expenseData) {
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
      console.error('Error adding expense:', error);
      toast({
        title: "Erro ao adicionar gasto",
        description: "Não foi possível adicionar o gasto. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense || !user) return;

    try {
      const { error } = await supabase
        .from('budget_items')
        .update({
          title: editForm.description,
          category: editForm.category,
          actual_amount: parseFloat(editForm.amount),
          currency: editForm.currency,
          expense_type: editForm.expense_type,
          payment_method_type: editForm.payment_method_type,
          establishment: editForm.establishment,
          expense_date: editForm.date,
          planned_amount: parseFloat(editForm.amount),
          receipt_image_url: editForm.receiptImages.length > 0 ? editForm.receiptImages[0] : null
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

      // Refresh expenses
      const { data: expenseData } = await supabase
        .from('budget_items')
        .select('*')
        .eq('trip_id', trip!.id)
        .eq('user_id', user.id)
        .order('expense_date', { ascending: false });

      if (expenseData) {
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
      console.error('Error updating expense:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o gasto. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteExpense = async () => {
    if (!selectedExpense || !user) return;
    
    try {
      const { error } = await supabase
        .from('budget_items')
        .delete()
        .eq('id', selectedExpense.id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setIsDeleteDialogOpen(false);
      setIsViewingExpense(false);
      setSelectedExpense(null);
      
      toast({
        title: "Gasto excluído",
        description: "O gasto foi removido com sucesso.",
      });
      
      // Refresh expenses
      const { data: expenseData } = await supabase
        .from('budget_items')
        .select('*')
        .eq('trip_id', trip!.id)
        .eq('user_id', user.id)
        .order('expense_date', { ascending: false });

      if (expenseData) {
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
      console.error('Erro ao excluir gasto:', error);
      toast({
        title: "Erro ao excluir",
        description: "Erro interno. Tente novamente.",
        variant: "destructive",
      });
    }
  };

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

          {/* Budget Cards with Edit Functionality */}
          <div className="px-4 -mt-4">
            <div className="grid grid-cols-2 gap-4 mb-6">
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
                <p className="text-xl font-bold text-foreground mb-2">
                  {formatCurrency(trip.total_budget || 0, selectedCurrency.symbol)}
                </p>
                <p className="c6-text-secondary text-xs mb-3">
                  Gasto: {formatCurrency(calculations.totalExpenses, selectedCurrency.symbol)}
                </p>
                
                {/* Barra de progresso compacta */}
                <div className="space-y-2">
                  <div className="w-full bg-muted/40 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        calculations.budgetStatus.status === "over-budget" ? "bg-destructive" :
                        calculations.budgetStatus.status === "warning" ? "bg-orange-500" : "bg-primary"
                      }`}
                      style={{ width: `${Math.min(100, calculations.budgetStatus.percentage)}%` }}
                    />
                  </div>
                  <p className="c6-text-secondary text-xs">
                    {calculations.budgetStatus.percentage.toFixed(1)}% utilizado
                  </p>
                </div>
              </div>

              {/* Card Saldo Disponível */}
              <div className="c6-card p-4">
                <p className="c6-text-secondary text-xs uppercase tracking-wide font-medium mb-3">SALDO DISPONÍVEL</p>
                <p className={`text-xl font-bold mb-2 ${
                  calculations.budgetStatus.status === "over-budget" ? "text-destructive" :
                  calculations.budgetStatus.status === "warning" ? "text-orange-600" : "text-green-600"
                }`}>
                  {formatCurrency(Math.max(0, (trip.total_budget || 0) - calculations.totalExpenses), selectedCurrency.symbol)}
                </p>
                <div className="flex items-center justify-between">
                  <Badge 
                    variant="outline"
                    className={`text-xs font-medium px-2 py-1 ${
                      calculations.budgetStatus.status === "over-budget" ? "border-destructive/30 text-destructive bg-destructive/5" :
                      calculations.budgetStatus.status === "warning" ? "border-orange-500/30 text-orange-600 bg-orange-50 dark:bg-orange-900/20" : 
                      "border-green-500/30 text-green-600 bg-green-50 dark:bg-green-900/20"
                    }`}
                  >
                    {calculations.budgetStatus.status === "over-budget" ? "Excedido" :
                     calculations.budgetStatus.status === "warning" ? "Atenção" : "No controle"}
                  </Badge>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    calculations.budgetStatus.status === "over-budget" ? "bg-destructive/10" :
                    calculations.budgetStatus.status === "warning" ? "bg-orange-100 dark:bg-orange-900/30" :
                    "bg-green-100 dark:bg-green-900/30"
                  }`}>
                    {calculations.budgetStatus.status === "over-budget" ? (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    ) : calculations.budgetStatus.status === "warning" ? (
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* Card Gasto Realizado */}
              <div className="c6-card p-4">
                <p className="c6-text-secondary text-xs uppercase tracking-wide font-medium mb-3">GASTO REALIZADO</p>
                <p className="text-xl font-bold text-destructive mb-1">
                  {formatCurrency(calculations.realizedExpenses, selectedCurrency.symbol)}
                </p>
                <p className="c6-text-secondary text-xs">Despesas realizadas</p>
              </div>

              {/* Card Gasto Planejado */}
              <div className="c6-card p-4">
                <p className="c6-text-secondary text-xs uppercase tracking-wide font-medium mb-3">GASTO PLANEJADO</p>
                <p className="text-xl font-bold text-blue-600 mb-1">
                  {formatCurrency(calculations.plannedExpenses, selectedCurrency.symbol)}
                </p>
                <p className="c6-text-secondary text-xs">Despesas planejadas</p>
              </div>
            </div>
          </div>

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

        {/* Add Expense Dialog - Botões sempre visíveis */}
        <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
          <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Novo Gasto
              </DialogTitle>
            </DialogHeader>
            
            {/* Conteúdo com scroll limitado */}
            <div className="max-h-[60vh] overflow-y-auto space-y-6 pr-2">
              {/* Upload Section */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">📸</span>
                  <div>
                    <h3 className="font-semibold">Comprovante</h3>
                    <p className="text-sm text-muted-foreground">Anexe seu recibo ou cupom fiscal</p>
                  </div>
                </div>
                
                <ImageUpload
                  images={newExpense.receiptImages}
                  onImagesChange={handleReceiptImagesChange}
                  maxImages={1}
                />
              </div>

              {/* Formulário */}
              <div className="space-y-4">
                <div>
                  <Label className="font-semibold">Categoria <span className="text-red-500">*</span></Label>
                  <Select 
                    value={newExpense.category} 
                    onValueChange={(value) => setNewExpense({...newExpense, category: value, subcategory: ""})}
                    disabled={showAIProcessingModal}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      {EXPENSE_CATEGORIES.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-3">
                            <category.icon className="w-5 h-5" />
                            <span>{category.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="font-semibold">Descrição <span className="text-red-500">*</span></Label>
                  <Textarea
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                    placeholder="Ex: Almoço no restaurante, táxi para o aeroporto..."
                    rows={3}
                    disabled={showAIProcessingModal}
                    className="resize-none"
                  />
                </div>

                <div>
                  <Label className="font-semibold">Valor <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="number"
                      step="0.01"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                      placeholder="0,00"
                      className="pl-12 h-12 text-lg font-semibold"
                      disabled={showAIProcessingModal}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                      disabled={showAIProcessingModal}
                      className="h-12"
                    />
                  </div>
                  <div>
                    <Label>Tipo <span className="text-red-500">*</span></Label>
                    <Select 
                      value={newExpense.expense_type} 
                      onValueChange={(value) => setNewExpense({...newExpense, expense_type: value})}
                      disabled={showAIProcessingModal}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent className="z-50">
                        {EXPENSE_TYPES.map(type => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Método de Pagamento</Label>
                  <Select 
                    value={newExpense.payment_method_type} 
                    onValueChange={(value) => setNewExpense({...newExpense, payment_method_type: value})}
                    disabled={showAIProcessingModal}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Como foi pago" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      {PAYMENT_METHODS.map(method => (
                        <SelectItem key={method.id} value={method.name}>
                          {method.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Estabelecimento</Label>
                  <Input
                    value={newExpense.establishment}
                    onChange={(e) => setNewExpense({...newExpense, establishment: e.target.value})}
                    placeholder="Nome do restaurante, hotel, loja..."
                    disabled={showAIProcessingModal}
                    className="h-12"
                  />
                </div>
              </div>
            </div>

            {/* Botões sempre visíveis na parte inferior */}
            <div className="flex gap-3 pt-6 border-t">
              <Button 
                onClick={() => setIsAddingExpense(false)}
                variant="outline"
                size="lg"
                disabled={showAIProcessingModal}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleAddExpense}
                disabled={showAIProcessingModal || !newExpense.category || !newExpense.description || !newExpense.amount}
                size="lg"
                className="flex-1"
              >
                {showAIProcessingModal ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processando...
                  </div>
                ) : (
                  "Salvar Gasto"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Upload Options Modal */}
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogContent className="max-w-md w-[90vw]">
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-bold flex items-center justify-center gap-2">
                <span className="text-2xl">🤖</span>
                Processamento Inteligente
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-6 space-y-6">
              <div className="text-center">
                <p className="text-muted-foreground">
                  Como você deseja processar este recibo?
                </p>
              </div>
              
              <div className="space-y-4">
                <Button 
                  onClick={handleProcessWithAI}
                  className="w-full h-16 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      ✨
                    </div>
                    <div className="text-left">
                      <div>Processar com IA</div>
                      <div className="text-sm opacity-80">Preenchimento automático</div>
                    </div>
                  </div>
                </Button>
                
                <Button 
                  onClick={handleJustAttach}
                  variant="outline"
                  className="w-full h-16 border-2 font-semibold text-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      📎
                    </div>
                    <div className="text-left">
                      <div>Apenas Anexar</div>
                      <div className="text-sm text-muted-foreground">Preencher manualmente</div>
                    </div>
                  </div>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* AI Processing Modal */}
        <Dialog open={showAIProcessingModal} onOpenChange={() => {}}>
          <DialogContent className="max-w-md w-[90vw] p-8">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                  🤖
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Processando Recibo</h3>
                <p className="text-muted-foreground">
                  {aiProcessingStep === 'analyzing' && "Analisando imagem com IA..."}
                  {aiProcessingStep === 'extracting' && "Extraindo dados do recibo..."}
                  {aiProcessingStep === 'completing' && "Finalizando preenchimento..."}
                </p>
              </div>
              
              {/* Progress Steps */}
              <div className="flex justify-center space-x-2">
                {['analyzing', 'extracting', 'completing'].map((step, index) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
                      aiProcessingStep === step ? 'bg-blue-500 scale-125' :
                      ['analyzing', 'extracting', 'completing'].indexOf(aiProcessingStep) > index ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                    {index < 2 && <div className="w-8 h-0.5 bg-gray-300 mx-2"></div>}
                  </div>
                ))}
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  IA trabalhando em segundo plano
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Budget Dialog */}
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
                <Button onClick={() => setIsEditingBudget(false)} variant="outline" className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleUpdateBudget} className="flex-1">
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Expense Dialog */}
        <Dialog open={isEditingExpense} onOpenChange={setIsEditingExpense}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Gasto</DialogTitle>
            </DialogHeader>
            {editingExpense && (
              <div className="space-y-4">
                <div>
                  <Label>Categoria *</Label>
                  <Select 
                    value={editForm.category} 
                    onValueChange={(value) => setEditForm({...editForm, category: value})}
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
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={editForm.date}
                      onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                    />
                  </div>
                </div>

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
                          <SelectItem key={method.id} value={method.name}>
                            {method.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Comprovante/Recibo</Label>
                  <ImageUpload
                    images={editForm.receiptImages}
                    onImagesChange={handleEditReceiptImagesChange}
                    maxImages={1}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => setIsEditingExpense(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleUpdateExpense}
                    disabled={!editForm.category || !editForm.description || !editForm.amount}
                    className="flex-1"
                  >
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* View Expense Dialog */}
        <Dialog open={isViewingExpense} onOpenChange={setIsViewingExpense}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Detalhes do Gasto</DialogTitle>
            </DialogHeader>
            {selectedExpense && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor:</span>
                    <span className="font-semibold text-lg">
                      {formatCurrency(Number(selectedExpense.amount) || 0, selectedCurrency.symbol)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data:</span>
                    <span className="font-medium">{formatDateForBrazilian(selectedExpense.date)}</span>
                  </div>

                  {selectedExpense.establishment && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estabelecimento:</span>
                      <span className="font-medium">{selectedExpense.establishment}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo de Gasto:</span>
                    <span className="font-medium">
                      <Badge variant="secondary" className={
                        EXPENSE_TYPES.find(type => type.id === selectedExpense.expense_type)?.color || "bg-gray-100 text-gray-800"
                      }>
                        {EXPENSE_TYPES.find(type => type.id === selectedExpense.expense_type)?.name || 'Realizado'}
                      </Badge>
                    </span>
                  </div>

                  {selectedExpense.payment_method_type && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Método de Pagamento:</span>
                      <span className="font-medium">
                        {PAYMENT_METHODS.find(method => method.id === selectedExpense.payment_method_type)?.name || selectedExpense.payment_method_type}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Categoria:</span>
                    <span className="font-medium">
                      {EXPENSE_CATEGORIES.find(cat => cat.id === selectedExpense.category)?.name || 'Outros'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Descrição:</span>
                    <span className="font-medium">{selectedExpense.description}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      handleEditExpense(selectedExpense);
                      setIsViewingExpense(false);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  
                  <Button 
                    onClick={() => setIsDeleteDialogOpen(true)}
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Excluir Gasto
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3 pt-2">
                <div className="text-sm text-muted-foreground">
                  Tem certeza que deseja excluir este gasto? Esta ação não pode ser desfeita.
                </div>
                
                {selectedExpense && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="font-medium text-sm">{selectedExpense.description}</div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Valor:</span>
                       <span className="font-medium text-destructive">
                         {formatCurrency(Number(selectedExpense.amount) || 0, selectedCurrency.symbol)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Data:</span>
                      <span>{formatDateForBrazilian(selectedExpense.date)}</span>
                    </div>
                    {selectedExpense.establishment && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Local:</span>
                        <span>{selectedExpense.establishment}</span>
                      </div>
                    )}
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteExpense}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Definitivamente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Receipt Viewer Dialog */}
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
