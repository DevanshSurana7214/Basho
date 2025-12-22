-- Create workshop_bookings table to store workshop registrations
CREATE TABLE public.workshop_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1,
  total_amount NUMERIC NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  booking_status TEXT NOT NULL DEFAULT 'confirmed',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.workshop_bookings ENABLE ROW LEVEL SECURITY;

-- Users can create their own bookings
CREATE POLICY "Users can create workshop bookings"
ON public.workshop_bookings
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Users can view their own bookings
CREATE POLICY "Users can view own workshop bookings"
ON public.workshop_bookings
FOR SELECT
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Users can update their own pending bookings
CREATE POLICY "Users can update own pending workshop bookings"
ON public.workshop_bookings
FOR UPDATE
USING (auth.uid() IS NOT NULL AND user_id = auth.uid() AND payment_status = 'pending');

-- Admins can view all bookings
CREATE POLICY "Admins can view all workshop bookings"
ON public.workshop_bookings
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update all bookings
CREATE POLICY "Admins can update all workshop bookings"
ON public.workshop_bookings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admins can delete bookings
CREATE POLICY "Admins can delete workshop bookings"
ON public.workshop_bookings
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_workshop_bookings_updated_at
BEFORE UPDATE ON public.workshop_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update workshop slot availability after payment
CREATE OR REPLACE FUNCTION public.update_workshop_slot_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_slots JSONB;
  updated_slots JSONB;
  slot_record JSONB;
  i INTEGER;
BEGIN
  -- Only proceed if payment status changed to 'paid'
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    -- Get current time_slots from workshop
    SELECT time_slots INTO current_slots
    FROM workshops
    WHERE id = NEW.workshop_id;
    
    IF current_slots IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Update the matching slot
    updated_slots = '[]'::jsonb;
    FOR i IN 0..jsonb_array_length(current_slots) - 1 LOOP
      slot_record = current_slots->i;
      
      -- Check if this slot matches the booking
      IF slot_record->>'date' = NEW.booking_date::text AND slot_record->>'time' = NEW.time_slot THEN
        -- Increment booked count by number of guests
        slot_record = jsonb_set(
          slot_record,
          '{booked}',
          to_jsonb(COALESCE((slot_record->>'booked')::integer, 0) + NEW.guests)
        );
      END IF;
      
      updated_slots = updated_slots || jsonb_build_array(slot_record);
    END LOOP;
    
    -- Update the workshop with new slots
    UPDATE workshops
    SET time_slots = updated_slots, updated_at = now()
    WHERE id = NEW.workshop_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for updating slots on payment
CREATE TRIGGER update_slots_on_workshop_payment
AFTER UPDATE ON public.workshop_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_workshop_slot_on_payment();