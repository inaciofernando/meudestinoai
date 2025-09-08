import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TripSectionHeader from "@/components/TripSectionHeader";
import { AddDocumentDialog } from "@/components/AddDocumentDialog";
import { EditDocumentDialog } from "@/components/EditDocumentDialog";
import { DocumentPreview } from "@/components/DocumentPreview";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Eye,
  Edit,
  Trash2,
  Download,
  FileCheck,
  Shield,
  CreditCard,
  IdCard
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export interface TripDocument {
  id: string;
  trip_id: string;
  user_id: string;
  title: string;
  description?: string;
  category: string;
  file_name: string;
  file_url: string;
  file_type: string;
  created_at: string;
  updated_at: string;
}

const DOCUMENT_CATEGORIES = {
  passport: { name: "Passaporte", icon: IdCard, color: "bg-red-500" },
  visa: { name: "Visto", icon: FileCheck, color: "bg-blue-500" },
  insurance: { name: "Seguro Viagem", icon: Shield, color: "bg-green-500" },
  ticket: { name: "Ticket/Bilhete", icon: FileText, color: "bg-purple-500" },
  voucher: { name: "Voucher", icon: CreditCard, color: "bg-orange-500" },
  hotel: { name: "Hotel", icon: FileText, color: "bg-pink-500" },
  car_rental: { name: "Aluguel de Carro", icon: FileText, color: "bg-yellow-500" },
  other: { name: "Outros", icon: FileText, color: "bg-gray-500" }
};

export default function Documentos() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [documents, setDocuments] = useState<TripDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<TripDocument | null>(null);
  const [previewFile, setPreviewFile] = useState<{url: string, name: string, type?: string} | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [id, user]);

  const fetchDocuments = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from("trip_documents")
        .select("*")
        .eq("trip_id", id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar documentos:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os documentos",
          variant: "destructive",
        });
        return;
      }

      setDocuments(data || []);
    } catch (error) {
      console.error("Erro ao buscar documentos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDocument = (newDocument: TripDocument) => {
    setDocuments(prev => [newDocument, ...prev]);
    setIsAddDialogOpen(false);
  };

  const handleUpdateDocument = (updatedDocument: TripDocument) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === updatedDocument.id ? updatedDocument : doc
      )
    );
    setIsEditDialogOpen(false);
    setEditingDocument(null);
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("trip_documents")
        .delete()
        .eq("id", documentId)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      toast({
        title: "Sucesso!",
        description: "Documento excluído com sucesso",
      });
    } catch (error) {
      console.error("Erro ao excluir documento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o documento",
        variant: "destructive",
      });
    }
  };

  const getCategoryConfig = (category: string) => {
    return DOCUMENT_CATEGORIES[category as keyof typeof DOCUMENT_CATEGORIES] || DOCUMENT_CATEGORIES.other;
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <PWALayout showHeader={true}>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Carregando documentos...</p>
            </div>
          </div>
        </PWALayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PWALayout showHeader={true}>
        <div className="container mx-auto p-4 space-y-6">
          <TripSectionHeader
            title="Documentos"
            subtitle="Gerencie seus documentos de viagem"
            onBack={() => navigate(`/viagem/${id}`)}
            onAdd={() => setIsAddDialogOpen(true)}
            addAriaLabel="Adicionar documento"
          />

          {documents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 rounded-full bg-primary/10 mb-6">
                  <FileText className="h-16 w-16 text-primary" />
                </div>
                <h3 className="font-semibold text-xl mb-3">Nenhum documento cadastrado</h3>
                <p className="text-muted-foreground text-center mb-8 max-w-md">
                  Adicione seus documentos de viagem como passaporte, seguro, vouchers e tickets para manter tudo organizado.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={() => setIsAddDialogOpen(true)}
                    size="lg"
                    className="px-8"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Adicionar Primeiro Documento
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {documents.map((document) => {
                const categoryConfig = getCategoryConfig(document.category);
                const IconComponent = categoryConfig.icon;
                
                return (
                  <Card key={document.id} className="hover:shadow-md transition-smooth">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${categoryConfig.color} text-white flex-shrink-0`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base leading-tight truncate">
                                {document.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                  {categoryConfig.name}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(parseISO(document.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setPreviewFile({
                                  url: document.file_url,
                                  name: document.file_name,
                                  type: document.file_type
                                })}
                                title="Visualizar documento"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleDownload(document.file_url, document.file_name)}
                                title="Fazer download"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setEditingDocument(document);
                                  setIsEditDialogOpen(true);
                                }}
                                title="Editar documento"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" 
                                    title="Excluir documento"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteDocument(document.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                          
                          {document.description && (
                            <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                              {document.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Document Preview Modal */}
          {previewFile && (
            <DocumentPreview
              isOpen={!!previewFile}
              onClose={() => setPreviewFile(null)}
              fileUrl={previewFile.url}
              fileName={previewFile.name}
              fileType={previewFile.type}
            />
          )}

          {/* Add Document Dialog */}
          <AddDocumentDialog
            isOpen={isAddDialogOpen}
            onClose={() => setIsAddDialogOpen(false)}
            onAdd={handleAddDocument}
            tripId={id!}
          />

          {/* Edit Document Dialog */}
          {editingDocument && (
            <EditDocumentDialog
              isOpen={isEditDialogOpen}
              onClose={() => {
                setIsEditDialogOpen(false);
                setEditingDocument(null);
              }}
              onUpdate={handleUpdateDocument}
              document={editingDocument}
            />
          )}
        </div>
      </PWALayout>
    </ProtectedRoute>
  );
}