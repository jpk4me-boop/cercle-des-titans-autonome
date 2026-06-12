-- Recreate the view properly with SECURITY INVOKER
DROP VIEW IF EXISTS public.member_directory;

CREATE VIEW public.member_directory 
WITH (security_invoker = on)
AS
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  avatar_url,
  city,
  profession
FROM public.profiles;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.member_directory TO authenticated;