-- Add images column to trips table (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='trips' AND column_name='images'
    ) THEN
        ALTER TABLE public.trips ADD COLUMN images TEXT[] DEFAULT '{}';
        CREATE INDEX idx_trips_images ON public.trips USING GIN(images);
    END IF;
END$$;