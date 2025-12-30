-- Add DELETE policy for admins on experience_bookings table
CREATE POLICY "Admins can delete experience bookings for admin panel" 
ON public.experience_bookings 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));