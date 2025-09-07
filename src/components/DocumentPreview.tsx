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

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              <div className="text-center text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Visualização de PDF</h3>
                <p className="mb-4">
                  Por questões de segurança, alguns PDFs não podem ser visualizados diretamente no navegador.
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
                    Abrir em Nova Aba
                  </Button>
                </div>
              </div>
              <div className="border rounded-lg p-4 bg-muted/30">
                <iframe
                  src={`${fileUrl}#toolbar=1`}
                  className="w-full h-[60vh] border-0 rounded"
                  title={fileName}
                  sandbox="allow-same-origin allow-scripts"
                  onLoad={(e) => {
                    const iframe = e.target as HTMLIFrameElement;
                    try {
                      // Test if iframe loaded successfully
                      if (iframe.contentDocument) {
                        console.log('PDF loaded successfully');
                      }
                    } catch (error) {
                      console.log('PDF blocked by CORS policy');
                    }
                  }}
                />
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