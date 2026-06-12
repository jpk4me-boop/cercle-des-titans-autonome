-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view transactions by reference" ON public.transactions;

-- Create a secure RPC function for reference lookup (limited fields, no sensitive data like phone/email)
CREATE OR REPLACE FUNCTION public.verify_transaction_by_reference(_reference text)
RETURNS TABLE (
  reference text,
  full_name text,
  category text,
  amount numeric,
  payment_method text,
  status text,
  transaction_id text,
  receipt_url text,
  created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT 
    t.reference,
    t.full_name,
    t.category,
    t.amount,
    t.payment_method,
    t.status,
    t.transaction_id,
    t.receipt_url,
    t.created_at
  FROM public.transactions t
  WHERE t.reference = _reference
  LIMIT 1;
$$;

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.verify_transaction_by_reference(text) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_transaction_by_reference(text) TO authenticated;