import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Edit } from "lucide-react";

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
  onEdit: () => void;
}

export const DocumentCard = memo(({ document, categoryConfig, onClick, onEdit }: DocumentCardProps) => {
  const CategoryIcon = categoryConfig.icon;

  return (
    <div className="flex items-center gap-3 p-4 bg-card rounded-lg border hover:bg-accent/50 transition-colors">
      <div className={`w-10 h-10 ${categoryConfig.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
        <CategoryIcon className="w-5 h-5 text-white" />
      </div>
      
      <div 
        className="flex-1 min-w-0 cursor-pointer"
        onClick={onClick}
      >
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
      
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="w-8 h-8"
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          className="w-8 h-8"
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
});

DocumentCard.displayName = "DocumentCard";