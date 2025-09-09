-- Add public sharing fields to trips table
ALTER TABLE public.trips 
ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN public_slug TEXT UNIQUE;

-- Create index for public slug lookup
CREATE INDEX idx_trips_public_slug ON public.trips(public_slug) WHERE public_slug IS NOT NULL;

-- Create function to generate unique slug
CREATE OR REPLACE FUNCTION generate_trip_slug(trip_title TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base slug from title
  base_slug := lower(regexp_replace(trip_title, '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := trim(base_slug, '-');
  
  -- Ensure slug is not empty
  IF base_slug = '' THEN
    base_slug := 'viagem';
  END IF;
  
  final_slug := base_slug;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM public.trips WHERE public_slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Create policy to allow public access to public trips
CREATE POLICY "Public trips are viewable by anyone" 
ON public.trips 
FOR SELECT 
USING (is_public = true);