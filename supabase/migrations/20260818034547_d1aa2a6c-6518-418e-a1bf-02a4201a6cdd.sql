-- Booking reference sequence
CREATE SEQUENCE IF NOT EXISTS public.booking_reference_seq START 1;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS reference text,
  ADD COLUMN IF NOT EXISTS contact_method text NOT NULL DEFAULT 'phone',
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS alt_date date,
  ADD COLUMN IF NOT EXISTS duration text,
  ADD COLUMN IF NOT EXISTS services text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS quote_amount numeric,
  ADD COLUMN IF NOT EXISTS quote_notes text,
  ADD COLUMN IF NOT EXISTS balance_amount numeric;

CREATE OR REPLACE FUNCTION public.set_booking_reference()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.reference IS NULL THEN
    NEW.reference := 'EPIC-BOOK-' || lpad(nextval('public.booking_reference_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS bookings_reference ON public.bookings;
CREATE TRIGGER bookings_reference BEFORE INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.set_booking_reference();

UPDATE public.bookings SET reference = 'EPIC-BOOK-' || lpad(nextval('public.booking_reference_seq')::text, 6, '0')
WHERE reference IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_reference_key ON public.bookings (reference);

-- Keep balance in sync with quote/deposit when not explicitly set
CREATE OR REPLACE FUNCTION public.sync_booking_balance()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.quote_amount IS NOT NULL THEN
    NEW.balance_amount := GREATEST(NEW.quote_amount - COALESCE(NEW.deposit_amount, 0), 0);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS bookings_balance ON public.bookings;
CREATE TRIGGER bookings_balance BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.sync_booking_balance();

-- Public submission entry point: inserts a booking and returns only its reference.
CREATE OR REPLACE FUNCTION public.create_booking(_payload jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _ref text;
BEGIN
  IF length(coalesce(_payload->>'full_name','')) < 2
     OR length(coalesce(_payload->>'email','')) < 5
     OR length(coalesce(_payload->>'phone','')) < 7 THEN
    RAISE EXCEPTION 'Missing contact details';
  END IF;

  INSERT INTO public.bookings (
    booking_type, full_name, email, phone, organisation, contact_method,
    event_type, occasion, preferred_date, alt_date, location, guest_count,
    duration, budget, services, package_name, details, attachments
  ) VALUES (
    coalesce(_payload->>'booking_type','event_hosting'),
    left(_payload->>'full_name', 120),
    left(_payload->>'email', 255),
    left(_payload->>'phone', 40),
    left(nullif(_payload->>'organisation',''), 160),
    coalesce(nullif(_payload->>'contact_method',''), 'phone'),
    left(nullif(_payload->>'event_type',''), 80),
    left(nullif(_payload->>'occasion',''), 120),
    nullif(_payload->>'preferred_date','')::date,
    nullif(_payload->>'alt_date','')::date,
    left(nullif(_payload->>'location',''), 240),
    nullif(_payload->>'guest_count','')::integer,
    left(nullif(_payload->>'duration',''), 80),
    left(nullif(_payload->>'budget',''), 80),
    coalesce((SELECT array_agg(left(v::text, 60)) FROM jsonb_array_elements_text(coalesce(_payload->'services','[]'::jsonb)) v), '{}'),
    left(nullif(_payload->>'package_name',''), 120),
    left(nullif(_payload->>'details',''), 4000),
    coalesce(_payload->'attachments', '[]'::jsonb)
  )
  RETURNING reference INTO _ref;

  RETURN _ref;
END; $$;

REVOKE ALL ON FUNCTION public.create_booking(jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.create_booking(jsonb) TO anon, authenticated;