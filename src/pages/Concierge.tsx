import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PWALayout } from "@/components/layout/PWALayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bot, MapPin, Calendar, Plus, Mic, ArrowUp, Loader2, User, ArrowLeft, RotateCcw, Clock, Trash2, UtensilsCrossed, MapPinPlus } from "lucide-react";

interface TripCtx {
  id: string;
  title: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
}

interface Message { role: "user" | "assistant"; content: string }

interface ConversationHistory {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

interface QuickActionButtonsProps {
  message: string;
  tripId: string;
}

function QuickActionButtons({ message, tripId }: QuickActionButtonsProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Detecta se a mensagem contém sugestões de restaurantes ou pontos turísticos
  const containsRestaurant = /restaurante|comida|culinária|gastronomia|prato|comer|jantar|almoçar|café da manhã|zareen|food|restaurant/i.test(message);
  const containsAttraction = /vinícola|atração|ponto turístico|visitar|museu|parque|monumento|igreja|teatro|shopping|mercado|praia|trilha|passeio|winery|attraction/i.test(message);
  
  console.log("🔍 Analyzing message for quick actions:", { containsRestaurant, containsAttraction, messageLength: message.length });
  
  const extractRestaurantInfo = () => {
    const lines = message.split('\n');
    const restaurants = [];
    
    // First, try to extract from **bold** text
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('**') && /restaurante|zareen|food|restaurant/i.test(line)) {
        const name = line.replace(/\*\*/g, '').replace(/^\d+\.?\s*/, '').trim();
        if (name.length > 3) {
          restaurants.push({
            name: name.split(' - ')[0].split(':')[0].trim(),
            description: lines[i + 1]?.trim() || ''
          });
        }
      }
    }
    
    // If no bold restaurants found, try to extract restaurant names mentioned
    if (restaurants.length === 0) {
      const restaurantMatches = message.match(/([A-Z][a-zA-Z'\s]+(?:'s)?)\s*(?=\.|,|\n|$)/g);
      if (restaurantMatches) {
        restaurantMatches.forEach(match => {
          const cleaned = match.trim().replace(/[.,]$/, '');
          if (cleaned.length > 3 && /[A-Z]/.test(cleaned)) {
            restaurants.push({
              name: cleaned,
              description: 'Sugerido pelo concierge'
            });
          }
        });
      }
    }
    
