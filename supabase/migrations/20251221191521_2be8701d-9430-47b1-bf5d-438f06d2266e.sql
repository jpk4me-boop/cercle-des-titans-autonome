-- First, let's ensure we have complete protection on financing_requests
-- Drop any conflicting policies
DROP POLICY IF EXISTS "Only authenticated admins can access financing_requests" ON public.financing_requests;
DROP POLICY IF EXISTS "Deny anonymous access to financing_requests" ON public.financing_requests;

-- Recreate strict admin-only policies using RESTRICTIVE
-- This policy requires authentication AND admin role for ALL operations
CREATE POLICY "Require auth for financing_requests"
ON public.financing_requests
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Keep existing admin policies for SELECT and UPDATE (they already exist)
-- The RESTRICTIVE policy above ensures no anonymous access is possible

-- Also fix profiles table which has the same issue
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;

CREATE POLICY "Require auth for profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL);