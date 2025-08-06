-- First drop the trigger that depends on the function
DROP TRIGGER IF EXISTS update_payment_method_balance_trigger ON public.budget_items;

-- Now we can safely drop the function
DROP FUNCTION IF EXISTS public.update_payment_method_balance();

-- Make the user_payment_methods table global per user (not per trip)
-- We'll keep trip_id for now to avoid breaking existing data, but make it nullable
ALTER TABLE public.user_payment_methods 
ALTER COLUMN trip_id DROP NOT NULL;

-- Remove balance-related columns since we don't want automatic balance management
ALTER TABLE public.user_payment_methods 
DROP COLUMN IF EXISTS initial_balance,
DROP COLUMN IF EXISTS current_balance;