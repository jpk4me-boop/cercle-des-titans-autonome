-- Add admin policies for contributions table
CREATE POLICY "Admins can view all contributions"
ON public.contributions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all contributions"
ON public.contributions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert contributions"
ON public.contributions
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete contributions"
ON public.contributions
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Block anonymous access
CREATE POLICY "Block anonymous contributions access"
ON public.contributions
FOR ALL
TO anon
USING (false)
WITH CHECK (false);