-- Allow all authenticated users to view basic profile info of other members
CREATE POLICY "Authenticated users can view basic member info"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Drop the restrictive "Users view own profile" policy since the new policy covers it
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;