-- Create trigger to add demo contributions for new users
CREATE OR REPLACE FUNCTION public.add_demo_contributions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert demo contributions for the new user
  INSERT INTO public.contributions (user_id, amount, status, due_date, paid_date, payment_method, notes)
  VALUES 
    (new.id, 500.00, 'paid', (CURRENT_DATE - INTERVAL '3 months')::date, (CURRENT_DATE - INTERVAL '3 months' + INTERVAL '2 days')::date, 'Virement bancaire', 'Première cotisation'),
    (new.id, 500.00, 'paid', (CURRENT_DATE - INTERVAL '2 months')::date, (CURRENT_DATE - INTERVAL '2 months' + INTERVAL '1 day')::date, 'Carte bancaire', NULL),
    (new.id, 750.00, 'paid', (CURRENT_DATE - INTERVAL '1 month')::date, (CURRENT_DATE - INTERVAL '1 month' + INTERVAL '3 days')::date, 'Virement bancaire', 'Cotisation majorée'),
    (new.id, 500.00, 'pending', CURRENT_DATE::date, NULL, NULL, 'Cotisation du mois en cours'),
    (new.id, 500.00, 'pending', (CURRENT_DATE + INTERVAL '1 month')::date, NULL, NULL, 'Prochaine échéance'),
    (new.id, 500.00, 'pending', (CURRENT_DATE + INTERVAL '2 months')::date, NULL, NULL, NULL);
  
  RETURN new;
END;
$$;

-- Create trigger that fires after a new user is created
CREATE TRIGGER on_auth_user_created_add_contributions
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.add_demo_contributions();