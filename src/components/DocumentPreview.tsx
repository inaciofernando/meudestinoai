import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, FileText, Image as ImageIcon } from "lucide-react";

interface DocumentPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  fileType?: string;
}

export function DocumentPreview({ isOpen, onClose, fileUrl, fileName, fileType }: DocumentPreviewProps) {
  const isImage = fileType?.startsWith('image/') || fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPDF = fileType?.includes('pdf') || fileName.match(/\.pdf$/i);

  const handleDownload = async () => {
    try {
      // Usar fetch para baixar o arquivo e contornar bloqueios do navegador
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      
      // Criar um URL temporário para o blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Criar link temporário para download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Limpeza
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      // Fallback para download direto se fetch falhar
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-lg font-semibold truncate pr-4">
            {fileName}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <DialogDescription className="sr-only">
          Visualização do documento {fileName}
        </DialogDescription>

        <div className="flex-1 overflow-auto">
          {isImage ? (
            <div className="flex justify-center p-4">
              <img
                src={fileUrl}
                alt={fileName}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden text-center text-muted-foreground">
                <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Não foi possível carregar a imagem</p>
              </div>
            </div>
          ) : isPDF ? (
            <div className="space-y-4">
              <div className="h-[70vh] w-full flex items-center justify-center">
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Visualização de PDF</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Devido a restrições de segurança do navegador, a visualização inline não está disponível.
                    Use os botões abaixo para acessar o documento.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={handleDownload} className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Fazer Download
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(fileUrl, '_blank')}
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Tentar Abrir
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Visualização não disponível</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Este tipo de arquivo não pode ser visualizado no navegador. 
                Clique em "Download" para baixar e abrir em um aplicativo adequado.
              </p>
              <Button onClick={handleDownload} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Fazer Download
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}