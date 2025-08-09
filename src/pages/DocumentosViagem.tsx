import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DocumentCard } from "@/components/DocumentCard";
import { DocumentViewer } from "@/components/DocumentViewer";
import { AddDocumentDialog } from "@/components/AddDocumentDialog";
import { EditDocumentDialog } from "@/components/EditDocumentDialog";
import { DocumentStats } from "@/components/DocumentStats";
import {
  ArrowLeft,
  Plus,
  Search,
  FileText,
  Shield,
  Ticket,
  Plane,
  FileCheck,
  Filter,
  Grid,
  List,
  Upload
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
    color: "bg-emerald-500",
    description: "Seguros de viagem, saúde e proteção",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200"
  },
  voucher: { 
    name: "Vouchers", 
    icon: Ticket, 
    color: "bg-purple-500",
    description: "Vouchers de hotel, tours e atividades",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200"
  },
  ticket: { 
    name: "Passagens", 
    icon: Plane, 
    color: "bg-blue-500",
    description: "Passagens aéreas, rodoviárias e ferroviárias",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200"
  },
  visa: { 
    name: "Vistos & Docs", 
    icon: FileCheck, 
    color: "bg-orange-500",
    description: "Vistos, passaportes e documentos oficiais",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200"
  },
  other: { 
    name: "Outros", 
    icon: FileText, 
    color: "bg-gray-500",
    description: "Outros documentos importantes",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200"
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
  const [uploading, setUploading] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [saving, setSaving] = useState(false);

  // UI States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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

  const fetchTripAndDocuments = useCallback(async () => {
    if (!id || !user) return;
    
    try {
      setLoading(true);

      const [tripResult, documentsResult] = await Promise.all([
        supabase
          .from("trips")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("trip_documents")
          .select("*")
          .eq("trip_id", id)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
      ]);

      if (tripResult.error) {
        console.error("Erro ao buscar viagem:", tripResult.error);
        navigate("/viagens");
        return;
      }

      if (!tripResult.data) {
        toast({
          title: "Viagem não encontrada",
          description: "Esta viagem não existe ou você não tem permissão para visualizá-la.",
          variant: "destructive"
        });
        navigate("/viagens");
        return;
      }

      setTrip(tripResult.data);

      if (documentsResult.error) {
        console.error("Erro ao buscar documentos:", documentsResult.error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os documentos.",
          variant: "destructive"
        });
      } else {
        setDocuments(documentsResult.data as Document[] || []);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }, [id, user, navigate, toast]);

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
            title: file.name.split('.')[0],
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

      setDocuments(prev => [...(savedDocs as Document[]), ...prev]);

      toast({
        title: "Documentos adicionados! 📄",
        description: `${savedDocs?.length || 0} documento${(savedDocs?.length || 0) > 1 ? 's' : ''} ${(savedDocs?.length || 0) > 1 ? 'foram salvos' : 'foi salvo'} com sucesso.`,
      });

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

  const handleEditDocument = useCallback(async (updatedDoc: { title: string; description: string; category: string }) => {
    if (!editingDocument) return;

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from("trip_documents")
        .update({
          title: updatedDoc.title,
          description: updatedDoc.description,
          category: updatedDoc.category,
          updated_at: new Date().toISOString()
        })
        .eq("id", editingDocument.id)
        .eq("user_id", user!.id);

      if (error) {
        console.error("Erro ao editar documento:", error);
        toast({
          title: "Erro",
          description: "Não foi possível editar o documento. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      setDocuments(prev => prev.map(doc => 
        doc.id === editingDocument.id 
          ? { ...doc, title: updatedDoc.title, description: updatedDoc.description, category: updatedDoc.category as Document['category'], updated_at: new Date().toISOString() }
          : doc
      ));

      toast({
        title: "Documento editado! ✏️",
        description: `${updatedDoc.title} foi atualizado com sucesso.`,
      });

      setEditingDocument(null);
    } catch (error) {
      console.error("Erro ao editar documento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível editar o documento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }, [editingDocument, user, toast]);

  const handleDeleteDocument = useCallback(async (document: Document) => {
    try {
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

      const fileName = document.file_url.split('/').pop();
      if (fileName) {
        const filePath = `${user!.id}/${id}/${fileName}`;
        await supabase.storage
          .from('trip-documents')
          .remove([filePath]);
      }

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
  }, [user, id, toast]);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [documents, searchTerm, selectedCategory]);

  const documentStats = useMemo(() => {
    const stats = {
      total: documents.length,
      byCategory: {} as Record<string, number>
    };
    
    Object.keys(DOCUMENT_CATEGORIES).forEach(category => {
      stats.byCategory[category] = documents.filter(doc => doc.category === category).length;
    });
    
    return stats;
  }, [documents]);

  if (loading) {
    return (
      <PWALayout>
        <ProtectedRoute>
          <div className="min-h-screen bg-background p-4">
            <div className="max-w-6xl mx-auto">
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
            <div className="max-w-6xl mx-auto">
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
          <div className="border-b bg-card/50 backdrop-blur">
            <div className="max-w-6xl mx-auto p-4">
              <div className="flex items-center gap-4 mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/viagem/${id}`)}
                  className="rounded-full"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-foreground">Gestão de Documentos</h1>
                  <p className="text-muted-foreground">{trip.title} • {trip.destination}</p>
                </div>
                <Dialog open={isAddingDocument} onOpenChange={setIsAddingDocument}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-gradient-primary hover:shadow-hover transition-all duration-300"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Adicionar Documentos
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>

              {/* Stats */}
              <DocumentStats stats={documentStats} categories={DOCUMENT_CATEGORIES} />
            </div>
          </div>

          {/* Content */}
          <div className="max-w-6xl mx-auto p-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="all">Todas as categorias</option>
                  {Object.entries(DOCUMENT_CATEGORIES).map(([key, category]) => (
                    <option key={key} value={key}>{category.name}</option>
                  ))}
                </select>

                <div className="flex border border-border rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    className="rounded-none rounded-l-md"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                    className="rounded-none rounded-r-md"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Documents */}
            {filteredDocuments.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  {searchTerm || selectedCategory !== "all" ? (
                    <>
                      <h3 className="text-lg font-semibold mb-2">Nenhum documento encontrado</h3>
                      <p className="text-muted-foreground mb-4">Tente ajustar os filtros ou termo de busca</p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedCategory("all");
                        }}
                      >
                        Limpar filtros
                      </Button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold mb-2">Nenhum documento encontrado</h3>
                      <p className="text-muted-foreground mb-4">Comece adicionando seus documentos de viagem</p>
                      <Button onClick={() => setIsAddingDocument(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar primeiro documento
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className={
                viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                  : "space-y-3"
              }>
                {filteredDocuments.map((document) => {
                  const category = DOCUMENT_CATEGORIES[document.category];
                  return (
                    <DocumentCard
                      key={document.id}
                      document={document}
                      categoryConfig={category}
                      viewMode={viewMode}
                      onClick={() => setViewingDocument(document)}
                      onEdit={() => setEditingDocument(document)}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Dialogs */}
          <AddDocumentDialog
            isOpen={isAddingDocument}
            onClose={() => setIsAddingDocument(false)}
            onAdd={handleAddDocuments}
            uploading={uploading}
            category={newDocuments.category}
            files={newDocuments.files}
            onCategoryChange={(category) => setNewDocuments({...newDocuments, category: category as keyof typeof DOCUMENT_CATEGORIES})}
            onFilesChange={(files) => setNewDocuments({...newDocuments, files})}
          />

          <DocumentViewer
            document={viewingDocument}
            isOpen={!!viewingDocument}
            onClose={() => setViewingDocument(null)}
            onDelete={handleDeleteDocument}
            onEdit={() => {
              setEditingDocument(viewingDocument);
              setViewingDocument(null);
            }}
          />

          <EditDocumentDialog
            document={editingDocument}
            isOpen={!!editingDocument}
            onClose={() => setEditingDocument(null)}
            onSave={handleEditDocument}
            saving={saving}
          />
        </div>
      </ProtectedRoute>
    </PWALayout>
  );
}