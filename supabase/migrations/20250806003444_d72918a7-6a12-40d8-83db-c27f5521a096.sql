-- Create table for user payment methods
CREATE TABLE public.user_payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trip_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'custom',
  initial_balance NUMERIC DEFAULT 0,
  current_balance NUMERIC DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_payment_methods ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own payment methods" 
ON public.user_payment_methods 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment methods" 
ON public.user_payment_methods 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods" 
ON public.user_payment_methods 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods" 
ON public.user_payment_methods 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_payment_methods_updated_at
BEFORE UPDATE ON public.user_payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add function to update payment method balance
CREATE OR REPLACE FUNCTION public.update_payment_method_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update current balance when expense is added/updated/deleted
  IF TG_OP = 'INSERT' THEN
    UPDATE public.user_payment_methods 
    SET current_balance = current_balance - NEW.actual_amount
    WHERE user_id = NEW.user_id 
    AND trip_id = NEW.trip_id 
    AND name = NEW.payment_method_type;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Revert old amount and apply new amount
    UPDATE public.user_payment_methods 
    SET current_balance = current_balance + OLD.actual_amount - NEW.actual_amount
    WHERE user_id = NEW.user_id 
    AND trip_id = NEW.trip_id 
    AND name = NEW.payment_method_type;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Revert the expense amount
    UPDATE public.user_payment_methods 
    SET current_balance = current_balance + OLD.actual_amount
    WHERE user_id = OLD.user_id 
    AND trip_id = OLD.trip_id 
    AND name = OLD.payment_method_type;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update payment method balances
CREATE TRIGGER update_payment_method_balance_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.budget_items
FOR EACH ROW
EXECUTE FUNCTION public.update_payment_method_balance();