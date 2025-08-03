-- Add budget-related columns to trips table
ALTER TABLE public.trips 
ADD COLUMN IF NOT EXISTS total_budget DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS budget_currency VARCHAR(3) DEFAULT 'BRL';

-- Create budget_items table for individual budget entries
CREATE TABLE IF NOT EXISTS public.budget_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  planned_amount DECIMAL(10,2) NOT NULL,
  actual_amount DECIMAL(10,2),
  is_expense BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on budget_items
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for budget_items
CREATE POLICY "Users can view their own budget items" 
ON public.budget_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budget items" 
ON public.budget_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget items" 
ON public.budget_items 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budget items" 
ON public.budget_items 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_budget_items_updated_at
BEFORE UPDATE ON public.budget_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();