-- Fix search_path security warnings by updating functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- The handle_new_user function already has SET search_path = '' so it's correct
-- Just recreating to ensure consistency
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  is_admin BOOLEAN := FALSE;
BEGIN
  -- Check if this is the admin email
  IF NEW.email = 'inacio.fernando@gmail.com' THEN
    is_admin := TRUE;
  END IF;

  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN is_admin THEN 'admin'::app_role ELSE 'user'::app_role END);

  RETURN NEW;
END;
$$;