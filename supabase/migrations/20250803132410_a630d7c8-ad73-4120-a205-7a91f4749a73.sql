-- Update trips table policies with explicit schema references
DROP POLICY IF EXISTS "Users can view their own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can create their own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can update their own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can delete their own trips" ON public.trips;

CREATE POLICY "Users can view their own trips" 
ON public.trips 
FOR SELECT 
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users can create their own trips" 
ON public.trips 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trips" 
ON public.trips 
FOR UPDATE 
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users can delete their own trips" 
ON public.trips 
FOR DELETE 
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));