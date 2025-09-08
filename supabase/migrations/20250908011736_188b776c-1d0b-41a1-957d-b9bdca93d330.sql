-- Add waze_link field to accommodations table
ALTER TABLE public.accommodations 
ADD COLUMN waze_link text;