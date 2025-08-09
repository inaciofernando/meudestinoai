import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface DocumentCardProps {
  document: {
    id: string;
    title: string;
    category: string;
    created_at: string;
  };
  categoryConfig: {
    name: string;
    icon: any;
    color: string;
  };
  onClick: () => void;
}

export const DocumentCard = memo(({ document, categoryConfig, onClick }: DocumentCardProps) => {
  const CategoryIcon = categoryConfig.icon;

  return (
    <div 
      className="flex items-center gap-3 p-4 bg-card rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className={`w-10 h-10 ${categoryConfig.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
        <CategoryIcon className="w-5 h-5 text-white" />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-base truncate" title={document.title}>
          {document.title}
        </h4>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{new Date(document.created_at).toLocaleDateString('pt-BR')}</span>
          <span>•</span>
          <Badge variant="outline" className="text-xs">
            {categoryConfig.name}
          </Badge>
        </div>
      </div>
      
      <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </div>
  );
});

DocumentCard.displayName = "DocumentCard";