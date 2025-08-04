-- Create storage policies for trip-documents bucket to allow voucher uploads
CREATE POLICY "Users can upload their own trip documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'trip-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own trip documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'trip-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own trip documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'trip-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own trip documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'trip-documents' AND auth.uid()::text = (storage.foldername(name))[1]);