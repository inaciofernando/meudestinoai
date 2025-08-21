import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PWALayout } from "@/components/layout/PWALayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bot, MapPin, Calendar, Plus, Mic, ArrowUp, Loader2, User, ArrowLeft, RotateCcw, Clock, Trash2, UtensilsCrossed, MapPinPlus, MoreVertical } from "lucide-react";

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
    console.log("🔍 Starting restaurant extraction from message:", message.slice(0, 300));
    
    const lines = message.split('\n').map(l => l.trim()).filter(Boolean);
    const text = message.replace(/\*\*/g, '');
    const results: any[] = [];

    // Helper: normaliza links do Google Maps, evitando encurtadores
    const buildGMap = (raw: string, name: string, address: string) => {
      const query = [name, address].filter(Boolean).join(' ').trim();
      const queryUrl = query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : '';
      if (!raw) return queryUrl;
      if (/maps\.app\.goo\.gl|goo\.gl\/maps/i.test(raw)) return queryUrl || raw;
      return raw;
    };

    // 0) Tentar extrair bloco JSON padronizado do Concierge
    try {
      const jsonBlock = message.match(/```json\s*([\s\S]*?)```/i);
      if (jsonBlock && jsonBlock[1]) {
        const parsed = JSON.parse(jsonBlock[1]);
        const r = parsed?.restaurant || parsed?.restaurante;
        if (r) {
          const name = r.name || r.nome || '';
          const address = r.address || r.endereco || '';
          const mapped = {
            name,
            description: r.description || r.observacoes || r.notes || '',
            cuisine: r.cuisine || r.cuisine_type || r.tipo_culinaria || '',
            address,
            link: r.link || r.site || '',
            tripadvisor: (r.tripadvisor || r.tripadvisor_link || '').toString().trim(),
            gmap: buildGMap(r.gmap || r.google_maps || r.google_maps_link || '', name, address),
            waze: r.waze || r.waze_link || '',
            estimated_amount: String(r.estimated_amount || r.preco_estimado || '')
          } as any;
          results.push(mapped);
          console.log('✅ Parsed restaurant JSON from concierge:', mapped);
          return results;
        }
      }
    } catch (e) {
      console.warn('JSON parse failed:', e);
    }

    // Estratégia mais ampla para capturar nomes de restaurantes
    let name = '';
    
    // 1) Nome pelo padrão "sugiro/recomendo"
    const nameMatch = text.match(/(?:sugir[oa]|recomend[ao])\s+(?:o|a)?\s*([A-Z][A-Za-z0-9'\-\s]+?)(?=[\.,\n])/i);
    if (nameMatch) name = nameMatch[1]?.trim();

    // 2) Procurar por linhas que parecem títulos de restaurante (com **texto**)
    if (!name) {
      const boldMatch = text.match(/\*\*([A-Z][A-Za-z0-9'\-\s]+?)\*\*/);
      if (boldMatch) name = boldMatch[1]?.trim();
    }

    // 3) Procurar por qualquer linha capitalizada que pareça nome de restaurante
    if (!name) {
      const titleLine = lines.find(l => 
        !l.startsWith('-') && 
        !l.startsWith('*') && 
        !/:/.test(l) && 
        /^[A-Z].{3,50}$/.test(l) &&
        !l.includes('?') && 
        !l.includes('!')
      );
      if (titleLine) name = titleLine;
    }

    // Campos com detecção mais flexível
    const cuisinePatterns = [
      /(?:Culinária|Tipo de culinária|Cozinha|Especialidade|Tipo)\s*:\s*([^\n]+)/i,
      /Cozinha\s+([A-Za-z]+)/i,
      /(italiana|japonesa|brasileira|mexicana|chinesa|francesa|tailandesa|indiana|árabe)/i
    ];
    
    let cuisine = '';
    for (const pattern of cuisinePatterns) {
      const match = text.match(pattern);
      if (match) {
        cuisine = match[1]?.trim();
        break;
      }
    }

    const addressMatch = text.match(/(?:Localização|Endereço|Local|Onde)\s*:\s*([^\n]+)/i);
    
    // Links com detecção mais ampla
    const restaurantLinkMatch = text.match(/(?:Site|Website|Link)\s*:\s*\[?link\]?\(?(https?:\/\/[^\s\n)]+)/i);
    const tripadvisorMatch = text.match(/(?:TripAdvisor|Tripadvisor)\s*:\s*\[?link\]?\(?(https?:\/\/[^\s\n)]+)/i);
    const googleMapsMatch = text.match(/(?:Google Maps|Maps)\s*:\s*\[?link\]?\(?(https?:\/\/[^\s\n)]+)/i);
    const wazeMatch = text.match(/(?:Waze)\s*:\s*\[?link\]?\(?(https?:\/\/[^\s\n)]+)/i);
    
    // Debug: log do texto para ver o formato exato
    console.log("🔍 DEBUG - Texto completo da mensagem:", text);
    console.log("🔍 DEBUG - Links encontrados:", {
      restaurant: restaurantLinkMatch,
      tripadvisor: tripadvisorMatch,
      googleMaps: googleMapsMatch,
      waze: wazeMatch
    });
    
    // Qualquer link como fallback
    const anyLinkMatch = text.match(/(https?:\/\/[^\s)]+)/i);

    // Preço
    const priceNums = Array.from(text.matchAll(/(?:US?\$|R\$)\s*([0-9]+(?:[\.,][0-9]{2})?)/gi))
      .map(m => parseFloat(m[1].replace(',', '.')));
    let estimated = '';
    if (priceNums.length >= 1) {
      const avg = priceNums.reduce((a, b) => a + b, 0) / priceNums.length;
      estimated = String(Math.round(avg));
    }

    // Descrição/notas
    const descriptionParts: string[] = [];
    lines.forEach(l => {
      if (/Por que|Dicas|Observações|conhecido por|famoso por/i.test(l) || 
          l.startsWith('•') || l.startsWith('-')) {
        descriptionParts.push(l.replace(/^[-•]\s*/, ''));
      }
    });
    const description = descriptionParts.join(' ') || 'Sugerido pelo concierge';

    console.log("🔍 Extraction results:", {
      name,
      cuisine,
      address: addressMatch?.[1]?.trim(),
      description,
      links: {
        restaurant: restaurantLinkMatch?.[1],
        tripadvisor: tripadvisorMatch?.[1], 
        googleMaps: googleMapsMatch?.[1],
        waze: wazeMatch?.[1],
        any: anyLinkMatch?.[1]
      }
    });

    // Se encontrou pelo menos um nome, criar o resultado
    if (name && name.length > 2) {
      const addressText = addressMatch?.[1]?.trim() || '';
      const normalizedGMap = buildGMap(googleMapsMatch?.[1] || '', name, addressText);
      results.push({
        name,
        description,
        cuisine,
        address: addressText,
        link: restaurantLinkMatch?.[1] || anyLinkMatch?.[1] || '',
        tripadvisor: (tripadvisorMatch?.[1] || '').trim(),
        gmap: normalizedGMap,
        waze: wazeMatch?.[1] || '',
        estimated_amount: estimated
      });
    }

    console.log('🍽️ Final extracted restaurants:', results);
    return results;
  };

  const extractAttractionInfo = () => {
    const text = message.replace(/\*\*/g, '');
    const lines = message.split('\n');
    const attractions: any[] = [];

    // 0) Tentar extrair do bloco JSON padronizado
    try {
      const jsonBlock = message.match(/```json\s*([\s\S]*?)```/i);
      if (jsonBlock && jsonBlock[1]) {
        const parsed = JSON.parse(jsonBlock[1]);
        const it = parsed?.itinerary_item;
        if (it) {
          attractions.push({
            name: it.title || '',
            description: it.description || '',
            category: it.category || 'attraction',
            location: it.location || ''
          });
        }
      }
    } catch (e) {
      console.warn('Itinerary JSON parse failed:', e);
    }

    // Heurística adicional pelo texto
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('**') && (containsAttraction || /vinícola|atração|museu|parque/i.test(line))) {
        const name = line.replace(/\*\*/g, '').replace(/^\d+\.?\s*/, '').trim();
        if (name.length > 3) {
          attractions.push({
            name: name.split(' - ')[0].split(':')[0].trim(),
            description: lines[i + 1]?.trim() || '',
            category: 'attraction',
            location: ''
          });
        }
      }
    }
    return attractions;
  };

  const handleAddRestaurant = (restaurant: any) => {
    console.log("🚀 Preparing to navigate to restaurant form with data:", restaurant);
    
    // Navegar para página de restaurantes com dados pré-preenchidos
    const params = new URLSearchParams();
    params.set('name', restaurant.name || '');
    params.set('description', restaurant.description || '');
    params.set('cuisine', restaurant.cuisine || '');
    params.set('address', restaurant.address || '');
    params.set('link', (restaurant.link || '').trim());
    params.set('tripadvisor', (restaurant.tripadvisor || '').trim());
    params.set('gmap', (restaurant.gmap || '').trim());
    params.set('waze', (restaurant.waze || '').trim());
    params.set('estimated_amount', restaurant.estimated_amount || '');
    params.set('fromConcierge', 'true');
    // Fallback: enviar um trecho da mensagem para parsing no destino
    params.set('source', message.slice(0, 1500));
    
    const finalUrl = `/viagem/${tripId}/restaurantes/novo?${params.toString()}`;
    console.log("🚀 Final URL:", finalUrl);
    navigate(finalUrl);
  };

  const handleAddAttraction = (attraction: any) => {
    // Navegar para página de roteiro com dados pré-preenchidos
    const params = new URLSearchParams({
      title: attraction.name,
      description: attraction.description || '',
      category: attraction.category || 'attraction',
      fromConcierge: 'true'
    });
    if (attraction.location) params.set('location', attraction.location);
    navigate(`/viagem/${tripId}/roteiro?${params.toString()}`);
  };

  const restaurants = extractRestaurantInfo();
  const attractions = extractAttractionInfo();

  console.log("🔍 Message analysis:", { 
    messageLength: message.length, 
    containsRestaurant, 
    containsAttraction,
    extractedRestaurants: restaurants,
    extractedAttractions: attractions,
    messagePreview: message.slice(0, 200) + "..."
  });

  // Sempre mostrar os botões de ação rápida para melhor UX
  // if (!containsRestaurant && !containsAttraction) {
  //   console.log("❌ No quick actions detected");
  //   return null;
  // }

  // Sempre mostrar apenas uma opção para restaurante e uma para roteiro
  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {/* Escolha única de ação: Salvar como Restaurante ou Roteiro */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className="h-8 px-3 text-xs gap-1">
              Salvar como
              <MoreVertical className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={8} className="w-56 z-50 bg-background border shadow-lg">
            <DropdownMenuItem
              onClick={() => {
                if (restaurants.length > 0) {
                  handleAddRestaurant(restaurants[0]);
                } else {
                  const params = new URLSearchParams({ fromConcierge: 'true' });
                  navigate(`/viagem/${tripId}/restaurantes/novo?${params.toString()}`);
                }
              }}
              className="cursor-pointer"
            >
              <UtensilsCrossed className="w-4 h-4 mr-2" />
              {`Restaurante${restaurants.length > 0 && restaurants[0].name ? ` – ${restaurants[0].name}` : ''}`}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (attractions.length > 0) {
                  handleAddAttraction(attractions[0]);
                } else {
                  const params = new URLSearchParams({ fromConcierge: 'true' });
                  navigate(`/viagem/${tripId}/roteiro?${params.toString()}`);
                }
              }}
              className="cursor-pointer"
            >
              <MapPinPlus className="w-4 h-4 mr-2" />
              {`Roteiro${attractions.length > 0 && (attractions[0].name || attractions[0].title || attractions[0].location) ? ` – ${(
                attractions[0].name || attractions[0].title || attractions[0].location
              )}` : ''}`}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function Concierge() {
  // Helper: extrai o bloco JSON (mantém no conteúdo, mas ocultamos na renderização)
  const parseConciergeJson = (message: string): any | null => {
    const match = message.match(/```json\s*([\s\S]*?)```/i);
    if (!match) return null;
    try {
      return JSON.parse(match[1]);
    } catch {
      return null;
    }
  };

  // Helper: garante protocolo nos links
  const sanitizeUrl = (url?: string) => {
    const u = (url || "").trim();
    if (!u) return "";
    if (!/^https?:\/\//i.test(u)) return `https://${u}`;
    return u;
  };

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

  // Textarea auto-size like ChatGPT
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, 320); // ~max-h-80
    el.style.height = next + "px";
  };
  useEffect(() => { autoResize(); }, [input]);

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

  async function ask(promptOverride?: string) {
    const finalPrompt = (promptOverride ?? input).trim();
    if (!finalPrompt) return;
    setLoading(true);
    const userMessage: Message = { role: "user", content: finalPrompt };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      const minimalCtx = trip
        ? { id: trip.id, title: trip.title, destination: trip.destination ?? "", start_date: trip.start_date ?? "", end_date: trip.end_date ?? "" }
        : (id ? { id } : {});
      const reqBody = { prompt: finalPrompt, tripId: id ?? "", tripContext: minimalCtx };
      console.log("🛰️ Concierge invoke body:", reqBody);
      const { data, error } = await supabase.functions.invoke("concierge-agent", { body: reqBody });

      if (error) {
        console.error("❌ Concierge invoke error:", error);
        throw new Error(error.message || "Falha ao consultar o Concierge");
      }

      console.log("✅ Concierge response:", data);
      const payload: any = data || {};
      const reply: string = payload.generatedText || payload.text || payload.result || "Sem resposta.";
      const finalMessages: Message[] = [...newMessages, { role: "assistant" as const, content: reply }];
      setMessages(finalMessages);
      
      // Save conversation automatically
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
  }

  const quickActions = [
    { 
      icon: UtensilsCrossed, 
      title: "Restaurantes", 
      description: "Onde comer bem",
      query: "Quais são os melhores restaurantes locais que você recomenda para minha viagem?"
    },
    { 
      icon: MapPinPlus, 
      title: "Atrações", 
      description: "O que visitar",
      query: "Quais são as principais atrações turísticas que devo conhecer no meu destino?"
    },
    { 
      icon: MapPin, 
      title: "Transporte", 
      description: "Como se locomover",
      query: "Qual a melhor forma de me locomover durante minha viagem? Transporte público, uber ou aluguel de carro?"
    },
    { 
      icon: Calendar, 
      title: "Roteiro", 
      description: "Planeje seus dias",
      query: "Pode me sugerir um roteiro detalhado para os dias da minha viagem?"
    }
  ];

  const handleQuickAction = (query: string) => {
    setInput(query);
    ask(query);
  };

  return (
    <ProtectedRoute>
      <PWALayout showHeader={false} showFooter={false}>
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between px-4 py-3">
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
              <div>
                <h1 className="text-xl font-semibold">Concierge</h1>
                <p className="text-xs text-muted-foreground">Seu assistente de viagem</p>
                {/* Contexto compacto no header */}
                <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground overflow-x-auto no-scrollbar">
                  <span className="inline-flex items-center gap-1 bg-muted/60 rounded-full px-2 py-0.5 whitespace-nowrap">
                    <MapPin className="w-3.5 h-3.5" /> {trip?.destination ?? "Destino não informado"}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-muted/60 rounded-full px-2 py-0.5 whitespace-nowrap">
                    <Calendar className="w-3.5 h-3.5" /> {(trip?.start_date ?? "ND")} — {(trip?.end_date ?? "ND")}
                  </span>
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  aria-label="Menu"
                >
                  <MoreVertical className="h-5 w-5" />
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

        <main className="px-4">
          {/* Contexto movido para o header para economizar espaço */}

          <section className="flex flex-col h-[calc(100vh-12rem)]">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
              {messages.length === 0 ? (
                <div className="space-y-6 px-2">
                  {/* Hero Section */}
                  <div className="text-center py-8">
                    <div className="mb-6">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Bot className="w-8 h-8 text-primary" />
                      </div>
                      <h2 className="text-2xl font-semibold mb-2">Como posso ajudar?</h2>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Sou seu concierge pessoal. Posso ajudá-lo com recomendações, roteiros e tudo sobre sua viagem.
                      </p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-center">Escolhas Rápidas</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {quickActions.map((action, index) => {
                        const Icon = action.icon;
                        return (
                          <Card 
                            key={index}
                            className="p-4 cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] border-primary/20 hover:border-primary/40"
                            onClick={() => handleQuickAction(action.query)}
                          >
                            <div className="flex flex-col items-center text-center space-y-3">
                              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Icon className="w-6 h-6 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-medium text-sm">{action.title}</h4>
                                <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  {/* Additional Suggestions */}
                  <div className="space-y-3 mt-8">
                    <p className="text-sm text-muted-foreground text-center">Ou pergunte algo específico:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[
                        "Melhor época para visitar?",
                        "Dicas de segurança",
                        "Quanto levar em dinheiro?",
                        "Documentos necessários"
                      ].map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 px-3 rounded-full hover:bg-primary/5"
                          onClick={() => handleQuickAction(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
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
                                code: ({ inline, className, children, ...props }: any) => {
                                  const lang = /language-(\w+)/.exec(className || '')?.[1];
                                  // Oculta blocos de código JSON (continua existindo no conteúdo para parsing)
                                  if (!inline && lang === 'json') return null;
                                  return (
                                    <code className={className} {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                              }}
                            >
                              {m.content}
                            </ReactMarkdown>

                            {(() => {
                              const parsed = parseConciergeJson(m.content);
                              const r = parsed?.restaurant;
                              const it = parsed?.itinerary_item;
                              if (!r && !it) return null;
                              return (
                                <div className="mt-2 pt-2 border-t text-sm space-y-3">
                                  {r ? (
                                    <div>
                                      <div className="font-semibold mb-1">Resumo do restaurante</div>
                                      <ul className="list-disc pl-5 space-y-1">
                                        <li><span className="font-medium">{r.name || ''}</span>{r.cuisine ? ` • ${r.cuisine}` : ''}</li>
                                        {r.address ? <li>{r.address}</li> : null}
                                        {r.estimated_amount ? <li>Custo estimado: {r.estimated_amount}</li> : null}
                                      </ul>
                                      <div className="flex flex-wrap gap-2 mt-2">
                                        {r.link ? (
                                          <a href={sanitizeUrl(r.link)} target="_blank" rel="noopener noreferrer" className="underline text-primary">Site</a>
                                        ) : null}
                                        {r.tripadvisor ? (
                                          <a href={sanitizeUrl(r.tripadvisor)} target="_blank" rel="noopener noreferrer" className="underline text-primary">Tripadvisor</a>
                                        ) : null}
                                        {r.gmap ? (
                                          <a href={sanitizeUrl(r.gmap)} target="_blank" rel="noopener noreferrer" className="underline text-primary">Google Maps</a>
                                        ) : null}
                                        {r.waze ? (
                                          <a href={sanitizeUrl(r.waze)} target="_blank" rel="noopener noreferrer" className="underline text-primary">Waze</a>
                                        ) : null}
                                      </div>
                                    </div>
                                  ) : null}

                                  {it ? (
                                    <div>
                                      <div className="font-semibold mb-1">Resumo do roteiro</div>
                                      <ul className="list-disc pl-5 space-y-1">
                                        <li><span className="font-medium">{it.title || ''}</span>{it.category ? ` • ${it.category}` : ''}</li>
                                        {it.location ? <li>{it.location}</li> : null}
                                        {it.description ? <li>{it.description}</li> : null}
                                      </ul>
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })()}

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
            <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t pt-4 px-4">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <div className="relative rounded-2xl border bg-muted/30 shadow-sm px-4 pt-2 pb-12">
                    <Textarea
                      ref={textareaRef}
                      rows={1}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onInput={autoResize}
                      placeholder="Digite sua pergunta sobre a viagem..."
                      className="min-h-14 max-h-40 w-full bg-transparent border-0 shadow-none resize-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          ask();
                        }
                      }}
                    />

                    <div className="absolute left-2 bottom-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full"
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
                    <div className="absolute right-2 bottom-2 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full"
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
                      <Button
                        onClick={() => ask()}
                        disabled={loading || !input.trim()}
                        size="sm"
                        aria-label="Enviar mensagem"
                        className="h-9 rounded-full"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <span className="sr-only sm:not-sr-only sm:mr-1">Enviar</span>
                            <ArrowUp className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

              </div>
              <div className="pb-4" />
            </div>
          </section>
        </main>
      </PWALayout>
    </ProtectedRoute>
  );
}
