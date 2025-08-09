import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Edit } from "lucide-react";

interface DocumentCardProps {
  document: {
    id: string;
    title: string;
    category: string;
    description?: string;
    file_name: string;
    file_type: string;
    created_at: string;
  };
  categoryConfig: {
    name: string;
    icon: any;
    color: string;
    bgColor: string;
    borderColor: string;
  };
  viewMode?: "grid" | "list";
  onClick: () => void;
  onEdit: () => void;
}

export const DocumentCard = memo(({ document, categoryConfig, viewMode = "grid", onClick, onEdit }: DocumentCardProps) => {
  const CategoryIcon = categoryConfig.icon;

  if (viewMode === "list") {
    return (
      <div className="flex items-center gap-4 p-4 bg-card rounded-lg border hover:shadow-card transition-all duration-200 cursor-pointer group">
        <div className={`w-12 h-12 ${categoryConfig.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <CategoryIcon className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1 min-w-0" onClick={onClick}>
          <h4 className="font-semibold text-base truncate group-hover:text-primary transition-colors" title={document.title}>
            {document.title}
          </h4>
          {document.description && (
            <p className="text-sm text-muted-foreground truncate mt-1" title={document.description}>
              {document.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
            <span>{new Date(document.created_at).toLocaleDateString('pt-BR')}</span>
            <span>•</span>
            <Badge variant="outline" className="text-xs">
              {categoryConfig.name}
            </Badge>
            <span>•</span>
            <span className="text-xs">{document.file_name}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
  }

  return (
    <div className={`p-6 rounded-xl border transition-all duration-200 cursor-pointer group hover:shadow-card ${categoryConfig.bgColor} ${categoryConfig.borderColor}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${categoryConfig.color} rounded-xl flex items-center justify-center`}>
          <CategoryIcon className="w-6 h-6 text-white" />
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="w-8 h-8 hover:bg-white/50"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            className="w-8 h-8 hover:bg-white/50"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div onClick={onClick}>
        <h4 className="font-semibold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors" title={document.title}>
          {document.title}
        </h4>
        
        {document.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2" title={document.description}>
            {document.description}
          </p>
        )}
        
        <div className="space-y-2">
          <Badge variant="outline" className="text-xs">
            {categoryConfig.name}
          </Badge>
          <div className="text-xs text-muted-foreground">
            <div>{new Date(document.created_at).toLocaleDateString('pt-BR')}</div>
            <div className="truncate mt-1" title={document.file_name}>{document.file_name}</div>
          </div>
        </div>
      </div>
    </div>
  );
});

DocumentCard.displayName = "DocumentCard";