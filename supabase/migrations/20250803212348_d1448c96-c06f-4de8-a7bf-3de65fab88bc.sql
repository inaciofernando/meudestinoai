-- Create restaurants table
CREATE TABLE public.restaurants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL,
  user_id UUID NOT NULL,
  restaurant_name TEXT NOT NULL,
  reservation_date DATE,
  reservation_time TIME,
  restaurant_image_url TEXT,
  voucher_file_url TEXT,
  voucher_file_name TEXT,
  restaurant_link TEXT,
  estimated_amount NUMERIC(10,2),
  cuisine_type TEXT,
  address TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own restaurants" 
ON public.restaurants 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own restaurants" 
ON public.restaurants 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own restaurants" 
ON public.restaurants 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own restaurants" 
ON public.restaurants 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_restaurants_updated_at
BEFORE UPDATE ON public.restaurants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();