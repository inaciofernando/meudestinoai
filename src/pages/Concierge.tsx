import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ConciergeChat } from "@/components/concierge/ConciergeChat";
import { ConversationHistory } from "@/components/concierge/ConversationHistory";
import { Button } from "@/components/ui/button";
import { TripData, UserData, ConciergeCategory } from "@/types/concierge";
import { Bot, ArrowLeft, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useConciergeConversations } from "@/hooks/useConciergeConversations";

export default function Concierge() {
  const { id: tripId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentConversation, setCurrentConversation] = useState<any>(null);

  const {
    conversations,
    loading: conversationsLoading,
    currentConversationId,
    createNewConversation,
    updateConversation,
    loadConversation,
    deleteConversation
  } = useConciergeConversations(tripId || '');

  const userData: UserData = {
    id: user?.id || "",
    preferences: {}
  };

  const handleNewConversation = useCallback(async () => {
    if (!tripData) return;
    
    const conversation = await createNewConversation(`Conversa - ${tripData.destination}`);
    if (conversation) {
      setCurrentConversation(conversation);
      toast({
        title: "Nova conversa criada",
        description: "Você pode começar a conversar com o concierge.",
      });
    }
  }, [tripData, createNewConversation, toast]);

  const handleLoadConversation = useCallback(async (conversationId: string) => {
    const conversation = await loadConversation(conversationId);
    if (conversation) {
      setCurrentConversation(conversation);
      toast({
        title: "Conversa carregada",
        description: "Continuando a conversa anterior.",
      });
    }
  }, [loadConversation, toast]);

  const handleDeleteConversation = useCallback(async (conversationId: string) => {
    await deleteConversation(conversationId);
    if (currentConversationId === conversationId) {
      setCurrentConversation(null);
    }
    toast({
      title: "Conversa excluída",
      description: "A conversa foi removida permanentemente.",
    });
  }, [deleteConversation, currentConversationId, toast]);

  useEffect(() => {
    if (tripId && user) {
      fetchTripData();
    }
  }, [tripId, user]);

  // Auto-criar primeira conversa se não existir nenhuma
  useEffect(() => {
    if (tripData && conversations.length === 0 && !conversationsLoading && !currentConversation) {
      handleNewConversation();
    }
  }, [tripData, conversations.length, conversationsLoading, currentConversation, handleNewConversation]);

  const fetchTripData = async () => {
    try {
      const { data: trip, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Erro ao buscar viagem:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados da viagem.",
          variant: "destructive"
        });
        return;
      }

      if (trip) {
        const startDate = new Date(trip.start_date);
        const endDate = new Date(trip.end_date);
        const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        setTripData({
          id: trip.id,
          destination: trip.destination || trip.title || 'Destino não definido',
          startDate: trip.start_date,
          endDate: trip.end_date,
          durationDays: durationDays,
          destinations: [trip.destination].filter(Boolean),
          budgetRange: 'Não definido',
          travelerCount: 1, // Default value since this field doesn't exist in DB
          status: trip.status || 'Planejamento'
        });
      }
    } catch (error) {
      console.error('Erro ao buscar dados da viagem:', error);
      toast({
        title: "Erro",
        description: "Erro interno. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  const handleSaveToTrip = (data: any) => {
    toast({
      title: "Sucesso!",
      description: "Sugestão salva na sua programação de viagem.",
    });
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <PWALayout title="Concierge AI" subtitle="Carregando...">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Bot className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground">Carregando dados da viagem...</p>
            </div>
          </div>
        </PWALayout>
      </ProtectedRoute>
    );
  }

  if (!tripData) {
    return (
      <ProtectedRoute>
        <PWALayout title="Concierge AI" subtitle="Viagem não encontrada">
          <div className="text-center space-y-4">
            <Bot className="w-12 h-12 text-muted-foreground mx-auto" />
            <div>
              <h1 className="text-xl font-semibold mb-2">Viagem não encontrada</h1>
              <p className="text-muted-foreground mb-4">
                Não foi possível encontrar os dados desta viagem.
              </p>
              <Link to="/minhas-viagens">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para Minhas Viagens
                </Button>
              </Link>
            </div>
          </div>
        </PWALayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PWALayout 
        title="Concierge AI"
        subtitle={tripData?.destination}
        onBack={() => window.history.back()}
        showFooter={false}
        actions={
          <div className="flex items-center gap-2">
            <ConversationHistory
              conversations={conversations}
              currentConversationId={currentConversationId}
              onNewConversation={handleNewConversation}
              onLoadConversation={handleLoadConversation}
              onDeleteConversation={handleDeleteConversation}
              loading={conversationsLoading}
            />
            {/* Só mostra o botão + se tem mensagens na conversa atual */}
            {currentConversation && Array.isArray(currentConversation.messages) && 
             (currentConversation.messages as any[]).length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleNewConversation}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Nova
              </Button>
            )}
          </div>
        }
      >
        <div className="relative min-h-full bg-background">
          {/* Background luggage icon */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <div className="w-64 h-64 bg-current opacity-20 rounded-lg flex items-center justify-center">
              <svg className="w-32 h-32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
                <rect x="3" y="8" width="18" height="12" rx="2" ry="2"/>
                <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <circle cx="8" cy="14" r="1.5"/>
                <circle cx="16" cy="14" r="1.5"/>
              </svg>
            </div>
          </div>
          
          <ConciergeChat
            category={'diversos'}
            tripData={tripData}
            userData={userData}
            onClose={() => window.history.back()}
            onSaveToTrip={handleSaveToTrip}
            fullscreen={true}
            conversation={currentConversation}
            onUpdateConversation={updateConversation}
          />
        </div>
      </PWALayout>
    </ProtectedRoute>
  );
}