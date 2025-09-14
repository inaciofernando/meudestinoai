import React, { useState } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImageFile {
  url: string;
  name: string;
}

interface ImageUploadAreaProps {
  images: ImageFile[];
  onImagesChange: (images: ImageFile[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  label?: string;
}

export const ImageUploadArea: React.FC<ImageUploadAreaProps> = ({ 
  images, 
  onImagesChange, 
  maxFiles = 1,
  disabled = false,
  label = "Adicionar Imagens"
}) => {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File): Promise<ImageFile | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `hotel_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Usar o ID do usuário no caminho para organizar os arquivos
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('trip-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage.from('trip-images').getPublicUrl(filePath);

      return {
        url: data.publicUrl,
        name: file.name
      };
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error(`Falha ao fazer upload de ${file.name}`);
      return null;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || disabled) return;

    if (images.length + files.length > maxFiles) {
      toast.error(`Você pode anexar no máximo ${maxFiles} imagem(ns).`);
      return;
    }

    setUploading(true);

    try {
      const uploadResults = [];
      
      // Upload sequencial para melhor controle de erros
      for (const file of Array.from(files)) {
        // Validar tamanho do arquivo (máx 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} excede o limite de 10MB.`);
          continue;
        }
        
        const result = await uploadImage(file);
        uploadResults.push(result);
      }

      const successfulUploads = uploadResults.filter(file => file !== null) as ImageFile[];
      const failedUploads = uploadResults.filter(file => file === null).length;

      if (successfulUploads.length > 0) {
        onImagesChange([...images, ...successfulUploads]);
        toast.success(`${successfulUploads.length} imagem(ns) adicionada(s) com sucesso.`);
      }

      if (failedUploads > 0) {
        toast.error(`${failedUploads} imagem(ns) não puderam ser enviadas.`);
      }
    } catch (error) {
      console.error('Erro geral no upload:', error);
      toast.error("Não foi possível fazer upload das imagens.");
    } finally {
      setUploading(false);
      // Reset input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    if (disabled) return;
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!disabled && (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
          <input
            type="file"
            id="image-upload"
            multiple={maxFiles > 1}
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading || images.length >= maxFiles}
            className="hidden"
          />
          <label
            htmlFor="image-upload"
            className={`cursor-pointer flex flex-col items-center gap-2 ${
              uploading || images.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Upload className="w-8 h-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {uploading ? 'Fazendo upload...' : label}
              </p>
              <p className="text-xs text-muted-foreground">
                {images.length}/{maxFiles}
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Lista de imagens */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <Card key={index} className="p-0 overflow-hidden">
              <CardContent className="p-0 relative group">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-32 object-cover"
                />
                {!disabled && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 p-0"
                    onClick={() => removeImage(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};