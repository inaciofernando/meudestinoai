-- Criar tabela para transportes
CREATE TABLE public.transport_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL,
  user_id UUID NOT NULL,
  transport_type TEXT NOT NULL, -- 'flight', 'bus', 'train', 'car_rental', 'transfer', 'boat', 'other'
  title TEXT NOT NULL,
  description TEXT,
  departure_location TEXT,
  arrival_location TEXT,
  departure_date DATE,
  departure_time TIME,
  arrival_date DATE,
  arrival_time TIME,
  booking_reference TEXT,
  confirmation_number TEXT,
  provider_name TEXT, -- nome da companhia aérea, locadora, etc.
  seat_number TEXT,
  gate_info TEXT,
  vehicle_info TEXT, -- modelo do carro, número do voo, etc.
  total_amount NUMERIC,
  currency TEXT DEFAULT 'BRL',
  booking_status TEXT DEFAULT 'confirmed', -- 'confirmed', 'cancelled', 'pending'
  payment_method TEXT,
  ticket_file_name TEXT,
  ticket_file_url TEXT,
  voucher_file_name TEXT,
  voucher_file_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.transport_bookings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own transport bookings" 
ON public.transport_bookings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transport bookings" 
ON public.transport_bookings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transport bookings" 
ON public.transport_bookings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transport bookings" 
ON public.transport_bookings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_transport_bookings_updated_at
BEFORE UPDATE ON public.transport_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();