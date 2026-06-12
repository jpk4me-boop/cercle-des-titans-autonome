-- Drop the existing policy and create a more restrictive one
DROP POLICY IF EXISTS "Deny anonymous access to financing_requests" ON public.financing_requests;

-- Create explicit policy that only allows authenticated admins to SELECT
-- This replaces the broad auth.uid() check with admin-only access
CREATE POLICY "Only authenticated admins can access financing_requests"
ON public.financing_requests
FOR SELECT
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'));