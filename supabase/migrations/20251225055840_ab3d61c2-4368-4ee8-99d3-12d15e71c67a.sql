-- Fix the Security Definer View issue by setting it to SECURITY INVOKER
ALTER VIEW public.member_directory SET (security_invoker = on);