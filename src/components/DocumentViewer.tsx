import { memo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Download, Trash2, FileText, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  title: string;
  file_name: string;
  file_url: string;
  file_type: string;
}

interface DocumentViewerProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (document: Document) => void;
  onEdit: () => void;
}

export const DocumentViewer = memo(({ document, isOpen, onClose, onDelete, onEdit }: DocumentViewerProps) => {
  const { toast } = useToast();

  if (!document) return null;

  const handleDownload = async () => {
    try {
      const urlParts = document.file_url.split('/');
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
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <DialogTitle className="text-left">{document.title}</DialogTitle>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
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
                      onClick={() => {
                        onDelete(document);
                        onClose();
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 p-4">
          <div className="w-full h-[70vh] bg-muted rounded-lg flex items-center justify-center">
            {document.file_type.startsWith('image/') ? (
              <img 
                src={document.file_url} 
                alt={document.title}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            ) : document.file_type === 'application/pdf' ? (
              <iframe 
                src={document.file_url} 
                className="w-full h-full rounded-lg"
                title={document.title}
              />
            ) : (
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Prévia não disponível</p>
                <Button onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Arquivo
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

DocumentViewer.displayName = "DocumentViewer";