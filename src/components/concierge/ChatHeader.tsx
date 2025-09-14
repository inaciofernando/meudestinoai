import { ArrowLeft } from "lucide-react";
import { ConciergeCategory } from "@/types/concierge";
import { getCategoryData } from "@/utils/conciergeHelpers";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  category: ConciergeCategory;
  onClose: () => void;
}

export const ChatHeader = ({ category, onClose }: ChatHeaderProps) => {
  const categoryData = getCategoryData(category);
  
  return (
    <div className="chat-header bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 rounded-t-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-primary-foreground hover:bg-white/10 p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="text-xl">{categoryData.icon}</span>
            Concierge de {categoryData.name}
          </h2>
        </div>
      </div>
    </div>
  );
};