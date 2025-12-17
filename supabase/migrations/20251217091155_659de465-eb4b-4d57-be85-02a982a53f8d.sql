-- Drop the restrictive SELECT policy on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create a new policy allowing anyone to view profiles (names are not sensitive)
CREATE POLICY "Anyone can view profiles"
ON public.profiles
FOR SELECT
USING (true);