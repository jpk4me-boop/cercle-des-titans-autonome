-- Add explicit denial policy for anonymous access on profiles table
-- This ensures that only authenticated users can access profile data

CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Also add protection to contributions table (related issue)
CREATE POLICY "Deny anonymous access to contributions"
ON public.contributions
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Also add protection to financing_requests table (related issue)
CREATE POLICY "Deny anonymous access to financing_requests"
ON public.financing_requests
FOR ALL
USING (auth.uid() IS NOT NULL);