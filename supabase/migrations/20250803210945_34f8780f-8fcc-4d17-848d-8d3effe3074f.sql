-- Create accommodations table
CREATE TABLE public.accommodations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL,
  user_id UUID NOT NULL,
  hotel_name TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  hotel_image_url TEXT,
  voucher_file_url TEXT,
  voucher_file_name TEXT,
  hotel_link TEXT,
  reservation_amount NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.accommodations ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own accommodations" 
ON public.accommodations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own accommodations" 
ON public.accommodations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accommodations" 
ON public.accommodations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accommodations" 
ON public.accommodations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_accommodations_updated_at
BEFORE UPDATE ON public.accommodations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();