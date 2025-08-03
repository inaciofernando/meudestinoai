import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Plus,
  FileText,
  Download,
  Eye,
  Trash2,
  Upload,
  Shield,
  Ticket,
  CreditCard,
  Plane,
  Hotel,
  FileCheck,
  Calendar,
  Clock
} from "lucide-react";

interface Trip {
  id: string;
  title: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
}

interface Document {
  id: string;
  trip_id: string;
  title: string;
  description?: string;
  category: 'insurance' | 'voucher' | 'ticket' | 'visa' | 'other';
  file_url: string;
  file_name: string;
  file_type: string;
  created_at: string;
  updated_at: string;
}

const DOCUMENT_CATEGORIES = {
  insurance: { 
    name: "Seguro Viagem", 
    icon: Shield, 
    color: "bg-green-500",
    description: "Seguros de viagem, saúde e proteção"
  },
  voucher: { 
    name: "Vouchers", 
    icon: Ticket, 
    color: "bg-purple-500",
    description: "Vouchers de hotel, tours e atividades"
  },
  ticket: { 
    name: "Passagens", 
    icon: Plane, 
    color: "bg-blue-500",
    description: "Passagens aéreas, rodoviárias e ferroviárias"
  },
  visa: { 
    name: "Vistos & Docs", 
    icon: FileCheck, 
    color: "bg-orange-500",
    description: "Vistos, passaportes e documentos oficiais"
  },
  other: { 
    name: "Outros", 
    icon: FileText, 
    color: "bg-gray-500",
    description: "Outros documentos importantes"
  }
};

