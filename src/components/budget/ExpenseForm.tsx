import { useState, useEffect } from "react";
import { Calendar, MapPin, Camera } from "lucide-react";
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
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 fixed bottom-0 left-0 right-0 top-auto rounded-t-xl border-t sm:relative sm:top-auto sm:bottom-auto sm:left-auto sm:right-auto sm:rounded-lg sm:border data-[state=open]:slide-in-from-bottom-80 data-[state=open]:sm:slide-in-from-bottom-0 data-[state=closed]:slide-out-to-bottom-80 data-[state=closed]:sm:slide-out-to-bottom-0 max-h-[85vh] sm:max-h-[90vh]">
        <div className="flex flex-col max-h-full">
          <DialogHeader className="p-6 pb-4 flex-shrink-0 border-b bg-background/95 backdrop-blur-sm">
            <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4 sm:hidden"></div>
            <DialogTitle className="text-xl font-semibold">
              {editingItem ? "Editar Gasto" : "Adicionar Novo Gasto"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 pt-4">
            <div className="space-y-5">
              {/* Status Toggle */}
              <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className={`text-sm font-medium ${!isConfirmed ? 'text-primary' : 'text-muted-foreground'}`}>
                    Planejado
                  </span>
                  <Switch
                    checked={isConfirmed}
                    onCheckedChange={setIsConfirmed}
                    className="data-[state=checked]:bg-green-600"
                  />
                  <span className={`text-sm font-medium ${isConfirmed ? 'text-green-600' : 'text-muted-foreground'}`}>
                    Realizado
                  </span>
                </div>
              </div>

              {/* Receipt Upload */}
              <div>
                <Label className="text-base font-medium">Comprovante</Label>
                <div className="mt-2 border-2 border-dashed border-muted rounded-lg p-4 text-center bg-muted/10">
                  {receiptImageUrl ? (
                    <div className="space-y-3">
                      <img 
                        src={receiptImageUrl} 
                        alt="Comprovante" 
                        className="max-h-40 mx-auto rounded-lg shadow-sm"
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
                    <div className="space-y-3">
                      <Camera className="h-10 w-10 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Adicione uma foto do comprovante
                      </p>
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
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="title" className="text-base font-medium">Título *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Passagem aérea"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="text-base font-medium">Categoria *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location and Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location" className="text-base font-medium">Local</Label>
                  <div className="relative mt-1">
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
                  <Label htmlFor="expense-date" className="text-base font-medium">Data</Label>
                  <div className="relative mt-1">
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
              </div>

              {/* Payment and Values */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="payment-method" className="text-base font-medium">Método de Pagamento</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione o método de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map(method => (
                        <SelectItem key={method} value={method}>{method}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="planned-amount" className="text-base font-medium">Valor Planejado (R$) *</Label>
                    <Input
                      id="planned-amount"
                      type="number"
                      step="0.01"
                      value={plannedAmount}
                      onChange={(e) => setPlannedAmount(e.target.value)}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>

                  {isConfirmed && (
                    <div>
                      <Label htmlFor="actual-amount" className="text-base font-medium">Valor Gasto (R$)</Label>
                      <Input
                        id="actual-amount"
                        type="number"
                        step="0.01"
                        value={actualAmount}
                        onChange={(e) => setActualAmount(e.target.value)}
                        placeholder="0.00"
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Description and Notes */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="description" className="text-base font-medium">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detalhes sobre o gasto..."
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="notes" className="text-base font-medium">Notas</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observações adicionais..."
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex-shrink-0 p-6 pt-4 border-t bg-background/95 backdrop-blur-sm">
            <div className="flex gap-3">
              <Button 
                onClick={handleSubmit} 
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Salvando..." : (editingItem ? "Atualizar" : "Adicionar")}
              </Button>
              <Button 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}