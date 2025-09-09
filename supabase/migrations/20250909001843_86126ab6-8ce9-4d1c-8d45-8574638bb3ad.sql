-- Add AI configuration fields to profiles table
ALTER TABLE public.profiles ADD COLUMN ai_model TEXT DEFAULT 'gemini-2.5-flash';
ALTER TABLE public.profiles ADD COLUMN ai_api_key TEXT DEFAULT '';

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.ai_model IS 'AI model preference: gemini-2.5-flash, gpt-5-mini, etc';
COMMENT ON COLUMN public.profiles.ai_api_key IS 'User AI API key (encrypted storage recommended)';