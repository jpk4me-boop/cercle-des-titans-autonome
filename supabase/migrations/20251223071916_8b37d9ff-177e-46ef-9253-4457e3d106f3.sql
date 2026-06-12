-- Add notification preferences columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS reminder_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS marketing_notifications boolean DEFAULT false;