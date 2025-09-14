-- Policies for trip-documents bucket
-- Ensure RLS is enabled on storage.objects (usually is by default)
-- Public read
CREATE POLICY IF NOT EXISTS "Public can read trip documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'trip-documents');

-- Allow authenticated users to upload either to their own folder (user_id/...) or to the legacy 'vouchers/...'
CREATE POLICY IF NOT EXISTS "Authenticated can upload trip documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'trip-documents'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (storage.foldername(name))[1] = 'vouchers'
  )
);

-- Allow owners (user folder) to update their own files
CREATE POLICY IF NOT EXISTS "Owners can update their trip documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'trip-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'trip-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow owners (user folder) to delete their own files
CREATE POLICY IF NOT EXISTS "Owners can delete their trip documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'trip-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policies for trip-images (to prevent future RLS issues)
-- Public read
CREATE POLICY IF NOT EXISTS "Public can read trip images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'trip-images');

-- Allow authenticated users to upload images under their own folder OR root (legacy)
CREATE POLICY IF NOT EXISTS "Authenticated can upload trip images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'trip-images'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR position('/' in name) = 0 -- allow legacy root uploads like "file.jpg"
  )
);

-- Allow owners (user folder) to update/delete their files
CREATE POLICY IF NOT EXISTS "Owners can update trip images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'trip-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'trip-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "Owners can delete trip images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'trip-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);