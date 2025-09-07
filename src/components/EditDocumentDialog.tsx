import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  FileText,
  IdCard,
  FileCheck,
  Shield,
  CreditCard
} from "lucide-react";
import { VoucherUpload } from "@/components/VoucherUpload";
import { TripDocument } from "@/pages/Documentos";

interface EditDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (document: TripDocument) => void;
  document: TripDocument;
}

const formSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  category: z.string().min(1, "Categoria é obrigatória"),
});

type FormData = z.infer<typeof formSchema>;

const DOCUMENT_CATEGORIES = [
  { value: "passport", label: "Passaporte", icon: IdCard },
  { value: "visa", label: "Visto", icon: FileCheck },
  { value: "insurance", label: "Seguro Viagem", icon: Shield },
  { value: "ticket", label: "Ticket/Bilhete", icon: FileText },
  { value: "voucher", label: "Voucher", icon: CreditCard },
  { value: "hotel", label: "Comprovante de Hotel", icon: FileText },
  { value: "car_rental", label: "Aluguel de Carro", icon: FileText },
  { value: "other", label: "Outros", icon: FileText },
];

export function EditDocumentDialog({ isOpen, onClose, onUpdate, document }: EditDocumentDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [documentFiles, setDocumentFiles] = useState<{ url: string; name: string; type: string; description?: string }[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: document.title,
      description: document.description || "",
      category: document.category,
    },
  });

  useEffect(() => {
    // Initialize with existing file
    setDocumentFiles([{
      url: document.file_url,
      name: document.file_name,
      type: document.file_type,
    }]);

    // Reset form with document data
    form.reset({
      title: document.title,
      description: document.description || "",
      category: document.category,
    });
  }, [document, form]);

  const handleSubmit = async (data: FormData) => {
    if (!user) return;

    if (documentFiles.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um arquivo",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const file = documentFiles[0];
      const documentData = {
        title: data.title,
        description: data.description || null,
        category: data.category,
        file_name: file.name,
        file_url: file.url,
        file_type: file.type,
      };

      const { data: updatedDocument, error } = await supabase
        .from("trip_documents")
        .update(documentData)
        .eq("id", document.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      onUpdate(updatedDocument);
      
      toast({
        title: "Sucesso!",
        description: "Documento atualizado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao atualizar documento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o documento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Editar Documento</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DOCUMENT_CATEGORIES.map((category) => {
                        const IconComponent = category.icon;
                        return (
                          <SelectItem key={category.value} value={category.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              {category.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Passaporte Brasileiro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Informações adicionais sobre o documento..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Arquivo do Documento</label>
              <VoucherUpload
                vouchers={documentFiles}
                onVouchersChange={setDocumentFiles}
                maxFiles={1}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading || documentFiles.length === 0}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}