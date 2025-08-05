-- Verificar se o bucket trip-documents existe e se é público
UPDATE storage.buckets 
SET public = true 
WHERE id = 'trip-documents';

-- Criar políticas permissivas para o bucket trip-documents se não existirem
INSERT INTO storage.objects (bucket_id, name, owner, metadata) VALUES ('trip-documents', '.emptyFolderPlaceholder', null, '{}') ON CONFLICT DO NOTHING;

-- Política para permitir uploads
CREATE POLICY "Users can upload their own vouchers" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'trip-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir visualização
CREATE POLICY "Users can view their own vouchers" ON storage.objects
FOR SELECT USING (
  bucket_id = 'trip-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir updates
CREATE POLICY "Users can update their own vouchers" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'trip-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir deletes
CREATE POLICY "Users can delete their own vouchers" ON storage.objects
FOR DELETE USING (
  bucket_id = 'trip-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);