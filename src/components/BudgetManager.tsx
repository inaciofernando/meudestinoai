import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Plus, Edit2, Check, X, DollarSign, Calendar, MapPin, Camera, Receipt } from "lucide-react";
import { Switch } from "./ui/switch";
import { ImageUpload } from "./ImageUpload";

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

const CATEGORIES = [
  "Transporte",
  "Hospedagem",
  "Alimentação",
  "Atividades",
  "Compras",
  "Emergência",
  "Outros"
];

const CURRENCIES = [
  { code: "BRL", symbol: "R$", name: "Real Brasileiro" },
  { code: "USD", symbol: "$", name: "Dólar Americano" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "Libra Esterlina" }
];

export function BudgetManager({ tripId, totalBudget = 0, budgetCurrency = "BRL", onBudgetUpdate }: BudgetManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  
  // Budget editing states
  const [editBudgetAmount, setEditBudgetAmount] = useState(totalBudget.toString());
  const [editBudgetCurrency, setEditBudgetCurrency] = useState(budgetCurrency);
  
  // Form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [plannedAmount, setPlannedAmount] = useState("");
  const [actualAmount, setActualAmount] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [location, setLocation] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [receiptImageUrl, setReceiptImageUrl] = useState("");
  const [notes, setNotes] = useState("");

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
        .order("created_at", { ascending: true });

      if (error) throw error;
      setBudgetItems(data || []);
    } catch (error) {
      console.error("Erro ao buscar itens do orçamento:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar itens do orçamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setCategory("");
    setDescription("");
    setPlannedAmount("");
    setActualAmount("");
    setIsConfirmed(false);
    setLocation("");
    setExpenseDate("");
    setPaymentMethod("");
    setReceiptImageUrl("");
    setNotes("");
    setEditingItem(null);
  };

  const handleSubmit = async () => {
    if (!user || !title || !category || !plannedAmount) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      const itemData = {
        trip_id: tripId,
        user_id: user.id,
        title,
        category,
        description,
        planned_amount: parseFloat(plannedAmount),
        actual_amount: actualAmount ? parseFloat(actualAmount) : null,
        currency: budgetCurrency,
        is_confirmed: isConfirmed,
        location: location || null,
        expense_date: expenseDate || null,
        payment_method: paymentMethod || null,
        receipt_image_url: receiptImageUrl || null,
        notes: notes || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from("budget_items")
          .update(itemData)
          .eq("id", editingItem.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Item do orçamento atualizado com sucesso",
        });
      } else {
        const { error } = await supabase
          .from("budget_items")
          .insert(itemData);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Item adicionado ao orçamento com sucesso",
        });
      }

      await fetchBudgetItems();
      setIsDialogOpen(false);
      resetForm();
      onBudgetUpdate?.();
    } catch (error) {
      console.error("Erro ao salvar item:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar item do orçamento",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: BudgetItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setCategory(item.category || "");
    setDescription(item.description || "");
    setPlannedAmount(item.planned_amount.toString());
    setActualAmount(item.actual_amount?.toString() || "");
    setIsConfirmed(item.is_confirmed);
    setLocation(item.location || "");
    setExpenseDate(item.expense_date || "");
    setPaymentMethod(item.payment_method || "");
    setReceiptImageUrl(item.receipt_image_url || "");
    setNotes(item.notes || "");
    setIsDialogOpen(true);
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
        description: item.is_confirmed ? "Item movido para planejado" : "Item confirmado como gasto",
      });
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do item",
        variant: "destructive",
      });
    }
  };

  const handleBudgetUpdate = async () => {
    if (!user || !editBudgetAmount) {
      toast({
        title: "Erro",
        description: "Preencha o valor do orçamento",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("trips")
        .update({ 
          total_budget: parseFloat(editBudgetAmount),
          budget_currency: editBudgetCurrency
        })
        .eq("id", tripId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Orçamento da viagem atualizado com sucesso",
      });

      setIsBudgetDialogOpen(false);
      onBudgetUpdate?.();
    } catch (error) {
      console.error("Erro ao atualizar orçamento:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar orçamento da viagem",
        variant: "destructive",
      });
    }
  };

  const totalPlanned = budgetItems.reduce((sum, item) => sum + item.planned_amount, 0);
  const totalSpent = budgetItems
    .filter(item => item.is_confirmed && item.actual_amount)
    .reduce((sum, item) => sum + (item.actual_amount || 0), 0);

  const remainingBudget = totalBudget - totalSpent;

  if (loading) {
    return <div className="p-4">Carregando orçamento...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Budget Summary */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Resumo do Orçamento</h3>
          <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setEditBudgetAmount(totalBudget.toString());
                  setEditBudgetCurrency(budgetCurrency);
                }}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Editar Orçamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Orçamento da Viagem</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="budget-amount">Orçamento Total *</Label>
                  <Input
                    id="budget-amount"
                    type="number"
                    step="0.01"
                    value={editBudgetAmount}
                    onChange={(e) => setEditBudgetAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <Label htmlFor="budget-currency">Moeda</Label>
                  <Select value={editBudgetCurrency} onValueChange={setEditBudgetCurrency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a moeda" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(currency => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.symbol} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleBudgetUpdate} className="flex-1">
                    Salvar Orçamento
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsBudgetDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Orçamento Total</div>
              <div className="text-2xl font-bold text-primary">
                {selectedCurrency.symbol} {totalBudget.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Planejado</div>
              <div className="text-2xl font-bold">
                {selectedCurrency.symbol} {totalPlanned.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Gasto</div>
              <div className="text-2xl font-bold text-destructive">
                {selectedCurrency.symbol} {totalSpent.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Restante</div>
              <div className={`text-2xl font-bold ${remainingBudget >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {selectedCurrency.symbol} {remainingBudget.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Item Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Itens do Orçamento</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar Item" : "Adicionar Item ao Orçamento"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Tipo de Gasto */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-confirmed"
                  checked={isConfirmed}
                  onCheckedChange={setIsConfirmed}
                />
                <Label htmlFor="is-confirmed">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isConfirmed ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {isConfirmed ? 'Realizado' : 'Planejado'}
                  </span>
                </Label>
              </div>

              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Passagem aérea"
                />
              </div>

              <div>
                <Label htmlFor="category">Categoria *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Local</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Universal CityWalk, Orlando"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="expense-date">Data</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="expense-date"
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="payment-method">Método de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o método de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                    <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Transferência">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="planned-amount">Valor Planejado ({selectedCurrency.symbol}) *</Label>
                <Input
                  id="planned-amount"
                  type="number"
                  step="0.01"
                  value={plannedAmount}
                  onChange={(e) => setPlannedAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              {isConfirmed && (
                <div>
                  <Label htmlFor="actual-amount">Valor Gasto ({selectedCurrency.symbol})</Label>
                  <Input
                    id="actual-amount"
                    type="number"
                    step="0.01"
                    value={actualAmount}
                    onChange={(e) => setActualAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="receipt-upload">Comprovante</Label>
                <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center">
                  {receiptImageUrl ? (
                    <div className="space-y-2">
                      <img 
                        src={receiptImageUrl} 
                        alt="Comprovante" 
                        className="max-h-32 mx-auto rounded"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setReceiptImageUrl("")}
                      >
                        Remover
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Camera className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Adicione uma foto do comprovante
                      </p>
                      <ImageUpload
                        images={receiptImageUrl ? [receiptImageUrl] : []}
                        onImagesChange={(images) => setReceiptImageUrl(images[0] || "")}
                        maxImages={1}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes adicionais sobre o item"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Adicione notas ou observações sobre este gasto..."
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleSubmit} className="flex-1">
                  {editingItem ? "Atualizar" : "Adicionar"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Budget Items List */}
      <div className="space-y-3">
        {budgetItems.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum item no orçamento ainda. Adicione itens para começar a planejar seus gastos.
              </p>
            </CardContent>
          </Card>
        ) : (
          budgetItems.map((item) => (
            <Card key={item.id} className={`transition-all ${item.is_confirmed ? 'border-destructive/20 bg-destructive/5' : 'border-primary/20 bg-primary/5'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-1 text-xs rounded-full bg-muted">
                        {item.category}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.is_confirmed 
                          ? 'bg-destructive text-destructive-foreground' 
                          : 'bg-primary text-primary-foreground'
                      }`}>
                        {item.is_confirmed ? 'Confirmado' : 'Planejado'}
                      </span>
                    </div>
                     <h4 className="font-medium">{item.title}</h4>
                     {item.description && (
                       <p className="text-sm text-muted-foreground">{item.description}</p>
                     )}
                     
                     {/* Additional Details */}
                     <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
                       {item.location && (
                         <span className="flex items-center gap-1">
                           <MapPin className="h-3 w-3" />
                           {item.location}
                         </span>
                       )}
                       {item.expense_date && (
                         <span className="flex items-center gap-1">
                           <Calendar className="h-3 w-3" />
                           {new Date(item.expense_date).toLocaleDateString('pt-BR')}
                         </span>
                       )}
                       {item.payment_method && (
                         <span className="px-2 py-1 bg-muted rounded-full">
                           {item.payment_method}
                         </span>
                       )}
                       {item.receipt_image_url && (
                         <span className="flex items-center gap-1 text-primary">
                           <Receipt className="h-3 w-3" />
                           Comprovante
                         </span>
                       )}
                     </div>
                     
                     <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                       <span>Planejado: {selectedCurrency.symbol} {item.planned_amount.toFixed(2)}</span>
                       {item.is_confirmed && item.actual_amount && (
                         <span>Gasto: {selectedCurrency.symbol} {item.actual_amount.toFixed(2)}</span>
                       )}
                     </div>

                     {item.notes && (
                       <p className="text-xs text-muted-foreground mt-1 italic">
                         {item.notes}
                       </p>
                     )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={item.is_confirmed ? "destructive" : "default"}
                      size="sm"
                      onClick={() => handleToggleConfirmed(item)}
                    >
                      {item.is_confirmed ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}