-- Add payment method and expense type fields to budget_items table
ALTER TABLE public.budget_items 
ADD COLUMN IF NOT EXISTS expense_type text NOT NULL DEFAULT 'realizado',
ADD COLUMN IF NOT EXISTS payment_method_type text;