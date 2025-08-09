import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DocumentStatsProps {
  stats: {
    total: number;
    byCategory: Record<string, number>;
  };
  categories: Record<string, {
    name: string;
    icon: any;
    color: string;
    bgColor: string;
    borderColor: string;
  }>;
}

export function DocumentStats({ stats, categories }: DocumentStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
      <Card className="col-span-2 md:col-span-1">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total de Documentos</div>
        </CardContent>
      </Card>
      
      {Object.entries(categories).map(([key, category]) => {
        const CategoryIcon = category.icon;
        const count = stats.byCategory[key] || 0;
        
        return (
          <Card key={key} className={`${category.bgColor} ${category.borderColor}`}>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className={`w-8 h-8 rounded-full ${category.color} flex items-center justify-center`}>
                  <CategoryIcon className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="text-lg font-semibold">{count}</div>
              <div className="text-xs text-muted-foreground">{category.name}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}