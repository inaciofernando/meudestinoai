import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

interface ExpenseFiltersProps {
  activeFilter: 'todos' | 'planejado' | 'realizado';
  onFilterChange: (filter: 'todos' | 'planejado' | 'realizado') => void;
  totalCount: number;
  plannedCount: number;
  realizedCount: number;
  showChart: boolean;
  onToggleChart: () => void;
}

export const ExpenseFilters = memo(({ 
  activeFilter, 
  onFilterChange, 
  totalCount, 
  plannedCount, 
  realizedCount,
  showChart,
  onToggleChart 
}: ExpenseFiltersProps) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg">
        <Button
          variant={activeFilter === 'todos' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onFilterChange('todos')}
          className="flex-1 gap-1"
        >
          Todos
          <Badge variant="secondary" className="ml-1 text-xs">
            {totalCount}
          </Badge>
        </Button>
        <Button
          variant={activeFilter === 'realizado' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onFilterChange('realizado')}
          className="flex-1 gap-1"
        >
          Realizados
          <Badge variant="secondary" className="ml-1 text-xs">
            {realizedCount}
          </Badge>
        </Button>
        <Button
          variant={activeFilter === 'planejado' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onFilterChange('planejado')}
          className="flex-1 gap-1"
        >
          Planejados
          <Badge variant="secondary" className="ml-1 text-xs">
            {plannedCount}
          </Badge>
        </Button>
      </div>

      {/* Chart Toggle */}
      <div className="flex justify-center">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onToggleChart}
          className="gap-2"
        >
          <TrendingUp className="w-4 h-4" />
          {showChart ? 'Ocultar' : 'Mostrar'} Gráficos
        </Button>
      </div>
    </div>
  );
});

ExpenseFilters.displayName = "ExpenseFilters";