export default function DocumentosViagem() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof DOCUMENT_CATEGORIES | 'all'>('all');
  const [uploading, setUploading] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);

  // Form states
  const [newDocuments, setNewDocuments] = useState({
    category: "other" as keyof typeof DOCUMENT_CATEGORIES,
    files: [] as File[]
  });

  useEffect(() => {
    if (id && user) {
      fetchTripAndDocuments();
    }
  }, [id, user]);

  const fetchTripAndDocuments = async () => {
    try {
      setLoading(true);

      // Buscar dados da viagem
      const { data: tripData, error: tripError } = await supabase
        .from("trips")
        .select("*")
        .eq("id", id)
        .eq("user_id", user!.id)
        .maybeSingle();

      if (tripError) {
        console.error("Erro ao buscar viagem:", tripError);
        navigate("/viagens");
        return;
      }

      if (!tripData) {
        toast({
          title: "Viagem não encontrada",
          description: "Esta viagem não existe ou você não tem permissão para visualizá-la.",
          variant: "destructive"
        });
        navigate("/viagens");
        return;
      }

      setTrip(tripData);

      // Buscar documentos da viagem
      const { data: documentsData, error: documentsError } = await supabase
        .from("trip_documents")
        .select("*")
        .eq("trip_id", id)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (documentsError) {
        console.error("Erro ao buscar documentos:", documentsError);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os documentos.",
          variant: "destructive"
        });
      } else {
        setDocuments(documentsData as Document[] || []);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user!.id}/${id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('trip-documents')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('trip-documents')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Erro no upload:', error);
      return null;
    }
  };

  const handleAddDocuments = async () => {
    if (newDocuments.files.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um arquivo.",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      const docsToInsert = [];

      for (const file of newDocuments.files) {
        const fileUrl = await uploadDocument(file);
        if (fileUrl) {
          const docData = {
            trip_id: id!,
            user_id: user!.id,
            title: file.name.split('.')[0], // Use filename as default title
            description: "",
            category: newDocuments.category,
            file_url: fileUrl,
            file_name: file.name,
            file_type: file.type
          };
          docsToInsert.push(docData);
        }
      }

      if (docsToInsert.length === 0) {
        toast({
          title: "Erro",
          description: "Falha no upload dos arquivos. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      // Salvar documentos no banco de dados
      const { data: savedDocs, error: insertError } = await supabase
        .from("trip_documents")
        .insert(docsToInsert)
        .select();

      if (insertError) {
        console.error("Erro ao salvar documentos:", insertError);
        toast({
          title: "Erro",
          description: "Não foi possível salvar os documentos. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      // Atualizar lista local
      setDocuments(prev => [...(savedDocs as Document[]), ...prev]);

      toast({
        title: "Documentos adicionados! 📄",
        description: `${savedDocs?.length || 0} documento${(savedDocs?.length || 0) > 1 ? 's' : ''} ${(savedDocs?.length || 0) > 1 ? 'foram salvos' : 'foi salvo'} com sucesso.`,
      });

      // Reset form
      setNewDocuments({
        category: "other",
        files: []
      });
      
      setIsAddingDocument(false);
    } catch (error) {
      console.error("Erro ao adicionar documentos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar os documentos. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (document: Document) => {
    try {
      // Deletar do banco de dados
      const { error: deleteError } = await supabase
        .from("trip_documents")
        .delete()
        .eq("id", document.id)
        .eq("user_id", user!.id);

      if (deleteError) {
        console.error("Erro ao excluir documento:", deleteError);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o documento. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      // Opcional: deletar arquivo do storage também
      const fileName = document.file_url.split('/').pop();
      if (fileName) {
        const filePath = `${user!.id}/${id}/${fileName}`;
        await supabase.storage
          .from('trip-documents')
          .remove([filePath]);
      }

      // Remover do estado local
      setDocuments(prev => prev.filter(doc => doc.id !== document.id));

      toast({
        title: "Documento excluído! 🗑️",
        description: `${document.title} foi removido.`,
      });
    } catch (error) {
      console.error("Erro ao excluir documento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o documento. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const filteredDocuments = selectedCategory === 'all' 
    ? documents 
    : documents.filter(doc => doc.category === selectedCategory);

  const getDocumentsByCategory = (category: keyof typeof DOCUMENT_CATEGORIES) => {
    return documents.filter(doc => doc.category === category);
  };

  if (loading) {
    return (
      <PWALayout>
        <ProtectedRoute>
          <div className="min-h-screen bg-background p-4">
            <div className="max-w-2xl mx-auto">
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-4">Carregando documentos...</p>
              </div>
            </div>
          </div>
        </ProtectedRoute>
      </PWALayout>
    );
  }

  if (!trip) {
    return (
      <PWALayout>
        <ProtectedRoute>
          <div className="min-h-screen bg-background p-4">
            <div className="max-w-2xl mx-auto">
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Viagem não encontrada</h2>
                <p className="text-muted-foreground mb-6">Esta viagem não existe ou você não tem permissão para visualizá-la.</p>
                <Button onClick={() => navigate("/viagens")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar às Viagens
                </Button>
              </div>
            </div>
          </div>
        </ProtectedRoute>
      </PWALayout>
    );
  }

  return (
    <PWALayout>
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg mx-4 mt-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/viagem/${id}`)}
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold">Documentos da Viagem</h1>
                </div>
                <p className="text-muted-foreground">{trip.title} • {trip.destination}</p>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {documents.length} documento{documents.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="px-4 mt-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedCategory === 'all' ? "default" : "outline"}
                onClick={() => setSelectedCategory('all')}
                className="min-w-fit"
              >
                Todos
                <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                  {documents.length}
                </Badge>
              </Button>
              {Object.entries(DOCUMENT_CATEGORIES).map(([key, config]) => {
                const categoryDocs = getDocumentsByCategory(key as keyof typeof DOCUMENT_CATEGORIES);
                return (
                  <Button
                    key={key}
                    variant={selectedCategory === key ? "default" : "outline"}
                    onClick={() => setSelectedCategory(key as keyof typeof DOCUMENT_CATEGORIES)}
                    className="min-w-fit"
                  >
                    {config.name}
                    {categoryDocs.length > 0 && (
                      <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                        {categoryDocs.length}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="px-4 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {selectedCategory === 'all' 
                      ? 'Todos os Documentos' 
                      : DOCUMENT_CATEGORIES[selectedCategory as keyof typeof DOCUMENT_CATEGORIES]?.name
                    }
                  </CardTitle>
                  <Dialog open={isAddingDocument} onOpenChange={setIsAddingDocument}>
                    <DialogTrigger asChild>
                      <Button 
                        size="icon" 
                        className="bg-gradient-ocean hover:shadow-travel transition-all duration-300 rounded-full"
                      >
                        <Plus className="w-5 h-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Adicionar Documento</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Categoria</Label>
                          <select
                            value={newDocuments.category}
                            onChange={(e) => setNewDocuments({...newDocuments, category: e.target.value as keyof typeof DOCUMENT_CATEGORIES})}
                            className="w-full p-2 border rounded-md"
                          >
                            {Object.entries(DOCUMENT_CATEGORIES).map(([key, config]) => (
                              <option key={key} value={key}>{config.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <Label>Arquivos * (múltiplos arquivos)</Label>
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            multiple
                            onChange={(e) => setNewDocuments({...newDocuments, files: Array.from(e.target.files || [])})}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Formatos aceitos: PDF, JPG, PNG, DOC, DOCX. Você pode selecionar múltiplos arquivos.
                          </p>
                          {newDocuments.files.length > 0 && (
                            <div className="mt-2 space-y-1">
                              <p className="text-sm font-medium">Arquivos selecionados:</p>
                              {newDocuments.files.map((file, index) => (
                                <div key={index} className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                  {file.name} ({(file.size / 1024 / 1024).toFixed(1)}MB)
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setIsAddingDocument(false)}
                            className="flex-1"
                            disabled={uploading}
                          >
                            Cancelar
                          </Button>
                          <Button 
                            onClick={handleAddDocuments} 
                            className="flex-1"
                            disabled={uploading || newDocuments.files.length === 0}
                          >
                            {uploading ? (
                              <>
                                <Upload className="w-4 h-4 mr-2 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Adicionar {newDocuments.files.length > 0 ? `(${newDocuments.files.length})` : ''}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {filteredDocuments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum documento encontrado</p>
                    <p className="text-sm">Clique em "+" para adicionar o primeiro documento</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredDocuments.map((document) => {
                      const category = DOCUMENT_CATEGORIES[document.category];
                      const CategoryIcon = category.icon;

                      return (
                        <Card key={document.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              <div className={`w-12 h-12 ${category.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                <CategoryIcon className="w-6 h-6 text-white" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-semibold text-lg truncate pr-2" title={document.title}>
                                        {document.title}
                                      </h4>
                                      <Badge variant="outline" className="text-xs flex-shrink-0">
                                        {category.name}
                                      </Badge>
                                    </div>
                                    
                                    {document.description && (
                                      <p className="text-sm text-muted-foreground mb-2">{document.description}</p>
                                    )}
                                    
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                      <div className="flex items-center gap-1 min-w-0">
                                        <Calendar className="w-3 h-3 flex-shrink-0" />
                                        <span className="whitespace-nowrap">
                                          {new Date(document.created_at).toLocaleDateString('pt-BR')}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1 min-w-0 flex-1">
                                        <FileText className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate" title={document.file_name}>
                                          {document.file_name}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                   <div className="flex gap-1">
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       onClick={() => setViewingDocument(document)}
                                     >
                                       <Eye className="w-4 h-4" />
                                     </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          // Extrair o caminho do arquivo da URL
                                          const urlParts = document.file_url.split('/');
                                          const bucketIndex = urlParts.findIndex(part => part === 'trip-documents');
                                          const filePath = urlParts.slice(bucketIndex + 1).join('/');
                                          
                                          // Baixar o arquivo usando a API do Supabase
                                          const { data, error } = await supabase.storage
                                            .from('trip-documents')
                                            .download(filePath);

                                          if (error) {
                                            console.error('Erro no download:', error);
                                            toast({
                                              title: "Erro no download",
                                              description: "Não foi possível baixar o arquivo. Tente novamente.",
                                              variant: "destructive"
                                            });
                                            return;
                                          }

                                          // Criar URL temporária e fazer download
                                          const url = URL.createObjectURL(data);
                                          const link = window.document.createElement('a');
                                          link.href = url;
                                          link.download = document.file_name;
                                          window.document.body.appendChild(link);
                                          link.click();
                                          window.document.body.removeChild(link);
                                          URL.revokeObjectURL(url);
                                        } catch (error) {
                                          console.error('Erro no download:', error);
                                          toast({
                                            title: "Erro no download",
                                            description: "Não foi possível baixar o arquivo. Tente novamente.",
                                            variant: "destructive"
                                          });
                                        }
                                      }}
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-destructive hover:text-destructive"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Esta ação não pode ser desfeita. O documento "{document.title}" será removido permanentemente.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDeleteDocument(document)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            Excluir
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Modal de Visualização de Documento */}
          {viewingDocument && (
            <Dialog open={!!viewingDocument} onOpenChange={() => setViewingDocument(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                <DialogHeader className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewingDocument(null)}
                        className="rounded-full"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                      <div>
                        <DialogTitle className="text-left">{viewingDocument.title}</DialogTitle>
                        <p className="text-sm text-muted-foreground">{viewingDocument.file_name}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            // Mesmo código de download que já funciona
                            const urlParts = viewingDocument.file_url.split('/');
                            const bucketIndex = urlParts.findIndex(part => part === 'trip-documents');
                            const filePath = urlParts.slice(bucketIndex + 1).join('/');
                            
                            const { data, error } = await supabase.storage
                              .from('trip-documents')
                              .download(filePath);

                            if (error) {
                              console.error('Erro no download:', error);
                              toast({
                                title: "Erro no download",
                                description: "Não foi possível baixar o arquivo. Tente novamente.",
                                variant: "destructive"
                              });
                              return;
                            }

                            const url = URL.createObjectURL(data);
                            const link = window.document.createElement('a');
                            link.href = url;
                            link.download = viewingDocument.file_name;
                            window.document.body.appendChild(link);
                            link.click();
                            window.document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                          } catch (error) {
                            console.error('Erro no download:', error);
                            toast({
                              title: "Erro no download",
                              description: "Não foi possível baixar o arquivo. Tente novamente.",
                              variant: "destructive"
                            });
                          }
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Baixar
                      </Button>
                    </div>
                  </div>
                </DialogHeader>
                <div className="flex-1 p-4">
                  <div className="w-full h-[70vh] bg-muted rounded-lg flex items-center justify-center">
                    {viewingDocument.file_type.startsWith('image/') ? (
                      <img 
                        src={viewingDocument.file_url} 
                        alt={viewingDocument.title}
                        className="max-w-full max-h-full object-contain rounded-lg"
                      />
                    ) : viewingDocument.file_type === 'application/pdf' ? (
                      <iframe 
                        src={viewingDocument.file_url} 
                        className="w-full h-full rounded-lg"
                        title={viewingDocument.title}
                      />
                    ) : (
                      <div className="text-center">
                        <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <p className="text-lg font-medium mb-2">Prévia não disponível</p>
                        <p className="text-muted-foreground mb-4">
                          Tipo de arquivo: {viewingDocument.file_type}
                        </p>
                        <Button
                          onClick={async () => {
                            try {
                              const urlParts = viewingDocument.file_url.split('/');
                              const bucketIndex = urlParts.findIndex(part => part === 'trip-documents');
                              const filePath = urlParts.slice(bucketIndex + 1).join('/');
                              
                              const { data, error } = await supabase.storage
                                .from('trip-documents')
                                .download(filePath);

                              if (error) {
                                console.error('Erro no download:', error);
                                toast({
                                  title: "Erro no download",
                                  description: "Não foi possível baixar o arquivo. Tente novamente.",
                                  variant: "destructive"
                                });
                                return;
                              }

                              const url = URL.createObjectURL(data);
                              const link = window.document.createElement('a');
                              link.href = url;
                              link.download = viewingDocument.file_name;
                              window.document.body.appendChild(link);
                              link.click();
                              window.document.body.removeChild(link);
                              URL.revokeObjectURL(url);
                            } catch (error) {
                              console.error('Erro no download:', error);
                              toast({
                                title: "Erro no download",
                                description: "Não foi possível baixar o arquivo. Tente novamente.",
                                variant: "destructive"
                              });
                            }
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Baixar Arquivo
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </ProtectedRoute>
    </PWALayout>
  );
}