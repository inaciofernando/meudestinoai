-- Create roteiros table
CREATE TABLE public.roteiros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  total_days INTEGER NOT NULL DEFAULT 1,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.roteiros ENABLE ROW LEVEL SECURITY;

-- Create policies for roteiros
CREATE POLICY "Users can view their own roteiros" 
ON public.roteiros 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own roteiros" 
ON public.roteiros 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own roteiros" 
ON public.roteiros 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own roteiros" 
ON public.roteiros 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create roteiro_pontos table
CREATE TABLE public.roteiro_pontos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roteiro_id UUID NOT NULL,
  day_number INTEGER NOT NULL,
  time_start TIME NOT NULL,
  time_end TIME,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('attraction', 'restaurant', 'transport', 'hotel', 'activity', 'shopping', 'rest')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  estimated_cost NUMERIC,
  notes TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.roteiro_pontos ENABLE ROW LEVEL SECURITY;

-- Create policies for roteiro_pontos
CREATE POLICY "Users can view their own roteiro points" 
ON public.roteiro_pontos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own roteiro points" 
ON public.roteiro_pontos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own roteiro points" 
ON public.roteiro_pontos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own roteiro points" 
ON public.roteiro_pontos 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_roteiros_updated_at
BEFORE UPDATE ON public.roteiros
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_roteiro_pontos_updated_at
BEFORE UPDATE ON public.roteiro_pontos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_roteiros_trip_id ON public.roteiros(trip_id);
CREATE INDEX idx_roteiros_user_id ON public.roteiros(user_id);
CREATE INDEX idx_roteiro_pontos_roteiro_id ON public.roteiro_pontos(roteiro_id);
CREATE INDEX idx_roteiro_pontos_user_id ON public.roteiro_pontos(user_id);
CREATE INDEX idx_roteiro_pontos_day_order ON public.roteiro_pontos(day_number, order_index);