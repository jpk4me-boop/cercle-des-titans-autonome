-- Fix: Profiles PII Exposure
-- Replace the overly permissive "Authenticated users can view basic member info" policy
-- with a view that exposes only non-sensitive fields for the member directory

-- Step 1: Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view basic member info" ON public.profiles;

-- Step 2: Create a policy for users to view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Step 3: Create a secure view for member directory (non-sensitive data only)
CREATE OR REPLACE VIEW public.member_directory AS
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  avatar_url,
  city,
  profession
FROM public.profiles;

-- Step 4: Grant SELECT on the view to authenticated users
GRANT SELECT ON public.member_directory TO authenticated;