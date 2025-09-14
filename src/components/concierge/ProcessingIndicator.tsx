import { TypingIndicator } from "./TypingIndicator";

interface ProcessingIndicatorProps {
  message: string;
}

export const ProcessingIndicator = ({ message }: ProcessingIndicatorProps) => (
  <div className="message-bot mb-4">
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
        🧑‍💼
      </div>
      <div className="bg-muted rounded-lg p-4 max-w-[80%]">
        <div className="flex items-center gap-2">
          <TypingIndicator />
          <span className="text-primary font-medium">{message}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Analisando as melhores opções para você...
        </p>
      </div>
    </div>
  </div>
);