import { memo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { 
  Plane, Hotel, UtensilsCrossed, Car, ShoppingBag, MapPin, 
  Ticket, Briefcase, Edit2, Trash2, Receipt, X, Calendar, MapPin as LocationIcon
} from "lucide-react";

interface Expense {
  id: string;
  trip_id: string;
  category: string;
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

interface ExpenseDetailModalProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  onViewReceipt: (imageUrl: string) => void;
  currencySymbol: string;
}

const EXPENSE_CATEGORIES = [
  { id: "transport", name: "Transporte", icon: Plane, color: "bg-blue-500" },
  { id: "accommodation", name: "Hospedagem", icon: Hotel, color: "bg-purple-500" },
  { id: "food", name: "Alimentação", icon: UtensilsCrossed, color: "bg-green-500" },
  { id: "transport_local", name: "Transporte Local", icon: Car, color: "bg-orange-500" },
  { id: "shopping", name: "Compras", icon: ShoppingBag, color: "bg-pink-500" },
  { id: "attractions", name: "Atrações", icon: MapPin, color: "bg-indigo-500" },
  { id: "entertainment", name: "Entretenimento", icon: Ticket, color: "bg-red-500" },
  { id: "miscellaneous", name: "Diversos", icon: Briefcase, color: "bg-gray-500" }
];

const formatDateForBrazilian = (dateString: string): string => {
  if (!dateString) return '';
  const cleanDate = dateString.split('T')[0];
  const [year, month, day] = cleanDate.split('-');
  return `${day}/${month}/${year}`;
};

export const ExpenseDetailModal = memo(({ 
  expense, 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete, 
  onViewReceipt,
  currencySymbol 
}: ExpenseDetailModalProps) => {
  if (!expense) return null;

  const category = EXPENSE_CATEGORIES.find(cat => cat.id === expense.category) || 
                  EXPENSE_CATEGORIES.find(cat => cat.id === "miscellaneous")!;
  const CategoryIcon = category.icon;
  const isRealized = expense.expense_type === 'realizado';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold">Detalhes da Transação</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Main Info Section */}
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 ${
              isRealized ? category.color : 'bg-muted'
            }`}>
              <CategoryIcon className={`w-8 h-8 ${isRealized ? 'text-white' : 'text-muted-foreground'}`} />
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {expense.description}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {category.name}
              </p>
              <Badge 
                variant={isRealized ? 'default' : 'outline'}
                className="text-xs"
              >
                {isRealized ? 'Realizado' : 'Planejado'}
              </Badge>
            </div>
          </div>

          {/* Amount */}
          <div className="bg-muted/30 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Valor</p>
            <p className={`text-2xl font-bold ${
              isRealized ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
            }`}>
              {formatCurrency(expense.amount, currencySymbol)}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Data</span>
              </div>
              <p className="text-sm font-medium">{formatDateForBrazilian(expense.date)}</p>
            </div>

            {expense.establishment && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LocationIcon className="w-4 h-4" />
                  <span>Local</span>
                </div>
                <p className="text-sm font-medium">{expense.establishment}</p>
              </div>
            )}

            {expense.payment_method_type && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Pagamento</span>
                </div>
                <p className="text-sm font-medium capitalize">{expense.payment_method_type.replace('_', ' ')}</p>
              </div>
            )}
          </div>

          {/* Receipt Section */}
          {expense.receipt_image_url && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Receipt className="w-4 h-4" />
                <span>Comprovante</span>
              </div>
              <div className="relative group">
                <img 
                  src={expense.receipt_image_url} 
                  alt="Comprovante" 
                  className="w-full h-32 object-cover rounded-lg border cursor-pointer transition-opacity group-hover:opacity-80"
                  onClick={() => onViewReceipt(expense.receipt_image_url!)}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-medium">Clique para ampliar</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onEdit(expense)}
              className="flex-1"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="destructive"
              onClick={() => onDelete(expense)}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

ExpenseDetailModal.displayName = "ExpenseDetailModal";