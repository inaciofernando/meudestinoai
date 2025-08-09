import { memo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";

const DOCUMENT_CATEGORIES = {
  insurance: { name: "Seguro Viagem" },
  voucher: { name: "Vouchers" },
  ticket: { name: "Passagens" },
  visa: { name: "Vistos & Docs" },
  other: { name: "Outros" }
};

interface Document {
  id: string;
  title: string;
  description?: string;
  category: string;
}

interface EditDocumentDialogProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedDoc: { title: string; description: string; category: string }) => void;
  saving: boolean;
}

export const EditDocumentDialog = memo(({ 
  document, 
  isOpen, 
  onClose, 
  onSave, 
  saving 
}: EditDocumentDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  // Reset form when document changes
  useState(() => {
    if (document) {
      setTitle(document.title);
      setDescription(document.description || "");
      setCategory(document.category);
    }
  });

  const handleSave = () => {
    onSave({ title, description, category });
  };

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Documento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do documento"
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional do documento"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="category">Categoria</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              {Object.entries(DOCUMENT_CATEGORIES).map(([key, config]) => (
                <option key={key} value={key}>{config.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              className="flex-1"
              disabled={saving || !title.trim()}
            >
              {saving ? (
                <>
                  <Save className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

EditDocumentDialog.displayName = "EditDocumentDialog";