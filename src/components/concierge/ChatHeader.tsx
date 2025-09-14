import { ArrowLeft, ChevronRight } from "lucide-react";
import { ConciergeCategory, TripData } from "@/types/concierge";
import { getCategoryData, formatDateRange } from "@/utils/conciergeHelpers";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  category: ConciergeCategory;
  tripData: TripData;
  onClose: () => void;
}

export const ChatHeader = ({ category, tripData, onClose }: ChatHeaderProps) => {
  const categoryData = getCategoryData(category);
  
  return (
    <div className="chat-header bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 rounded-t-lg">
      {/* Breadcrumb de navegação */}
      <div className="flex items-center text-sm opacity-90 mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-primary-foreground hover:bg-white/10 p-1 mr-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <span>Concierge de Viagem</span>
        <ChevronRight className="w-4 h-4 mx-1" />
        <span className="font-semibold">{tripData.destination}</span>
      </div>
      
      {/* Info da categoria e viagem */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="text-xl">{categoryData.icon}</span>
            {categoryData.name}
          </h2>
          <p className="text-sm opacity-90">
            {tripData.destination} • {formatDateRange(tripData.startDate, tripData.endDate)}
          </p>
        </div>
        
        <div className="text-right text-xs">
          <div className="bg-green-500 px-2 py-1 rounded-full mb-1">
            ✅ {tripData.status}
          </div>
          <div className="opacity-75">{tripData.durationDays} dias</div>
        </div>
      </div>
      
      {/* Chips dos destinos */}
      {tripData.destinations && tripData.destinations.length > 0 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {tripData.destinations.map((dest, index) => (
            <span key={index} className="bg-white/20 text-xs px-2 py-1 rounded-full">
              📍 {dest}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};