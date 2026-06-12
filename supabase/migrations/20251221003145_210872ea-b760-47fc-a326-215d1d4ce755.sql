-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can submit financing requests" ON public.financing_requests;

-- Create a rate-limited RPC function to submit financing requests
CREATE OR REPLACE FUNCTION public.submit_financing_request(
  _full_name text,
  _email text,
  _phone text,
  _category text,
  _project_type text,
  _project_description text,
  _amount_requested numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _recent_count int;
  _new_id uuid;
BEGIN
  -- Input validation
  IF length(trim(_full_name)) < 2 OR length(trim(_full_name)) > 100 THEN
    RAISE EXCEPTION 'Invalid full name';
  END IF;
  
  IF _email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  IF length(trim(_phone)) < 8 OR length(trim(_phone)) > 20 THEN
    RAISE EXCEPTION 'Invalid phone number';
  END IF;
  
  IF _category NOT IN ('bronze', 'silver', 'gold', 'diamond', 'platinium') THEN
    RAISE EXCEPTION 'Invalid category';
  END IF;
  
  IF _project_type NOT IN ('commerce', 'agriculture', 'artisanat', 'services', 'immobilier', 'technologie', 'education', 'sante', 'autre') THEN
    RAISE EXCEPTION 'Invalid project type';
  END IF;
  
  IF length(trim(_project_description)) < 20 OR length(trim(_project_description)) > 1000 THEN
    RAISE EXCEPTION 'Invalid project description';
  END IF;
  
  IF _amount_requested < 50000 OR _amount_requested > 5000000 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  -- Rate limiting: max 3 requests per email in the last 24 hours
  SELECT count(*) INTO _recent_count
  FROM public.financing_requests
  WHERE email = lower(trim(_email))
    AND created_at > now() - interval '24 hours';
  
  IF _recent_count >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
  END IF;

  -- Rate limiting: max 5 requests per phone in the last 24 hours
  SELECT count(*) INTO _recent_count
  FROM public.financing_requests
  WHERE phone = trim(_phone)
    AND created_at > now() - interval '24 hours';
  
  IF _recent_count >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
  END IF;

  -- Insert the request
  INSERT INTO public.financing_requests (
    full_name,
    email,
    phone,
    category,
    project_type,
    project_description,
    amount_requested
  ) VALUES (
    trim(_full_name),
    lower(trim(_email)),
    trim(_phone),
    _category,
    _project_type,
    trim(_project_description),
    _amount_requested
  )
  RETURNING id INTO _new_id;

  RETURN _new_id;
END;
$$;