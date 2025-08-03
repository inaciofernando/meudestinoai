import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  Bot,
  PieChart,
  BarChart3,
  Receipt,
  Target,
  AlertCircle,
  CheckCircle,
  Edit2
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
  const [isEditingExpense, setIsEditingExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isAnalyzingReceipt, setIsAnalyzingReceipt] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>("");
  const [activeTab, setActiveTab] = useState("overview");

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

  // Form states for editing expense
  const [editForm, setEditForm] = useState({
    category: "",
    subcategory: "",
    amount: "",
    currency: "BRL",
    description: "",
    date: "",
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
          .from('receipts')
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

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setEditForm({
      category: expense.category,
      subcategory: "",
      amount: expense.amount.toString(),
      currency: expense.currency,
      description: expense.description,
      date: expense.date.split('T')[0],
      location: expense.location || "",
      receiptFile: null
    });
    setIsEditingExpense(true);
  };

  const handleUpdateExpense = async () => {
    if (!user || !trip || !editingExpense) return;

    try {
      let receiptUrl = editingExpense.receipt_url;

      // Upload new receipt if provided
      if (editForm.receiptFile) {
        const fileExt = editForm.receiptFile.name.split('.').pop();
        const fileName = `${user.id}/${trip.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, editForm.receiptFile);

        if (uploadError) {
          throw uploadError;
        }

        receiptUrl = uploadData.path;
      }

      // Update expense in database
      const { error } = await supabase
        .from('budget_items')
        .update({
          title: editForm.description,
          category: editForm.category,
          actual_amount: parseFloat(editForm.amount),
          planned_amount: parseFloat(editForm.amount),
          currency: editForm.currency,
          expense_date: editForm.date,
          location: editForm.location,
          receipt_image_url: receiptUrl
        })
        .eq('id', editingExpense.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Gasto atualizado!",
        description: "Suas alterações foram salvas com sucesso.",
      });

      // Reset form and close dialog
      setEditForm({
        category: "",
        subcategory: "",
        amount: "",
        currency: "BRL",
        description: "",
        date: "",
        location: "",
        receiptFile: null
      });
      
      setIsEditingExpense(false);
      setEditingExpense(null);

      // Refresh expenses
      fetchExpenses();
    } catch (error) {
      console.error('Error updating expense:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o gasto. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleAnalyzeReceipt = async () => {
    if (!newExpense.receiptFile) {
      toast({
        title: "Erro",
        description: "Selecione uma imagem do cupom fiscal primeiro.",
        variant: "destructive"
      });
      return;
    }

    console.log("🚀 INICIANDO ANÁLISE - Estado atual:", { isAnalyzingReceipt, analysisStep });
    setIsAnalyzingReceipt(true);
    setAnalysisStep("✈️ Preparando para decolagem...");
    
    // Forçar re-render
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log("✅ Estado atualizado:", { isAnalyzingReceipt: true, analysisStep: "✈️ Preparando para decolagem..." });

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        console.log("📤 Processando imagem...");
        setAnalysisStep("🧳 Fazendo check-in...");
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const base64 = e.target?.result as string;
        const imageBase64 = base64.split(',')[1]; // Remove data:image/jpeg;base64, prefix

        try {
          console.log("🤖 Enviando para IA...");
          setAnalysisStep("🗺️ IA explorando o cupom...");
          await new Promise(resolve => setTimeout(resolve, 200));
          
          const { data, error } = await supabase.functions.invoke('analyze-receipt', {
            body: { imageBase64 }
          });

          if (error) {
            console.error('Supabase function error:', error);
            throw new Error(`Erro na função: ${error.message}`);
          }

          if (data.success && data.data) {
            setAnalysisStep("📝 Preenchendo diário de viagem...");
            const extractedData = data.data;
            
            // Auto-fill the form with extracted data
            setNewExpense(prev => ({
              ...prev,
              amount: extractedData.amount ? extractedData.amount.toString() : prev.amount,
              date: extractedData.date || prev.date,
              location: extractedData.location || prev.location,
              category: extractedData.category || prev.category,
              description: extractedData.description || prev.description
            }));

            toast({
              title: "Análise concluída! 🎉",
              description: "Os dados do cupom foram extraídos e preenchidos automaticamente.",
            });
          } else {
            throw new Error(data.error || 'Erro na análise do cupom - resposta inválida');
          }
        } catch (analysisError: any) {
          console.error('Error analyzing receipt:', analysisError);
          toast({
            title: "Erro na análise",
            description: `Não foi possível analisar o cupom fiscal: ${analysisError.message}`,
            variant: "destructive"
          });
        }
      };

      reader.onerror = () => {
        console.error('FileReader error');
        toast({
          title: "Erro",
          description: "Erro ao processar a imagem. Verifique o formato do arquivo.",
          variant: "destructive"
        });
      };

      reader.readAsDataURL(newExpense.receiptFile);
    } catch (error: any) {
      console.error('Error processing file:', error);
      toast({
        title: "Erro",
        description: `Erro ao processar a imagem: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      console.log("Finalizando análise - resetando estado");
      setIsAnalyzingReceipt(false);
      setAnalysisStep("");
      console.log("Estado resetado - isAnalyzingReceipt:", false);
    }
  };

  const handleUpdateBudget = async () => {
    if (!trip || !user) return;

    try {
      const { error } = await supabase
        .from("trips")
        .update({
          total_budget: parseFloat(budgetForm.total_budget) || 0,
          budget_currency: budgetForm.budget_currency
        })
        .eq("id", trip.id)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      // Update local state
      setTrip({
        ...trip,
        total_budget: parseFloat(budgetForm.total_budget) || 0,
        budget_currency: budgetForm.budget_currency
      });

      setIsEditingBudget(false);

      toast({
        title: "Sucesso!",
        description: "Orçamento atualizado com sucesso",
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

  if (loading) {
    return (
      <ProtectedRoute>
        <PWALayout>
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando gastos...</p>
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
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Viagem não encontrada</p>
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
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 p-4 md:p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg mx-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/viagem/${id}`)}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-primary" />
                Gastos da Viagem
              </h1>
              <p className="text-muted-foreground">{trip.title} • {trip.destination}</p>
            </div>
            <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
              <DialogTrigger asChild>
                <Button size="icon" className="bg-gradient-ocean hover:shadow-travel transition-all duration-300">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Gasto</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Cupom Fiscal - Início do formulário */}
                  <div>
                    <Label htmlFor="receipt" className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Cupom Fiscal (Opcional)
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
                                  <span className="font-semibold">Clique para anexar</span> o cupom fiscal
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
                    {newExpense.receiptFile && (
                      <div className="mt-3">
                        <Button 
                          onClick={() => {
                            console.log("🎯 BOTÃO CLICADO! Estado antes:", { isAnalyzingReceipt, analysisStep });
                            handleAnalyzeReceipt();
                          }}
                          disabled={isAnalyzingReceipt}
                          variant="outline"
                          className="w-full bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border-purple-200 disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:from-purple-50 disabled:hover:to-blue-50"
                         >
                           {isAnalyzingReceipt ? (
                             <div className="flex items-center justify-center gap-3 py-1">
                               <div className="relative flex items-center justify-center">
                                 {/* Ícone de viagem animado */}
                                 <Plane className="w-5 h-5 text-purple-600 animate-bounce z-10" />
                                 {/* Círculo de loading */}
                                 <div className="absolute inset-0 w-7 h-7 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                               </div>
                               <div className="flex flex-col items-start">
                                 <span className="text-sm font-medium text-purple-700">Analisando cupom...</span>
                                 <span className="text-xs text-purple-500">{analysisStep || "Processando..."}</span>
                               </div>
                             </div>
                           ) : (
                             <>
                               <Bot className="w-4 h-4 mr-2 text-purple-600" />
                               Analisar com IA
                             </>
                           )}
                         </Button>
                      </div>
                    )}
                  </div>

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
                              {currency.symbol} {currency.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Data *</Label>
                      <Input
                        type="date"
                        value={newExpense.date}
                        onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Local</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          value={newExpense.location}
                          onChange={(e) => setNewExpense({...newExpense, location: e.target.value})}
                          placeholder="Onde foi o gasto?"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleAddExpense} 
                    className="w-full"
                    disabled={!newExpense.category || !newExpense.description || !newExpense.amount}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Gasto
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Budget Edit Dialog */}
            <Dialog open={isEditingBudget} onOpenChange={setIsEditingBudget}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Editar Orçamento da Viagem</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
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
                      <Select 
                        value={budgetForm.budget_currency} 
                        onValueChange={(value) => setBudgetForm({...budgetForm, budget_currency: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map(currency => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.symbol} {currency.code} - {currency.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditingBudget(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleUpdateBudget} 
                      className="flex-1"
                    >
                      Salvar Orçamento
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Expense Edit Dialog */}
            <Dialog open={isEditingExpense} onOpenChange={(open) => {
              setIsEditingExpense(open);
              if (!open) {
                setEditingExpense(null);
              }
            }}>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Editar Gasto</DialogTitle>
                </DialogHeader>
                {editingExpense && (
                  <div className="space-y-4">
                    <div>
                      <Label>Categoria</Label>
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

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Valor</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={editForm.amount}
                          onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                          placeholder="0,00"
                        />
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
                                {currency.symbol} {currency.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Descrição</Label>
                      <Textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        placeholder="Descreva o gasto..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Data</Label>
                        <Input
                          type="date"
                          value={editForm.date}
                          onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Local</Label>
                        <Input
                          value={editForm.location}
                          onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                          placeholder="Ex: Restaurante Central, Hotel Plaza..."
                        />
                      </div>
                    </div>

                    {/* Current Receipt Display */}
                    {editingExpense.receipt_url && (
                      <div>
                        <Label>Cupom Fiscal Atual</Label>
                        <div className="flex items-center gap-2 p-2 border rounded-lg">
                          <Receipt className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-muted-foreground">
                            Cupom anexado - 
                            <Button 
                              variant="link" 
                              className="h-auto p-0 text-primary"
                              onClick={() => {
                                const { data } = supabase.storage.from('receipts').getPublicUrl(editingExpense.receipt_url!);
                                window.open(data.publicUrl, '_blank');
                              }}
                            >
                              visualizar
                            </Button>
                          </span>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="edit-receipt" className="flex items-center gap-2">
                        <Camera className="w-4 h-4" />
                        {editingExpense.receipt_url ? 'Substituir Cupom Fiscal' : 'Adicionar Cupom Fiscal'}
                      </Label>
                      <div className="mt-2">
                        <div className="flex items-center justify-center w-full">
                          <label htmlFor="edit-receipt" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer bg-muted/10 hover:bg-muted/20 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              {editForm.receiptFile ? (
                                <>
                                  <Receipt className="w-8 h-8 mb-2 text-green-600" />
                                  <p className="text-sm text-green-600 font-medium">{editForm.receiptFile.name}</p>
                                  <p className="text-xs text-muted-foreground">Clique para alterar</p>
                                </>
                              ) : editingExpense.receipt_url ? (
                                <>
                                  <Receipt className="w-8 h-8 mb-2 text-blue-600" />
                                  <p className="text-sm text-blue-600 font-medium">Cupom atual anexado</p>
                                  <p className="text-xs text-muted-foreground">Clique para substituir</p>
                                </>
                              ) : (
                                <>
                                  <Camera className="w-8 h-8 mb-2 text-muted-foreground" />
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-semibold">Clique para anexar</span> o cupom fiscal
                                  </p>
                                  <p className="text-xs text-muted-foreground">PNG, JPG até 10MB</p>
                                </>
                              )}
                            </div>
                            <Input
                              id="edit-receipt"
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
                          </label>
                        </div>
                      </div>
                      {editingExpense.receipt_url && !editForm.receiptFile && (
                        <div className="mt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const { data } = supabase.storage.from('receipts').getPublicUrl(editingExpense.receipt_url!);
                              window.open(data.publicUrl, '_blank');
                            }}
                            className="text-xs"
                          >
                            <Receipt className="w-3 h-3 mr-1" />
                            Visualizar cupom atual
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditingExpense(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleUpdateExpense} 
                        className="flex-1"
                      >
                        Salvar Alterações
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* Budget Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Orçamento Total</p>
                    <p className="text-2xl font-bold text-primary">
                      {selectedCurrency.symbol} {(trip.total_budget || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingBudget(true)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Target className="w-8 h-8 text-primary/50" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Gasto</p>
                    <p className="text-2xl font-bold text-destructive">
                      {selectedCurrency.symbol} {getTotalExpenses().toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-destructive/50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Restante</p>
                    <p className="text-2xl font-bold text-green-600">
                      {selectedCurrency.symbol} {Math.max(0, (trip.total_budget || 0) - getTotalExpenses()).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center">
                    {budgetStatus.status === "on-track" && <CheckCircle className="w-8 h-8 text-green-500/50" />}
                    {budgetStatus.status === "warning" && <AlertCircle className="w-8 h-8 text-yellow-500/50" />}
                    {budgetStatus.status === "over-budget" && <AlertCircle className="w-8 h-8 text-red-500/50" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Assistant Promotion */}
          <Card className="mx-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Agente de IA para Gastos</h3>
                  <p className="text-muted-foreground">
                    Em breve: Nosso assistente de IA analisará seus gastos, categorizará automaticamente e fornecerá insights inteligentes sobre seu orçamento de viagem.
                  </p>
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  Em Breve
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for different views */}
          <div className="px-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="text-xs">Visão Geral</TabsTrigger>
                <TabsTrigger value="categories" className="text-xs">Categorias</TabsTrigger>
                <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
                <TabsTrigger value="reports" className="text-xs">Relatórios</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="w-5 h-5" />
                      Gastos por Categoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {expenses.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum gasto registrado ainda</p>
                        <p className="text-sm">Comece adicionando seus primeiros gastos</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {expenses.map((expense) => {
                          const category = EXPENSE_CATEGORIES.find(c => c.id === expense.category) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
                          const CategoryIcon = category.icon;
                          
                          return (
                            <div 
                              key={expense.id} 
                              className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => handleEditExpense(expense)}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${category.color} text-white`}>
                                  <CategoryIcon className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="font-medium">{expense.description}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {category.name} • {new Date(expense.date).toLocaleDateString('pt-BR')}
                                    {expense.location && ` • ${expense.location}`}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-destructive">
                                  {CURRENCIES.find(c => c.code === expense.currency)?.symbol || '$'} {expense.amount.toFixed(2)}
                                </p>
                                {expense.receipt_url && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                    <Receipt className="w-3 h-3" />
                                    <span>Cupom anexado</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="categories" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {EXPENSE_CATEGORIES.map(category => (
                    <Card key={category.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${category.color} rounded-lg flex items-center justify-center`}>
                            <category.icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{category.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {selectedCurrency.symbol} 0,00
                            </p>
                          </div>
                          <Badge variant="outline">0</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Timeline de Gastos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                      <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Timeline vazia</p>
                      <p className="text-sm">Seus gastos aparecerão aqui conforme você os adiciona</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Relatórios Inteligentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                      <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Relatórios com IA</p>
                      <p className="text-sm">Em breve: análises inteligentes dos seus gastos de viagem</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </PWALayout>
    </ProtectedRoute>
  );
}