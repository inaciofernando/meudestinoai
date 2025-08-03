-- Add images column to roteiro_pontos table
ALTER TABLE public.roteiro_pontos 
ADD COLUMN images text[] DEFAULT '{}';

-- Add comment for the new column
COMMENT ON COLUMN public.roteiro_pontos.images IS 'Array of image URLs for this itinerary point';