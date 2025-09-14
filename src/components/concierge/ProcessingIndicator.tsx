import { TypingIndicator } from "./TypingIndicator";
import { Bot } from "lucide-react";

interface ProcessingIndicatorProps {
  message: string;
}

export const ProcessingIndicator = ({ message }: ProcessingIndicatorProps) => (
  <div className="message-bot mb-4">
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
        <Bot className="w-4 h-4 text-primary" />
      </div>
      <div className="bg-muted rounded-lg p-4 max-w-[80%]">
        <TypingIndicator />
      </div>
    </div>
  </div>
);