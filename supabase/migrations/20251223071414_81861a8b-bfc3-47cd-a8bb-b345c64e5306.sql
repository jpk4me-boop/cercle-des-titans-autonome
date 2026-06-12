-- Add RLS policy for investors to view transactions (read-only)
CREATE POLICY "Investors can view all transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'investor'));

-- Add RLS policy for investors to view financing requests (read-only)
CREATE POLICY "Investors can view all financing requests"
ON public.financing_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'investor'));

-- Add RLS policy for investors to view contributions (read-only)
CREATE POLICY "Investors can view all contributions"
ON public.contributions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'investor'));