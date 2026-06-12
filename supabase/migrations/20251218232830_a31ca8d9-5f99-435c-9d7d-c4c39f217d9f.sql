-- Add DELETE policy for contributions table
CREATE POLICY "Users can delete their own contributions"
ON public.contributions FOR DELETE
USING (auth.uid() = user_id);

-- Add DELETE policy for profiles table (for account deletion scenarios)
CREATE POLICY "Users can delete their own profile"
ON public.profiles FOR DELETE
USING (auth.uid() = user_id);