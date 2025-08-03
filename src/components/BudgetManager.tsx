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
import { Plus, Edit2, Check, X, DollarSign } from "lucide-react";
import { Switch } from "./ui/switch";

interface BudgetItem {
  id: string;
  title: string;
  category?: string;
  description?: string;
  planned_amount: number;
  actual_amount?: number;
  currency: string;
  is_confirmed: boolean;
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
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  
  // Form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [plannedAmount, setPlannedAmount] = useState("");
  const [actualAmount, setActualAmount] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);

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
            <div className="space-y-4">
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
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes adicionais sobre o item"
                />
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
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-confirmed"
                  checked={isConfirmed}
                  onCheckedChange={setIsConfirmed}
                />
                <Label htmlFor="is-confirmed">Marcar como gasto confirmado</Label>
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
                    <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                      <span>Planejado: {selectedCurrency.symbol} {item.planned_amount.toFixed(2)}</span>
                      {item.is_confirmed && item.actual_amount && (
                        <span>Gasto: {selectedCurrency.symbol} {item.actual_amount.toFixed(2)}</span>
                      )}
                    </div>
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