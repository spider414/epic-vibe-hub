CREATE SEQUENCE IF NOT EXISTS public.dance_booking_reference_seq;

CREATE TABLE public.dance_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  event_type text,
  event_date date,
  location text,
  dancers_count integer,
  duration text,
  dance_style text,
  needs_choreography boolean NOT NULL DEFAULT false,
  needs_classes boolean NOT NULL DEFAULT false,
  budget text,
  details text,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  assigned_dancers uuid[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'new',
  internal_notes text,
  quote_amount numeric,
  amount_paid numeric,
  payment_status text NOT NULL DEFAULT 'unpaid',
  balance_amount numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dance_bookings TO authenticated;
GRANT ALL ON public.dance_bookings TO service_role;

ALTER TABLE public.dance_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage dance bookings" ON public.dance_bookings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.set_dance_booking_reference()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.reference IS NULL THEN
    NEW.reference := 'EPIC-DANCE-' || lpad(nextval('public.dance_booking_reference_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER dance_bookings_reference BEFORE INSERT ON public.dance_bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_dance_booking_reference();

CREATE OR REPLACE FUNCTION public.sync_dance_booking_balance()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.quote_amount IS NOT NULL THEN
    NEW.balance_amount := GREATEST(NEW.quote_amount - COALESCE(NEW.amount_paid, 0), 0);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER dance_bookings_balance BEFORE INSERT OR UPDATE ON public.dance_bookings
  FOR EACH ROW EXECUTE FUNCTION public.sync_dance_booking_balance();

CREATE TRIGGER dance_bookings_updated_at BEFORE UPDATE ON public.dance_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.create_dance_booking(_payload jsonb)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _ref text;
BEGIN
  IF length(coalesce(_payload->>'full_name','')) < 2
     OR length(coalesce(_payload->>'email','')) < 5
     OR length(coalesce(_payload->>'phone','')) < 7 THEN
    RAISE EXCEPTION 'Missing contact details';
  END IF;

  INSERT INTO public.dance_bookings (
    full_name, email, phone, event_type, event_date, location, dancers_count,
    duration, dance_style, needs_choreography, needs_classes, budget, details, attachments
  ) VALUES (
    left(_payload->>'full_name', 120),
    left(_payload->>'email', 255),
    left(_payload->>'phone', 40),
    left(nullif(_payload->>'event_type',''), 80),
    nullif(_payload->>'event_date','')::date,
    left(nullif(_payload->>'location',''), 240),
    nullif(_payload->>'dancers_count','')::integer,
    left(nullif(_payload->>'duration',''), 80),
    left(nullif(_payload->>'dance_style',''), 120),
    coalesce((_payload->>'needs_choreography')::boolean, false),
    coalesce((_payload->>'needs_classes')::boolean, false),
    left(nullif(_payload->>'budget',''), 80),
    left(nullif(_payload->>'details',''), 4000),
    coalesce(_payload->'attachments', '[]'::jsonb)
  )
  RETURNING reference INTO _ref;

  RETURN _ref;
END; $$;

GRANT EXECUTE ON FUNCTION public.create_dance_booking(jsonb) TO anon, authenticated;