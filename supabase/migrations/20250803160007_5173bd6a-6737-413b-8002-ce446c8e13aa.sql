-- Add new columns to budget_items table for enhanced expense tracking
ALTER TABLE public.budget_items 
ADD COLUMN location TEXT,
ADD COLUMN expense_date DATE,
ADD COLUMN payment_method TEXT,
ADD COLUMN receipt_image_url TEXT,
ADD COLUMN notes TEXT;