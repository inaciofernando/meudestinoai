-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own budget items" ON public.budget_items;
DROP POLICY IF EXISTS "Users can create their own budget items" ON public.budget_items;
DROP POLICY IF EXISTS "Users can update their own budget items" ON public.budget_items;
DROP POLICY IF EXISTS "Users can delete their own budget items" ON public.budget_items;

-- Create RLS policies for budget_items
CREATE POLICY "Users can view their own budget items" 
ON public.budget_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budget items" 
ON public.budget_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget items" 
ON public.budget_items 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budget items" 
ON public.budget_items 
FOR DELETE 
USING (auth.uid() = user_id);