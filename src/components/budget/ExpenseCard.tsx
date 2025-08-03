import { Calendar, MapPin, Receipt, Camera, Edit2, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

interface ExpenseCardProps {
  item: BudgetItem;
  currencySymbol: string;
  onEdit: (item: BudgetItem) => void;
  onToggleConfirmed: (item: BudgetItem) => void;
}

export function ExpenseCard({ item, currencySymbol, onEdit, onToggleConfirmed }: ExpenseCardProps) {
  return (
    <Card className={`group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
      item.is_confirmed 
        ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20' 
        : 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20'
    }`}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Receipt Image */}
          <div className="flex-shrink-0">
            {item.receipt_image_url ? (
              <div className="relative">
                <img 
                  src={item.receipt_image_url} 
                  alt="Comprovante" 
                  className="w-14 h-14 object-cover rounded-lg border-2 border-primary/20 shadow-sm"
                />
                <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                  <Receipt className="h-3 w-3" />
                </div>
              </div>
            ) : (
              <div className="w-14 h-14 bg-muted/50 rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                <Camera className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-xs">
                    {item.category}
                  </Badge>
                  <Badge 
                    variant={item.is_confirmed ? "default" : "outline"}
                    className={`text-xs ${
                      item.is_confirmed 
                        ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400' 
                        : 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400'
                    }`}
                  >
                    {item.is_confirmed ? 'Realizado' : 'Planejado'}
                  </Badge>
                </div>
                <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
              </div>
              
              {/* Actions */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(item)}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleConfirmed(item)}
                  className={`h-8 w-8 p-0 ${
                    item.is_confirmed 
                      ? 'hover:bg-red-100 dark:hover:bg-red-900/20' 
                      : 'hover:bg-green-100 dark:hover:bg-green-900/20'
                  }`}
                >
                  {item.is_confirmed ? (
                    <X className="h-4 w-4 text-red-600" />
                  ) : (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </Button>
              </div>
            </div>

            {/* Description */}
            {item.description && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {item.description}
              </p>
            )}

            {/* Details */}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
              {item.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate max-w-32">{item.location}</span>
                </span>
              )}
              {item.expense_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(item.expense_date).toLocaleDateString('pt-BR')}
                </span>
              )}
              {item.payment_method && (
                <Badge variant="outline" className="text-xs h-5">
                  {item.payment_method}
                </Badge>
              )}
            </div>

            {/* Values */}
            <div className="flex items-center justify-between">
              <div className="flex gap-4 text-sm">
                <span className="text-muted-foreground">
                  Planejado: <span className="font-medium text-primary">{currencySymbol} {item.planned_amount.toFixed(2)}</span>
                </span>
                {item.is_confirmed && item.actual_amount && (
                  <span className="text-muted-foreground">
                    Gasto: <span className="font-medium text-green-600 dark:text-green-400">{currencySymbol} {item.actual_amount.toFixed(2)}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Notes */}
            {item.notes && (
              <div className="mt-2 p-2 bg-muted/30 rounded text-xs text-muted-foreground italic">
                {item.notes}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}