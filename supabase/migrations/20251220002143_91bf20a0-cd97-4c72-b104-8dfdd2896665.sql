-- Create transactions table for payment records
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  transaction_id TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Public can insert transactions (for anonymous payments)
CREATE POLICY "Anyone can insert transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (true);

-- Public can view transactions by reference (for verification)
CREATE POLICY "Anyone can view transactions by reference" 
ON public.transactions 
FOR SELECT 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true);

-- Allow public access to receipts
CREATE POLICY "Public receipts are viewable by everyone" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'receipts');

-- Allow insert to receipts bucket (from edge functions)
CREATE POLICY "Service role can upload receipts" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'receipts');