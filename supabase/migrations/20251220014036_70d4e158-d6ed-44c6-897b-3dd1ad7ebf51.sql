-- Create financing requests table
CREATE TABLE public.financing_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  category TEXT NOT NULL,
  project_type TEXT NOT NULL,
  project_description TEXT NOT NULL,
  amount_requested NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financing_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can submit a request
CREATE POLICY "Anyone can submit financing requests" 
ON public.financing_requests 
FOR INSERT 
WITH CHECK (true);

-- Policy: Admins can view all requests
CREATE POLICY "Admins can view all financing requests" 
ON public.financing_requests 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Admins can update requests
CREATE POLICY "Admins can update financing requests" 
ON public.financing_requests 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_financing_requests_updated_at
BEFORE UPDATE ON public.financing_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();