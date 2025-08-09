import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PWALayout } from "@/components/layout/PWALayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bot, MapPin, Calendar, Plus, Mic, ArrowUp, Loader2, User } from "lucide-react";

interface TripCtx {
  id: string;
  title: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
}

interface Message { role: "user" | "assistant"; content: string }

export default function Concierge() {
  const { id } = useParams<{ id: string }>();
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
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `${window.location.origin}/viagem/${id}/concierge`);
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

  const tripSummary = useMemo(() => {
    if (!trip) return "";
    return `Viagem: ${trip.title}. Destino: ${trip.destination ?? "não informado"}. Início: ${trip.start_date ?? "ND"}. Fim: ${trip.end_date ?? "ND"}.`;
  }, [trip]);

  async function ask() {
    if (!input.trim()) return;
    setLoading(true);
    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((m) => [...m, userMessage]);

    try {
      const { data, error } = await supabase.functions.invoke("concierge-agent", {
        body: { prompt: input, tripId: id, tripContext: trip },
      });

      if (error) {
        throw new Error(error.message || "Falha ao consultar o Concierge");
      }

      const payload: any = data || {};
      const reply: string = payload.generatedText || payload.text || payload.result || "Sem resposta.";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha na requisição.", variant: "destructive" });
    } finally {
      setLoading(false);
      setInput("");
    }
  }

  return (
    <ProtectedRoute>
      <PWALayout showHeader={false} showFooter={false}>
        <header className="mb-4">
          <h1 className="text-2xl font-bold">Concierge da Viagem</h1>
          <p className="text-muted-foreground">Faça perguntas sobre esta viagem e receba recomendações contextualizadas.</p>
        </header>
        <main>
          <section aria-labelledby="trip-context" className="mb-4">
            <Card>
              <CardHeader>
                <CardTitle id="trip-context" className="flex items-center gap-2 text-base">
                  <Bot className="w-5 h-5" /> Contexto da Viagem
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground flex flex-wrap gap-4">
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {trip?.destination ?? "Destino não informado"}</div>
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {trip?.start_date ?? "ND"} — {trip?.end_date ?? "ND"}</div>
              </CardContent>
            </Card>
          </section>

          <section className="flex flex-col h-full">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Faça uma pergunta sobre sua viagem para começar</p>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {m.role !== "user" && (
                      <div className="h-7 w-7 rounded-full bg-muted text-foreground/80 flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {m.role === "assistant" ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            a: ({ node, ...props }) => (
                              <a
                                {...props}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline text-primary"
                              />
                            ),
                            ul: (props) => <ul className="list-disc pl-5 my-2" {...props} />,
                            ol: (props) => <ol className="list-decimal pl-5 my-2" {...props} />,
                            li: (props) => <li className="my-1" {...props} />,
                            h1: (props) => <h1 className="text-lg font-bold mb-2" {...props} />,
                            h2: (props) => <h2 className="text-base font-semibold mb-2" {...props} />,
                            p: (props) => <p className="leading-relaxed mb-2" {...props} />,
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      ) : (
                        <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                      )}
                    </div>
                    {m.role === "user" && (
                      <div className="h-7 w-7 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Input Area - sempre visível na parte inferior */}
            <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t pt-4">
              <div className="flex items-end gap-3">
                <div className="relative flex-1">
                  <div className="absolute left-1.5 top-1/2 -translate-y-1/2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-full border-0 hover:bg-muted"
                      onClick={() =>
                        toast({
                          title: "Em breve",
                          description: "Anexos serão suportados em breve.",
                        })
                      }
                      aria-label="Adicionar"
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="absolute right-12 top-1/2 -translate-y-1/2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-full border-0 hover:bg-muted"
                      onClick={() =>
                        toast({
                          title: "Em breve",
                          description: "Entrada por voz em breve.",
                        })
                      }
                      aria-label="Falar"
                    >
                      <Mic className="w-5 h-5" />
                    </Button>
                  </div>

                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Digite sua pergunta sobre a viagem..."
                    className="h-14 rounded-full pl-14 pr-20 text-base shadow-sm"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        ask();
                      }
                    }}
                  />
                </div>

                <Button
                  onClick={ask}
                  disabled={loading || !input.trim()}
                  size="icon"
                  aria-label="Enviar mensagem"
                  className="h-14 w-14 shrink-0 rounded-full bg-foreground text-background hover:bg-foreground/90"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowUp className="w-5 h-5" />
                  )}
                </Button>
              </div>
              <div className="pb-4" />
            </div>
          </section>
        </main>
      </PWALayout>
    </ProtectedRoute>
  );
}
