-- Ensure AI settings columns exist in profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_model TEXT DEFAULT 'gemini-2.5-flash';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_api_key TEXT DEFAULT '';

COMMENT ON COLUMN public.profiles.ai_model IS 'AI model preference: gemini-2.5-flash, gpt-5-mini-2025-08-07, etc';
COMMENT ON COLUMN public.profiles.ai_api_key IS 'User-provided API key for selected AI provider';