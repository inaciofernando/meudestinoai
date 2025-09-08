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
import { ExpenseDetailModal } from "@/components/expense/ExpenseDetailModal";
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
  Tag,
  Folder,
  FileText,
  Clock,
  Info,
  CreditCard,
  X,
  Save,
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
  const [activeFilter, setActiveFilter] = useState<'todos' | 'planejado' | 'realizado'>('realizado');
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
    console.log("Tentando abrir recibo:", imageUrl);
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
          {/* Professional Header with Balance Focus */}
          <div className="bg-background border-b">
            <div className="px-4 py-6">
              <div className="flex items-center justify-between mb-6">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate("/viagens")}
                  className="p-2 h-auto"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                
                <div className="text-center">
                  <div className="bg-primary/10 text-primary px-4 py-2 rounded-full border border-primary/20 mb-2">
                    <span className="text-sm font-medium">Gastos de Viagem</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{trip.destination}</p>
                </div>

                <Button 
                  onClick={() => setIsAddingExpense(true)}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 h-9 w-9 p-0 rounded-full"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Current Balance - Hero Section */}
              <div className="text-center space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">Saldo Atual</p>
                  <p className={`text-4xl font-bold ${
                    (trip.total_budget || 0) - calculations.totalExpenses > 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {formatCurrency(Math.max(0, (trip.total_budget || 0) - calculations.totalExpenses), selectedCurrency.symbol)}
                  </p>
                </div>
                
                {/* Monthly Summary */}
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="text-center cursor-pointer" onClick={() => setIsEditingBudget(true)}>
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-green-600 font-semibold">
                        {formatCurrency(trip.total_budget || 0, selectedCurrency.symbol)}
                      </p>
                      <Edit2 className="w-3 h-3 text-green-600/70 hover:text-green-600" />
                    </div>
                    <p className="text-muted-foreground text-xs">Orçamento (clique para editar)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-red-600 font-semibold">
                      -{formatCurrency(calculations.realizedExpenses, selectedCurrency.symbol)}
                    </p>
                    <p className="text-muted-foreground text-xs">Gastos</p>
                  </div>
                </div>

                {/* Progress Bar */}
                {trip.total_budget && trip.total_budget > 0 && (
                  <div className="max-w-xs mx-auto">
                    <div className="w-full bg-muted/40 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          calculations.budgetStatus.status === "over-budget" ? "bg-red-500" :
                          calculations.budgetStatus.status === "warning" ? "bg-orange-500" : "bg-green-500"
                        }`}
                        style={{ width: `${Math.min(100, calculations.budgetStatus.percentage)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {calculations.budgetStatus.percentage.toFixed(0)}% do orçamento utilizado
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Simple Filter Bar - Like Banking App */}
          <div className="px-4 mb-6">
            <div className="flex items-center justify-center">
              <div className="bg-primary/10 rounded-full p-1 border border-primary/20">
                <div className="flex">
                  <button
                    onClick={() => handleFilterChange('todos')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activeFilter === 'todos'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => handleFilterChange('realizado')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activeFilter === 'realizado'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Realizados
                  </button>
                  <button
                    onClick={() => handleFilterChange('planejado')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activeFilter === 'planejado'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Planejados
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Clean Transaction List */}
          <div className="px-4 space-y-3">
            {expensesByDay.map((dayData) => (
              <div key={dayData.date} className="space-y-2">
                {/* Minimalist Date Header */}
                <div className="flex items-center justify-between py-2">
                  <h3 className="text-sm font-medium text-foreground">
                    {formatDateForBrazilian(dayData.date)}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {dayData.expenses.length} {dayData.expenses.length === 1 ? 'transação' : 'transações'}
                  </span>
                </div>
                
                {/* Clean Transaction Cards */}
                <div className="space-y-1">
                  {dayData.expenses.map((expense) => {
                    const category = EXPENSE_CATEGORIES.find(cat => cat.id === expense.category) || 
                                    EXPENSE_CATEGORIES.find(cat => cat.id === "miscellaneous")!;
                    const CategoryIcon = category.icon;
                    const isRealized = expense.expense_type === 'realizado';

                    return (
                      <div 
                        key={expense.id} 
                        className="flex items-center gap-3 p-3 bg-card hover:bg-card/80 transition-colors cursor-pointer rounded-lg border border-border/30"
                        onClick={() => handleViewExpense(expense)}
                      >
                        {/* Simple Icon */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isRealized ? category.color : 'bg-muted'
                        }`}>
                          <CategoryIcon className={`w-5 h-5 ${isRealized ? 'text-white' : 'text-muted-foreground'}`} />
                        </div>

                        {/* Transaction Info - Cleaner */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {expense.description}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {category.name}
                            {expense.establishment && (
                              <span className="ml-1">• {expense.establishment}</span>
                            )}
                          </p>
                        </div>

                        {/* Amount - Prominent */}
                        <div className="text-right flex items-center gap-2">
                          <div>
                            <p className={`font-semibold ${
                              isRealized ? 'text-red-600' : 'text-muted-foreground'
                            }`}>
                              {formatCurrency(expense.amount, selectedCurrency.symbol)}
                            </p>
                          </div>
                          
                          {/* Minimal Indicators */}
                          <div className="flex flex-col gap-1">
                            {expense.receipt_image_url && (
                              <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                                <Receipt className="w-2 h-2 text-primary" />
                              </div>
                            )}
                            {!isRealized && (
                              <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                                <Calendar className="w-2 h-2 text-blue-600" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {/* Improved Empty State */}
            {expensesByDay.length === 0 && (
              <div className="text-center py-20 px-4">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Comece a registrar seus gastos</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                  Toque no botão + para adicionar sua primeira despesa e manter o controle do orçamento da viagem
                </p>
                <Button onClick={() => setIsAddingExpense(true)} className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeiro Gasto
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Add Expense Dialog - Melhorado */}
        <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
          <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-hidden p-0">
            {/* Header Moderno */}
            <div className="px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-accent/5">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div>Novo Gasto</div>
                    <div className="text-sm font-normal text-muted-foreground">Registre sua despesa de viagem</div>
                  </div>
                </DialogTitle>
              </DialogHeader>
            </div>
            
            {/* Conteúdo com scroll otimizado */}
            <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
              <div className="space-y-6">
                
                {/* Seção de Upload com design melhorado */}
                <div className="group relative overflow-hidden rounded-2xl border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 hover:border-primary/40 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-black/20"></div>
                  <div className="relative p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">Comprovante</h3>
                        <p className="text-sm text-muted-foreground">
                          Anexe seu recibo para processamento automático com IA
                        </p>
                      </div>
                    </div>
                    
                    <ImageUpload
                      images={newExpense.receiptImages}
                      onImagesChange={handleReceiptImagesChange}
                      maxImages={1}
                    />
                  </div>
                </div>

                {/* Formulário com cards organizados */}
                <div className="space-y-5">
                  
                  {/* Informações Básicas */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                        <Tag className="w-3 h-3 text-white" />
                      </div>
                      <span className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Informações Básicas</span>
                    </div>
                    
                    <div className="grid gap-4">
                      <div>
                        <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                          <Folder className="w-4 h-4" />
                          Categoria <span className="text-red-500">*</span>
                        </Label>
                        <Select 
                          value={newExpense.category} 
                          onValueChange={(value) => setNewExpense({...newExpense, category: value, subcategory: ""})}
                          disabled={showAIProcessingModal}
                        >
                          <SelectTrigger className="h-12 border-2 hover:border-primary/50 transition-colors">
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent className="z-[100] bg-background border-2 border-border shadow-xl rounded-xl">
                            {EXPENSE_CATEGORIES.map(category => (
                              <SelectItem key={category.id} value={category.id} className="py-3">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${category.color}`}>
                                    <category.icon className="w-4 h-4 text-white" />
                                  </div>
                                  <span className="font-medium">{category.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4" />
                          Descrição <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          value={newExpense.description}
                          onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                          placeholder="Ex: Almoço no restaurante, táxi para o aeroporto..."
                          rows={3}
                          disabled={showAIProcessingModal}
                          className="resize-none border-2 hover:border-primary/50 transition-colors focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Valor e Data */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-3 h-3 text-white" />
                      </div>
                      <span className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Valor e Timing</span>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4" />
                        Valor <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-white" />
                        </div>
                        <Input
                          type="number"
                          step="0.01"
                          value={newExpense.amount}
                          onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                          placeholder="0,00"
                          className="pl-16 pr-4 h-14 text-xl font-bold border-2 hover:border-primary/50 transition-colors focus:border-primary"
                          disabled={showAIProcessingModal}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4" />
                          Data
                        </Label>
                        <Input
                          type="date"
                          value={newExpense.date}
                          onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                          disabled={showAIProcessingModal}
                          className="h-12 border-2 hover:border-primary/50 transition-colors focus:border-primary"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4" />
                          Tipo <span className="text-red-500">*</span>
                        </Label>
                        <Select 
                          value={newExpense.expense_type} 
                          onValueChange={(value) => setNewExpense({...newExpense, expense_type: value})}
                          disabled={showAIProcessingModal}
                        >
                          <SelectTrigger className="h-12 border-2 hover:border-primary/50 transition-colors">
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent className="z-50">
                            {EXPENSE_TYPES.map(type => (
                              <SelectItem key={type.id} value={type.id}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${type.id === 'realizado' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                  {type.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Detalhes Adicionais */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Info className="w-3 h-3 text-white" />
                      </div>
                      <span className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Detalhes Adicionais</span>
                    </div>
                    
                    <div className="grid gap-4">
                      <div>
                        <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                          <CreditCard className="w-4 h-4" />
                          Método de Pagamento
                        </Label>
                        <Select 
                          value={newExpense.payment_method_type} 
                          onValueChange={(value) => setNewExpense({...newExpense, payment_method_type: value})}
                          disabled={showAIProcessingModal}
                        >
                          <SelectTrigger className="h-12 border-2 hover:border-primary/50 transition-colors">
                            <SelectValue placeholder="Como foi pago" />
                          </SelectTrigger>
                          <SelectContent className="z-50">
                            {PAYMENT_METHODS.map(method => (
                              <SelectItem key={method.id} value={method.name}>
                                <div className="flex items-center gap-2">
                                  <CreditCard className="w-4 h-4" />
                                  {method.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4" />
                          Estabelecimento
                        </Label>
                        <Input
                          value={newExpense.establishment}
                          onChange={(e) => setNewExpense({...newExpense, establishment: e.target.value})}
                          placeholder="Nome do restaurante, hotel, loja..."
                          disabled={showAIProcessingModal}
                          className="h-12 border-2 hover:border-primary/50 transition-colors focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botões com design melhorado */}
            <div className="px-6 py-4 border-t bg-muted/30">
              <div className="flex gap-3">
                <Button 
                  onClick={() => setIsAddingExpense(false)}
                  variant="outline"
                  size="lg"
                  disabled={showAIProcessingModal}
                  className="flex-1 h-12 border-2 hover:bg-muted"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAddExpense}
                  disabled={showAIProcessingModal || !newExpense.category || !newExpense.description || !newExpense.amount}
                  size="lg"
                  className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                >
                  {showAIProcessingModal ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processando...
                    </div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Gasto
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Upload Options Modal - Design Melhorado */}
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogContent className="max-w-md w-[90vw] p-0 overflow-hidden">
            {/* Header com gradiente */}
            <div className="px-6 py-6 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 text-white">
              <DialogHeader>
                <DialogTitle className="text-center text-xl font-bold flex items-center justify-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <div>Processamento Inteligente</div>
                    <div className="text-sm font-normal opacity-90">Como deseja processar este recibo?</div>
                  </div>
                </DialogTitle>
              </DialogHeader>
            </div>
            
            {/* Conteúdo com opções */}
            <div className="p-6 space-y-4">
              <Button 
                onClick={handleProcessWithAI}
                className="w-full h-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-semibold text-base shadow-xl border-0 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <div className="text-2xl">✨</div>
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold">Processar com IA</div>
                    <div className="text-sm opacity-90">Preenchimento automático inteligente</div>
                  </div>
                </div>
              </Button>
              
              <Button 
                onClick={handleJustAttach}
                variant="outline"
                className="w-full h-20 border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 font-semibold text-base bg-gradient-to-r from-muted/30 to-muted/10 hover:from-muted/50 hover:to-muted/20 transition-all duration-300 hover:scale-[1.01]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-muted/50 rounded-2xl flex items-center justify-center">
                    <Camera className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold text-foreground">Apenas Anexar</div>
                    <div className="text-sm text-muted-foreground">Preencher manualmente depois</div>
                  </div>
                </div>
              </Button>
              
              {/* Dica */}
              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground">
                  💡 A IA pode extrair automaticamente categoria, valor e estabelecimento
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* AI Processing Modal - Design Melhorado */}
        <Dialog open={showAIProcessingModal} onOpenChange={() => {}}>
          <DialogContent className="max-w-md w-[90vw] p-0 overflow-hidden">
            {/* Background animado */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700"></div>
              <div className="absolute inset-0 opacity-20 animate-pulse">
                <div className="h-full w-full bg-white/10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:20px_20px]"></div>
              </div>
            </div>
            
            <div className="relative text-center space-y-8 p-8 text-white">
              {/* Ícone central animado */}
              <div className="relative mx-auto">
                <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <div className="w-16 h-16 border-4 border-white/70 border-t-white rounded-full animate-spin"></div>
                </div>
                <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce shadow-lg">
                  <Bot className="w-6 h-6 text-white" />
                </div>
              </div>
              
              {/* Conteúdo */}
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">Processando Recibo</h3>
                <p className="text-white/90 text-lg">
                  {aiProcessingStep === 'analyzing' && "🔍 Analisando imagem com IA..."}
                  {aiProcessingStep === 'extracting' && "📋 Extraindo dados do recibo..."}
                  {aiProcessingStep === 'completing' && "✅ Finalizando preenchimento..."}
                </p>
              </div>
              
              {/* Progress Steps - Melhorado */}
              <div className="flex justify-center items-center space-x-4">
                {['analyzing', 'extracting', 'completing'].map((step, index) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-4 h-4 rounded-full transition-all duration-700 ${
                      aiProcessingStep === step ? 'bg-white scale-150 shadow-lg' :
                      ['analyzing', 'extracting', 'completing'].indexOf(aiProcessingStep) > index ? 'bg-green-400 scale-110' : 'bg-white/30'
                    }`}></div>
                    {index < 2 && <div className="w-12 h-1 bg-white/30 mx-2 rounded-full overflow-hidden">
                      <div className={`h-full bg-white transition-all duration-700 ${
                        ['analyzing', 'extracting', 'completing'].indexOf(aiProcessingStep) > index ? 'w-full' : 'w-0'
                      }`}></div>
                    </div>}
                  </div>
                ))}
              </div>
              
              {/* Status adicional */}
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
                <div className="flex items-center justify-center gap-3 text-sm">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-sm"></div>
                  <span className="font-medium">IA trabalhando em segundo plano</span>
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


        {/* Receipt Viewer Dialog */}

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

        {/* Expense Detail Modal */}
        <ExpenseDetailModal
          expense={selectedExpense}
          isOpen={isViewingExpense}
          onClose={() => {
            setIsViewingExpense(false);
            setSelectedExpense(null);
          }}
          onEdit={(expense) => {
            setIsViewingExpense(false);
            handleEditExpense(expense);
          }}
          onDelete={(expense) => {
            setIsViewingExpense(false);
            setSelectedExpense(expense);
            setIsDeleteDialogOpen(true);
          }}
          onViewReceipt={handleViewReceipt}
          currencySymbol={selectedCurrency.symbol}
        />

        {/* Receipt Viewer Dialog */}
        <Dialog open={isViewingReceipt} onOpenChange={setIsViewingReceipt}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto z-[60]">
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
