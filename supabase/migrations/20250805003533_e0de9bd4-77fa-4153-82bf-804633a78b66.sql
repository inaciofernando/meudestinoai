-- Adicionar campos para vouchers/documentos na tabela roteiro_pontos
ALTER TABLE public.roteiro_pontos 
ADD COLUMN voucher_files JSONB DEFAULT '[]'::jsonb;

-- Comentário explicativo do campo
COMMENT ON COLUMN public.roteiro_pontos.voucher_files IS 'Array de objetos JSON contendo informações dos vouchers/documentos anexados: [{"url": "...", "name": "...", "type": "...", "description": "..."}]';