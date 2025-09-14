import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/types/concierge";
import { Check, Loader2 } from "lucide-react";

interface ActionButtonsProps {
  onSave: () => Promise<void>;
  isSaving: boolean;
  saved: boolean;
  actions?: ActionButton[];
}

export const ActionButtons = ({ onSave, isSaving, saved, actions }: ActionButtonsProps) => {
  return (
    <div className="flex gap-2 mt-3 flex-wrap">
      <Button
        onClick={onSave}
        disabled={isSaving || saved}
        variant={saved ? "outline" : "default"}
        size="sm"
        className="hover-scale"
      >
        {isSaving && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
        {saved && <Check className="w-3 h-3 mr-2" />}
        {saved ? 'Salvo na Programação' : 'Salvar na Programação'}
      </Button>
      
      {actions?.map((action, index) => (
        <Button
          key={index}
          variant={action.variant === "primary" ? "default" : action.variant === "secondary" ? "secondary" : "outline"}
          size="sm"
          className="hover-scale"
          disabled={isSaving}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
};