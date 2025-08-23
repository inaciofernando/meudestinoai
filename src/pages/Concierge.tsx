import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface TripCtx {
  id: string;
  title: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
}

interface Message { 
  role: "user" | "assistant"; 
  content: string;
}

export default function ConciergeNew() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [trip, setTrip] = useState<TripCtx | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // SEO basics
  useEffect(() => {
    const title = "Concierge da Viagem | TravelManager";
    document.title = title;
    const desc = "Concierge inteligente para sua viagem: recomendações e planejamento personalizados.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }, [id]);

  useEffect(() => {
    const fetchTrip = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from("trips")
        .select("id,title,destination,start_date,end_date")
        .eq("id", id)
        .single();
      if (error) {
        toast({ title: "Erro", description: "Não foi possível carregar a viagem.", variant: "destructive" });
        return;
      }
      setTrip(data as TripCtx);
    };
    fetchTrip();
  }, [id, toast]);

  const ask = useCallback(async () => {
    const finalPrompt = input.trim();
    if (!finalPrompt) return;
    
    setLoading(true);
    const userMessage: Message = { role: "user", content: finalPrompt };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    try {
      const minimalCtx = trip
        ? { 
            id: trip.id, 
            title: trip.title, 
            destination: trip.destination ?? "", 
            start_date: trip.start_date ?? "", 
            end_date: trip.end_date ?? "" 
          }
        : (id ? { id } : {});
      
      const reqBody = { prompt: finalPrompt, tripId: id ?? "", tripContext: minimalCtx };
      const { data, error } = await supabase.functions.invoke("concierge-agent", { body: reqBody });

      if (error) {
        throw new Error(error.message || "Falha ao consultar o Concierge");
      }

      const payload: any = data || {};
      const reply: string = payload.generatedText || payload.text || payload.result || "Sem resposta.";
      const finalMessages: Message[] = [...newMessages, { role: "assistant" as const, content: reply }];
      setMessages(finalMessages);
    } catch (e: any) {
      const msg = (e && (e.message || e.error?.message)) || "Falha na requisição.";
      const humanMsg = /non-2xx|GEMINI|unauthorized|apikey/i.test(String(msg))
        ? "O Concierge não está configurado. Adicione a chave GEMINI nas Funções do Supabase."
        : msg;
      toast({ title: "Erro", description: humanMsg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [input, messages, trip, id, toast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !loading) {
      e.preventDefault();
      ask();
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-background">
        {/* Header fixo */}
        <header className="flex-shrink-0 bg-background border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="h-9 w-9 p-0"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Concierge de Viagem</h1>
              {trip && (
                <p className="text-sm text-muted-foreground">{trip.title}</p>
              )}
            </div>
          </div>
        </header>

        {/* Chat messages */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Send className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-lg font-semibold mb-2">Como posso ajudar?</h2>
                <p className="text-muted-foreground text-sm">
                  Faça uma pergunta sobre sua viagem e receba recomendações personalizadas.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))
          )}
        </main>

        {/* Input fixo na parte inferior */}
        <footer className="flex-shrink-0 border-t bg-background p-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Faça sua pergunta sobre a viagem..."
              className="min-h-[40px] max-h-32 resize-none"
              disabled={loading}
            />
            <Button
              onClick={ask}
              disabled={loading || !input.trim()}
              size="icon"
              className="h-10 w-10"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}