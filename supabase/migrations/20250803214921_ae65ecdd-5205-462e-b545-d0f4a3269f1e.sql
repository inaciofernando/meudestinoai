-- Add theme_mode column to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN theme_mode text NOT NULL DEFAULT 'light';

-- Add constraint to ensure only valid theme modes
ALTER TABLE public.profiles 
ADD CONSTRAINT check_theme_mode CHECK (theme_mode IN ('light', 'dark'));