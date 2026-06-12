-- Add explicit deny policy for anonymous users on transactions
CREATE POLICY "Deny anonymous access to transactions"
ON public.transactions
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Add explicit deny policy for non-admin authenticated users
CREATE POLICY "Deny non-admin access to transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));