-- Remove campos de avaliação, dados de quarto e política de cancelamento da tabela accommodations
ALTER TABLE public.accommodations 
DROP COLUMN IF EXISTS rating,
DROP COLUMN IF EXISTS number_of_guests,
DROP COLUMN IF EXISTS number_of_rooms,
DROP COLUMN IF EXISTS cancellation_policy;