import { Bot } from "lucide-react";

export const WelcomeMessage = () => {
  return (
    <div className="message-bot mb-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        <div className="bg-muted rounded-lg p-4 max-w-[80%]">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-foreground">
              Concierge de Viagem
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Olá! Sou seu concierge pessoal para qualquer assunto da viagem. Como posso te ajudar hoje?
          </p>
        </div>
      </div>
    </div>
  );
};