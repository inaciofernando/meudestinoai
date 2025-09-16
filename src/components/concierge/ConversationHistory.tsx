import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Plus, Trash2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ConversationData } from "@/hooks/useConciergeConversations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConversationHistoryProps {
  conversations: ConversationData[];
  currentConversationId: string | null;
  onNewConversation: () => void;
  onLoadConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  onDeleteAllConversations: () => void;
  loading?: boolean;
}

export const ConversationHistory = ({
  conversations,
  currentConversationId,
  onNewConversation,
  onLoadConversation,
  onDeleteConversation,
  onDeleteAllConversations,
  loading = false
}: ConversationHistoryProps) => {
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  const handleDeleteClick = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (conversationToDelete) {
      onDeleteConversation(conversationToDelete);
      setConversationToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleLoadConversation = (conversationId: string) => {
    onLoadConversation(conversationId);
    setOpen(false);
  };

  const handleNewConversation = () => {
    onNewConversation();
    setOpen(false);
  };

  const handleDeleteAllClick = () => {
    setDeleteAllDialogOpen(true);
  };

  const handleConfirmDeleteAll = () => {
    onDeleteAllConversations();
    setDeleteAllDialogOpen(false);
    setOpen(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <MessageSquare className="w-4 h-4" />
            {conversations.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {conversations.length}
              </span>
            )}
          </Button>
        </SheetTrigger>
        
        <SheetContent side="left" className="w-80">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Conversas
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-4">
            {/* Botões de Ação */}
            <div className="space-y-2">
              <Button 
                onClick={handleNewConversation}
                className="w-full gap-2"
                variant="outline"
              >
                <Plus className="w-4 h-4" />
                Nova Conversa
              </Button>
              
              {conversations.length > 0 && (
                <Button 
                  onClick={handleDeleteAllClick}
                  className="w-full gap-2"
                  variant="outline"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir Todas ({conversations.length})
                </Button>
              )}
            </div>

            {/* Lista de Conversas */}
            <ScrollArea className="flex-1 h-[calc(100vh-200px)]">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma conversa ainda</p>
                  <p className="text-xs mt-1">Clique em "Nova Conversa" para começar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`relative group p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                        currentConversationId === conversation.id 
                          ? 'bg-primary/10 border-primary' 
                          : 'border-border'
                      }`}
                      onClick={() => handleLoadConversation(conversation.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">
                            {conversation.title}
                          </h4>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(conversation.updated_at), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {Array.isArray(conversation.messages) 
              ? (conversation.messages as any[]).length 
              : 0} mensagens
          </p>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={(e) => handleDeleteClick(conversation.id, e)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog de Confirmação de Exclusão Individual */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Conversa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta conversa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Confirmação de Exclusão de Todas */}
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Todas as Conversas</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir todas as {conversations.length} conversas desta viagem? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteAll} className="bg-destructive hover:bg-destructive/90">
              Excluir Todas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};