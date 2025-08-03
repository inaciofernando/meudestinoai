-- Create storage bucket for trip images
INSERT INTO storage.buckets (id, name, public) VALUES ('trip-images', 'trip-images', true);

-- Create storage policies for trip images
CREATE POLICY "Trip images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'trip-images');

CREATE POLICY "Users can upload trip images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'trip-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their trip images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'trip-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their trip images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'trip-images' AND auth.uid() IS NOT NULL);

-- Add images column to trips table
ALTER TABLE public.trips 
ADD COLUMN images TEXT[] DEFAULT '{}';

-- Add index for better performance when filtering by images
CREATE INDEX idx_trips_images ON public.trips USING GIN(images);