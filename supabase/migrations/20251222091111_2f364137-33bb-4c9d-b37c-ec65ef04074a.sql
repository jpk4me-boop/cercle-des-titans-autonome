-- Drop all existing SELECT policies on profiles to start clean
DROP POLICY IF EXISTS "Users can view own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Require auth for profiles" ON public.profiles;

-- Create strict policy: users can ONLY view their own profile
CREATE POLICY "Users view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Block anonymous access completely
CREATE POLICY "Block anonymous profiles access"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);