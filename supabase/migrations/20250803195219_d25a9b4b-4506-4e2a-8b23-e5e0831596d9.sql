-- Remove existing policies for itinerary-images bucket
DROP POLICY IF EXISTS "Public can view itinerary images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload itinerary images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their itinerary images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their itinerary images" ON storage.objects;

-- Create storage bucket for itinerary images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('itinerary-images', 'itinerary-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for itinerary images storage
CREATE POLICY "Public can view itinerary images"
ON storage.objects FOR SELECT
USING (bucket_id = 'itinerary-images');

CREATE POLICY "Authenticated users can upload itinerary images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'itinerary-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their itinerary images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'itinerary-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their itinerary images"
ON storage.objects FOR DELETE
USING (bucket_id = 'itinerary-images' AND auth.role() = 'authenticated');