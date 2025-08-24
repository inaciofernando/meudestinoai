-- Adicionar campos de endereço e links para roteiro_pontos
ALTER TABLE public.roteiro_pontos 
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS website_link text,
ADD COLUMN IF NOT EXISTS tripadvisor_link text;