import React, { useState } from 'react';
import { Upload, X, FileText, Download, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VoucherFile {
  url: string;
  name: string;
  type: string;
  description?: string;
}

interface VoucherUploadProps {
  vouchers: VoucherFile[];
  onVouchersChange: (vouchers: VoucherFile[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export const VoucherUpload: React.FC<VoucherUploadProps> = ({ 
  vouchers, 
  onVouchersChange, 
  maxFiles = 5,
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [newDescription, setNewDescription] = useState('');
  const { toast } = useToast();

  const uploadFile = async (file: File): Promise<VoucherFile | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `voucher_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Usar o ID do usuário no caminho para organizar os arquivos
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      const filePath = `${user.id}/${fileName}`;

      console.log('Fazendo upload para:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('trip-documents')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage.from('trip-documents').getPublicUrl(filePath);

      console.log('Upload concluído:', data.publicUrl);

      return {
        url: data.publicUrl,
        name: file.name,
        type: file.type,
        description: newDescription || undefined
      };
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: `Falha ao fazer upload de ${file.name}: ${error.message || 'Erro desconhecido'}`,
        variant: "destructive"
      });
      return null;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || disabled) return;

    console.log('Iniciando upload de', files.length, 'arquivo(s)');

    if (vouchers.length + files.length > maxFiles) {
      toast({
        title: "Limite excedido",
        description: `Você pode anexar no máximo ${maxFiles} arquivos.`,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      const uploadResults = [];
      
      // Upload sequencial para melhor controle de erros
      for (const file of Array.from(files)) {
        console.log('Fazendo upload de:', file.name, 'Tamanho:', file.size, 'Tipo:', file.type);
        
        // Validar tamanho do arquivo (máx 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "Arquivo muito grande",
            description: `${file.name} excede o limite de 10MB.`,
            variant: "destructive"
          });
          continue;
        }
        
        const result = await uploadFile(file);
        uploadResults.push(result);
      }

      const successfulUploads = uploadResults.filter(file => file !== null) as VoucherFile[];
      const failedUploads = uploadResults.filter(file => file === null).length;

      if (successfulUploads.length > 0) {
        onVouchersChange([...vouchers, ...successfulUploads]);
        toast({
          title: "Upload concluído!",
          description: `${successfulUploads.length} arquivo(s) anexado(s) com sucesso.`,
        });
        setNewDescription('');
      }

      if (failedUploads > 0) {
        toast({
          title: "Alguns uploads falharam",
          description: `${failedUploads} arquivo(s) não puderam ser enviados. Verifique o console para detalhes.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro geral no upload:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload dos arquivos.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      // Reset input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const removeVoucher = (index: number) => {
    if (disabled) return;
    const newVouchers = vouchers.filter((_, i) => i !== index);
    onVouchersChange(newVouchers);
  };

  const downloadFile = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Erro ao baixar arquivo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível baixar o arquivo.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!disabled && (
        <div className="space-y-3">
          <div>
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input
              id="description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Ex: Voucher vinícola, Cupom desconto..."
              className="mb-2"
            />
          </div>
          
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <input
              type="file"
              id="voucher-upload"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileUpload}
              disabled={uploading || vouchers.length >= maxFiles}
              className="hidden"
            />
            <label
              htmlFor="voucher-upload"
              className={`cursor-pointer flex flex-col items-center gap-2 ${
                uploading || vouchers.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Upload className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {uploading ? 'Fazendo upload...' : 'Clique para anexar vouchers/documentos'}
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, JPG, PNG, DOC (máx. {maxFiles} arquivos)
                </p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Lista de arquivos */}
      {vouchers.length > 0 && (
        <div className="space-y-2">
          <Label>Vouchers Anexados</Label>
          <div className="space-y-2">
            {vouchers.map((voucher, index) => (
              <Card key={index} className="p-0">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{voucher.name}</p>
                        {voucher.description && (
                          <p className="text-xs text-muted-foreground truncate">{voucher.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadFile(voucher.url, voucher.name)}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {!disabled && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVoucher(index)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};