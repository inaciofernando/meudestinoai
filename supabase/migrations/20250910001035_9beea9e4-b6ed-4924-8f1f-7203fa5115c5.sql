-- Add agent instruction field to profiles for customizable concierge prompt
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ai_agent_instructions TEXT DEFAULT '';

COMMENT ON COLUMN public.profiles.ai_agent_instructions IS 'Custom system instructions for the travel concierge agent provided by the user.';