    console.log("🍽️ Extracted restaurants:", restaurants);
    return restaurants;
  };

  const extractAttractionInfo = () => {
    const lines = message.split('\n');
    const attractions = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('**') && (containsAttraction || /vinícola|atração|museu|parque/i.test(line))) {
        const name = line.replace(/\*\*/g, '').replace(/^\d+\.?\s*/, '').trim();
        if (name.length > 3) {
          attractions.push({
            name: name.split(' - ')[0].split(':')[0].trim(),
            description: lines[i + 1]?.trim() || ''
          });
        }
      }
    }
    return attractions;
  };

  const handleAddRestaurant = (restaurant: any) => {
    // Navegar para página de restaurantes com dados pré-preenchidos
    const params = new URLSearchParams({
      name: restaurant.name,
      description: restaurant.description,
      fromConcierge: 'true'
    });
    navigate(`/viagem/${tripId}/restaurantes?${params.toString()}`);
  };

  const handleAddAttraction = (attraction: any) => {
    // Navegar para página de roteiro com dados pré-preenchidos
    const params = new URLSearchParams({
      title: attraction.name,
      description: attraction.description,
      category: 'attraction',
      fromConcierge: 'true'
    });
    navigate(`/viagem/${tripId}/roteiro?${params.toString()}`);
  };

  const restaurants = extractRestaurantInfo();
  const attractions = extractAttractionInfo();

  console.log("🎯 Quick action results:", { restaurants, attractions, willShow: restaurants.length > 0 || attractions.length > 0 });

  // Sempre mostrar os botões de ação rápida para melhor UX
  // if (!containsRestaurant && !containsAttraction) {
  //   console.log("❌ No quick actions detected");
  //   return null;
  // }

  return (
    <div className="mt-3 space-y-2">
      {/* Sempre mostrar botão para adicionar manualmente */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Ações rápidas:</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const params = new URLSearchParams({ fromConcierge: 'true' });
              navigate(`/viagem/${tripId}/restaurantes?${params.toString()}`);
            }}
            className="h-8 px-3 text-xs gap-1"
          >
            <UtensilsCrossed className="w-3 h-3" />
            Adicionar Restaurante
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const params = new URLSearchParams({ fromConcierge: 'true' });
              navigate(`/viagem/${tripId}/roteiro?${params.toString()}`);
            }}
            className="h-8 px-3 text-xs gap-1"
          >
            <MapPinPlus className="w-3 h-3" />
            Adicionar ao Roteiro
          </Button>
        </div>
      </div>

      {/* Botões automáticos baseados na detecção */}
      {restaurants.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Sugestões detectadas - Adicionar aos restaurantes:</p>
          <div className="flex flex-wrap gap-2">
            {restaurants.slice(0, 3).map((restaurant, index) => (
              <Button
                key={index}
                variant="secondary"
                size="sm"
                onClick={() => handleAddRestaurant(restaurant)}
                className="h-8 px-3 text-xs gap-1"
              >
                <UtensilsCrossed className="w-3 h-3" />
                {restaurant.name.length > 20 ? restaurant.name.substring(0, 20) + '...' : restaurant.name}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {attractions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Sugestões detectadas - Adicionar ao roteiro:</p>
          <div className="flex flex-wrap gap-2">
            {attractions.slice(0, 3).map((attraction, index) => (
              <Button
                key={index}
                variant="secondary"
                size="sm"
                onClick={() => handleAddAttraction(attraction)}
                className="h-8 px-3 text-xs gap-1"
              >
                <MapPinPlus className="w-3 h-3" />
                {attraction.name.length > 20 ? attraction.name.substring(0, 20) + '...' : attraction.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Concierge() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [trip, setTrip] = useState<TripCtx | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ConversationHistory[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

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
    loadConversationHistory();
  }, [id, toast]);

  const tripSummary = useMemo(() => {
    if (!trip) return "";
    return `Viagem: ${trip.title}. Destino: ${trip.destination ?? "não informado"}. Início: ${trip.start_date ?? "ND"}. Fim: ${trip.end_date ?? "ND"}.`;
  }, [trip]);

  const loadConversationHistory = async () => {
    if (!id) return;
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from("concierge_conversations")
        .select("*")
        .eq("trip_id", id)
        .order("updated_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      const transformedData = (data || []).map(item => ({
        ...item,
        messages: Array.isArray(item.messages) ? (item.messages as unknown) as Message[] : []
      }));
      setConversationHistory(transformedData);
    } catch (error: any) {
      console.error("Error loading conversation history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const saveConversation = async (newMessages: Message[]) => {
    if (!id || newMessages.length === 0) return;
    
    try {
      const title = newMessages[0]?.content.slice(0, 50) + (newMessages[0]?.content.length > 50 ? '...' : '');
      
      if (currentConversationId) {
        // Update existing conversation
        const { error } = await supabase
          .from("concierge_conversations")
          .update({
            messages: newMessages as any,
            title,
            updated_at: new Date().toISOString()
          })
          .eq("id", currentConversationId);
        
        if (error) throw error;
      } else {
        // Create new conversation
        const { data, error } = await supabase
          .from("concierge_conversations")
          .insert({
            trip_id: id,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            title,
            messages: newMessages as any
          })
          .select()
          .single();
        
        if (error) throw error;
        setCurrentConversationId(data.id);
      }
      
      loadConversationHistory();
    } catch (error: any) {
      console.error("Error saving conversation:", error);
    }
  };

  const loadConversation = (conversation: ConversationHistory) => {
    setMessages(conversation.messages);
    setCurrentConversationId(conversation.id);
  };

  const startNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from("concierge_conversations")
        .delete()
        .eq("id", conversationId);
      
      if (error) throw error;
      
      if (currentConversationId === conversationId) {
        startNewConversation();
      }
      
      loadConversationHistory();
      toast({ title: "Conversa excluída", description: "A conversa foi removida com sucesso." });
    } catch (error: any) {
      toast({ title: "Erro", description: "Não foi possível excluir a conversa.", variant: "destructive" });
    }
  };

  async function ask() {
    if (!input.trim()) return;
    setLoading(true);
    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      const { data, error } = await supabase.functions.invoke("concierge-agent", {
        body: { prompt: input, tripId: id, tripContext: trip },
      });

      if (error) {
        throw new Error(error.message || "Falha ao consultar o Concierge");
      }

      const payload: any = data || {};
      const reply: string = payload.generatedText || payload.text || payload.result || "Sem resposta.";
      const finalMessages: Message[] = [...newMessages, { role: "assistant" as const, content: reply }];
      setMessages(finalMessages);
      
      // Save conversation automatically
      await saveConversation(finalMessages);
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
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="h-9 w-9"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold">Concierge da Viagem</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={startNewConversation}
                className="gap-2"
                aria-label="Nova conversa"
              >
                <RotateCcw className="h-4 w-4" />
                Nova Conversa
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Clock className="h-4 w-4" />
                    Histórico
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Conversas Recentes</h3>
                    <ScrollArea className="h-64">
                      {historyLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : conversationHistory.length === 0 ? (
                        <p className="text-muted-foreground text-sm py-4 text-center">
                          Nenhuma conversa encontrada
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {conversationHistory.map((conversation) => (
                            <div
                              key={conversation.id}
                              className="flex items-center justify-between p-2 rounded-md hover:bg-muted group"
                            >
                              <button
                                onClick={() => loadConversation(conversation)}
                                className="flex-1 text-left text-sm text-foreground/80 hover:text-foreground truncate pr-2"
                              >
                                {conversation.title}
                              </button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteConversation(conversation.id)}
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-destructive"
                                aria-label="Excluir conversa"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <p className="text-muted-foreground ml-12">Faça perguntas sobre esta viagem e receba recomendações contextualizadas.</p>
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
                        <div className="space-y-3">
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
                          <QuickActionButtons message={m.content} tripId={id!} />
                        </div>
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
