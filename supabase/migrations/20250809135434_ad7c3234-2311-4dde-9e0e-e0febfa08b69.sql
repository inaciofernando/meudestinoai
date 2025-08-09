-- Add new link columns for restaurants
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS tripadvisor_link text,
  ADD COLUMN IF NOT EXISTS google_maps_link text,
  ADD COLUMN IF NOT EXISTS waze_link text;

-- Add navigation link columns for itinerary points
ALTER TABLE public.roteiro_pontos
  ADD COLUMN IF NOT EXISTS google_maps_link text,
  ADD COLUMN IF NOT EXISTS waze_link text;