import { useState, useEffect } from "react";
import { Calendar, MapPin, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  "Transporte",
  "Hospedagem", 
  "Alimentação",
  "Atividades",
  "Compras",
  "Emergência",
  "Outros"
];

const PAYMENT_METHODS = [
  "Cartão de Crédito",
  "Cartão de Débito", 
  "Dinheiro",
  "PIX",
  "Transferência"
];

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

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  budgetCurrency: string;
  editingItem?: BudgetItem | null;
  onExpenseUpdate: () => void;
}

export function ExpenseForm({ 
  isOpen, 
  onClose, 
  tripId, 
  budgetCurrency, 
  editingItem, 
  onExpenseUpdate 
}: ExpenseFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog closes or editing item changes
  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setCategory(editingItem.category || "");
      setDescription(editingItem.description || "");
      setPlannedAmount(editingItem.planned_amount.toString());
      setActualAmount(editingItem.actual_amount?.toString() || "");
      setIsConfirmed(editingItem.is_confirmed);
      setLocation(editingItem.location || "");
      setExpenseDate(editingItem.expense_date || "");
      setPaymentMethod(editingItem.payment_method || "");
      setReceiptImageUrl(editingItem.receipt_image_url || "");
      setNotes(editingItem.notes || "");
    } else {
      resetForm();
    }
  }, [editingItem, isOpen]);

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

    setIsSubmitting(true);

    try {
      const itemData = {
        trip_id: tripId,
        user_id: user.id,
        title,
        category,
        description: description || null,
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
          description: "Gasto atualizado com sucesso",
        });
      } else {
        const { error } = await supabase
          .from("budget_items")
          .insert(itemData);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Gasto adicionado com sucesso",
        });
      }

      onExpenseUpdate();
      onClose();
      resetForm();
    } catch (error) {
      console.error("Erro ao salvar gasto:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar gasto",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-lg mx-auto p-0 gap-0 fixed bottom-0 left-1/2 -translate-x-1/2 rounded-t-3xl border-t shadow-2xl max-h-[95vh] sm:relative sm:bottom-auto sm:left-auto sm:transform-none sm:rounded-xl sm:border sm:max-w-3xl data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-full data-[state=open]:sm:slide-in-from-bottom-0 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-full" style={{ zIndex: 9999 }}>
        
        {/* Header */}
        <div className="relative p-6 pb-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-t-3xl sm:rounded-t-xl border-b">
          <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4 sm:hidden"></div>
          
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {editingItem ? "Editar Gasto" : "Novo Gasto"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {editingItem ? "Atualize as informações do gasto" : "Adicione um novo item ao seu orçamento"}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-140px)] overflow-y-auto">
          <div className="p-6 space-y-6">
            
            {/* Status Toggle */}
            <div className="flex items-center justify-center p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center space-x-4">
                <span className={`text-sm font-medium transition-colors ${!isConfirmed ? 'text-primary' : 'text-muted-foreground'}`}>
                  Planejado
                </span>
                <Switch
                  checked={isConfirmed}
                  onCheckedChange={setIsConfirmed}
                  className="data-[state=checked]:bg-green-500"
                />
                <span className={`text-sm font-medium transition-colors ${isConfirmed ? 'text-green-600' : 'text-muted-foreground'}`}>
                  Realizado
                </span>
              </div>
            </div>

            {/* Receipt Upload */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Comprovante</Label>
              <div className="border-2 border-dashed border-muted rounded-xl p-6 text-center bg-muted/20 hover:bg-muted/30 transition-colors">
                {receiptImageUrl ? (
                  <div className="space-y-3">
                    <div className="relative inline-block">
                      <img 
                        src={receiptImageUrl} 
                        alt="Comprovante" 
                        className="max-h-32 rounded-lg shadow-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setReceiptImageUrl("")}
                        className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Camera className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        Adicionar comprovante
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Tire uma foto ou selecione uma imagem
                      </p>
                    </div>
                    <ImageUpload
                      images={[]}
                      onImagesChange={(images) => setReceiptImageUrl(images[0] || "")}
                      maxImages={1}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold">Título *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Passagem aérea"
                  className="h-11 rounded-xl border-2 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-semibold">Categoria *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-11 rounded-xl border-2 bg-background">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location and Date */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-semibold">Local</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Universal CityWalk, Orlando"
                    className="h-11 pl-10 rounded-xl border-2 focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense-date" className="text-sm font-semibold">Data</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="expense-date"
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="h-11 pl-10 rounded-xl border-2 focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="payment-method" className="text-sm font-semibold">Método de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-11 rounded-xl border-2 bg-background">
                  <SelectValue placeholder="Selecione o método de pagamento" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {PAYMENT_METHODS.map(method => (
                    <SelectItem key={method} value={method}>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Values */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planned-amount" className="text-sm font-semibold">Valor Planejado (R$) *</Label>
                <Input
                  id="planned-amount"
                  type="number"
                  step="0.01"
                  value={plannedAmount}
                  onChange={(e) => setPlannedAmount(e.target.value)}
                  placeholder="0,00"
                  className="h-11 rounded-xl border-2 focus:border-primary text-lg font-semibold"
                />
              </div>

              {isConfirmed && (
                <div className="space-y-2">
                  <Label htmlFor="actual-amount" className="text-sm font-semibold">Valor Gasto (R$)</Label>
                  <Input
                    id="actual-amount"
                    type="number"
                    step="0.01"
                    value={actualAmount}
                    onChange={(e) => setActualAmount(e.target.value)}
                    placeholder="0,00"
                    className="h-11 rounded-xl border-2 focus:border-primary text-lg font-semibold"
                  />
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes sobre o gasto..."
                className="rounded-xl border-2 focus:border-primary resize-none"
                rows={3}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-semibold">Notas</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações adicionais..."
                className="rounded-xl border-2 focus:border-primary resize-none"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 bg-background border-t rounded-b-3xl sm:rounded-b-xl">
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 h-12 rounded-xl font-semibold"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="flex-1 h-12 rounded-xl font-semibold bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : (editingItem ? "Atualizar" : "Adicionar")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}