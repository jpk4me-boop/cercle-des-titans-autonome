-- Ajout du rôle super_admin et compatibilité avec les politiques existantes.
-- Un super_admin est traité comme admin lorsque les politiques appellent has_role(..., 'admin').

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = _role
        OR (_role = 'admin'::public.app_role AND role = 'super_admin'::public.app_role)
      )
  )
$$;
