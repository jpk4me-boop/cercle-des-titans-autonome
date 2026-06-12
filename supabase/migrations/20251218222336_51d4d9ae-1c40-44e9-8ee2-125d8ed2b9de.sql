-- Add recommended_category column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN recommended_category text;