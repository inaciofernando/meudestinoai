import { memo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";

const DOCUMENT_CATEGORIES = {
  insurance: { name: "Seguro Viagem" },
  voucher: { name: "Vouchers" },
  ticket: { name: "Passagens" },
  visa: { name: "Vistos & Docs" },
  other: { name: "Outros" }
};

interface AddDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
  uploading: boolean;
  category: string;
  files: File[];
  onCategoryChange: (category: string) => void;
  onFilesChange: (files: File[]) => void;
}

export const AddDocumentDialog = memo(({ 
  isOpen, 
  onClose, 
  onAdd, 
  uploading, 
  category, 
  files, 
  onCategoryChange, 
  onFilesChange 
}: AddDocumentDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Documento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Categoria</Label>
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
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
              onChange={(e) => onFilesChange(Array.from(e.target.files || []))}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Formatos aceitos: PDF, JPG, PNG, DOC, DOCX. Você pode selecionar múltiplos arquivos.
            </p>
            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-sm font-medium">Arquivos selecionados:</p>
                {files.map((file, index) => (
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
              onClick={onClose}
              className="flex-1"
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={onAdd} 
              className="flex-1"
              disabled={uploading || files.length === 0}
            >
              {uploading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Adicionar {files.length > 0 ? `(${files.length})` : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

AddDocumentDialog.displayName = "AddDocumentDialog";