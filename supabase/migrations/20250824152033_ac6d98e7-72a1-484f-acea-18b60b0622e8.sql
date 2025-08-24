-- Create table for trip locations
CREATE TABLE public.trip_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL,
  user_id UUID NOT NULL,
  location_name TEXT NOT NULL,
  location_type TEXT DEFAULT 'city',
  order_index INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.trip_locations ENABLE ROW LEVEL SECURITY;

-- Create policies for trip locations
CREATE POLICY "Users can view their own trip locations" 
ON public.trip_locations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trip locations" 
ON public.trip_locations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trip locations" 
ON public.trip_locations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trip locations" 
ON public.trip_locations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_trip_locations_updated_at
BEFORE UPDATE ON public.trip_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();