import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PWALayout } from "@/components/layout/PWALayout";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Calendar, Plus, ArrowLeft, Clock, Trash2, MoreVertical, Loader2 } from "lucide-react";
import { ConciergeChatMessage } from "@/components/concierge/ConciergeChatMessage";
import { ConciergeQuickActions } from "@/components/concierge/ConciergeQuickActions";
import { ConciergeInput } from "@/components/concierge/ConciergeInput";
import { ConciergeActionButtons } from "@/components/concierge/ConciergeActionButtons";

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

interface ConversationHistory {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
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
  const [historyOpen, setHistoryOpen] = useState(false);

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

  const loadConversationHistory = useCallback(async () => {
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
  }, [id]);

  const saveConversation = useCallback(async (newMessages: Message[]) => {
    if (!id || newMessages.length === 0) return;
    
    try {
      const title = newMessages[0]?.content.slice(0, 50) + (newMessages[0]?.content.length > 50 ? '...' : '');
      
      if (currentConversationId) {
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
  }, [id, currentConversationId, loadConversationHistory]);

  const loadConversation = useCallback((conversation: ConversationHistory) => {
    setMessages(conversation.messages);
    setCurrentConversationId(conversation.id);
  }, []);

  const startNewConversation = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
  }, []);

  const deleteConversation = useCallback(async (conversationId: string) => {
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
  }, [currentConversationId, startNewConversation, loadConversationHistory, toast]);

  const ask = useCallback(async (promptOverride?: string) => {
    const finalPrompt = (promptOverride ?? input).trim();
    if (!finalPrompt) return;
    
    setLoading(true);
    const userMessage: Message = { role: "user", content: finalPrompt };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

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
      
      await saveConversation(finalMessages);
    } catch (e: any) {
      const msg = (e && (e.message || e.error?.message)) || "Falha na requisição.";
      const humanMsg = /non-2xx|GEMINI|unauthorized|apikey/i.test(String(msg))
        ? "O Concierge não está configurado. Adicione a chave GEMINI nas Funções do Supabase."
        : msg;
      toast({ title: "Erro", description: humanMsg, variant: "destructive" });
    } finally {
      setLoading(false);
      setInput("");
    }
  }, [input, messages, trip, id, toast, saveConversation]);

  const handleQuickAction = useCallback((query: string) => {
    setInput(query);
    ask(query);
  }, [ask]);

  return (
    <ProtectedRoute>
      <PWALayout showHeader={true} showFooter={false}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="h-9 w-9 p-0 hover:bg-muted rounded-lg"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Concierge de Viagem</h1>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 hover:bg-muted rounded-lg"
                  aria-label="Menu"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={startNewConversation} className="gap-2">
                  <Plus className="h-4 w-4" /> Novo chat
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setHistoryOpen(true)} className="gap-2">
                  <Clock className="h-4 w-4" /> Histórico
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Histórico</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <ScrollArea className="h-80">
                {historyLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : conversationHistory.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-6 text-center">
                    Nenhuma conversa encontrada
                  </p>
                ) : (
                  <div className="space-y-1 pr-2">
                    {conversationHistory.map((conversation) => (
                      <div
                        key={conversation.id}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-muted group"
                      >
                        <button
                          onClick={() => { loadConversation(conversation); setHistoryOpen(false); }}
                          className="flex-1 text-left text-sm text-foreground/80 hover:text-foreground truncate pr-2"
                        >
                          {conversation.title}
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteConversation(conversation.id)}
                          className="h-6 w-6 hover:text-destructive"
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
          </DialogContent>
        </Dialog>

          {/* Chat Interface */}
          <div className="flex flex-col h-[calc(100vh-120px)]">
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <ConciergeQuickActions onQuickAction={handleQuickAction} />
                ) : (
                  <>
                    {messages.map((message, index) => (
                      <div key={index}>
                        <ConciergeChatMessage message={message} index={index} />
                        {message.role === "assistant" && (
                          <ConciergeActionButtons message={message.content} tripId={id!} />
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            <div className="flex-shrink-0">
              <ConciergeInput 
                input={input}
                setInput={setInput}
                loading={loading}
                onSend={ask}
              />
            </div>
          </div>
        </div>
      </PWALayout>
    </ProtectedRoute>
  );
}