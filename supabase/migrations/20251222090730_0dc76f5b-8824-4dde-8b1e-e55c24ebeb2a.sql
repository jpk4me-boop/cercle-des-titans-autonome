-- Drop existing SELECT policies on profiles that may be too permissive
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Require auth for profiles" ON public.profiles;

-- Create strict SELECT policy: users can ONLY view their own profile
CREATE POLICY "Users can view own profile only"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow admins to view all profiles for administrative purposes
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Deny anonymous access explicitly
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);