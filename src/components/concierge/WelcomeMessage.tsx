import { ConciergeCategory } from "@/types/concierge";
import { getCategoryData } from "@/utils/conciergeHelpers";
import { Bot } from "lucide-react";

interface WelcomeMessageProps {
  category: ConciergeCategory;
}

export const WelcomeMessage = ({ category }: WelcomeMessageProps) => {
  const categoryData = getCategoryData(category);
  
  return (
    <div className="message-bot mb-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        <div className="bg-muted rounded-lg p-4 max-w-[80%]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{categoryData.icon}</span>
            <span className="font-semibold text-foreground">
              Concierge de {categoryData.name}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Olá! Sou seu concierge pessoal e estou aqui para ajudar com {categoryData.type}s 
            para sua viagem. Como posso te auxiliar hoje?
          </p>
        </div>
      </div>
    </div>
  );
};