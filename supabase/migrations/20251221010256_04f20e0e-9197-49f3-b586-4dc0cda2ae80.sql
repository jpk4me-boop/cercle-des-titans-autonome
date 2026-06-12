-- =====================================================
-- 1. Create secure RPC function for transaction creation
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_transaction(
  _reference text,
  _full_name text,
  _phone text,
  _email text,
  _category text,
  _amount numeric,
  _payment_method text
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
  -- Input validation: full_name
  IF length(trim(_full_name)) < 2 OR length(trim(_full_name)) > 100 THEN
    RAISE EXCEPTION 'Invalid name';
  END IF;
  
  -- Input validation: phone
  IF length(trim(_phone)) < 8 OR length(trim(_phone)) > 20 THEN
    RAISE EXCEPTION 'Invalid phone';
  END IF;
  
  -- Input validation: category
  IF lower(_category) NOT IN ('bronze', 'silver', 'gold', 'diamond', 'platinum', 'prestige') THEN
    RAISE EXCEPTION 'Invalid category';
  END IF;
  
  -- Input validation: amount
  IF _amount < 5000 OR _amount > 200000 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;
  
  -- Input validation: payment_method
  IF _payment_method NOT IN ('MTN MoMo', 'Orange Money') THEN
    RAISE EXCEPTION 'Invalid payment method';
  END IF;
  
  -- Rate limiting: max 5 transactions per phone in last hour
  SELECT count(*) INTO _recent_count
  FROM public.transactions
  WHERE phone = trim(_phone)
    AND created_at > now() - interval '1 hour';
  
  IF _recent_count >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
  END IF;
  
  -- Insert transaction
  INSERT INTO public.transactions (
    reference, full_name, phone, email, category, 
    amount, payment_method, status
  ) VALUES (
    _reference, 
    trim(_full_name), 
    trim(_phone), 
    CASE WHEN _email IS NOT NULL AND trim(_email) != '' 
      THEN lower(trim(_email)) 
      ELSE NULL 
    END,
    _category, 
    _amount, 
    _payment_method, 
    'pending'
  )
  RETURNING id INTO _new_id;
  
  RETURN _new_id;
END;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.create_transaction(text, text, text, text, text, numeric, text) TO anon;
GRANT EXECUTE ON FUNCTION public.create_transaction(text, text, text, text, text, numeric, text) TO authenticated;

-- =====================================================
-- 2. Remove the overly permissive direct INSERT policy
-- =====================================================
DROP POLICY IF EXISTS "Anyone can insert transactions" ON public.transactions;

-- =====================================================
-- 3. Add receipt_storage_path column for UUID filenames
-- =====================================================
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS receipt_storage_path text;