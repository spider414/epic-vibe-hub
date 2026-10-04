ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'guest' CHECK (account_type IN ('team','guest'));
-- Existing accounts are all team members
UPDATE public.profiles SET account_type = 'team';

CREATE OR REPLACE FUNCTION public.enforce_invite_code()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    NEW.account_type := 'team';
    RETURN NEW;
  END IF;
  SELECT id INTO v_id FROM public.invite_codes
  WHERE used_at IS NULL AND claimed_email = lower(trim(NEW.email))
    AND claimed_at IS NOT NULL AND expires_at > now()
  ORDER BY claimed_at DESC LIMIT 1;
  IF v_id IS NULL THEN
    NEW.account_type := 'guest';  -- no code: ordinary guest account
    RETURN NEW;
  END IF;
  NEW.account_type := 'team';
  UPDATE public.invite_codes SET used_at = now(), used_by = NEW.id WHERE id = v_id;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.enforce_invite_code() FROM PUBLIC, anon, authenticated;

-- Prevent users changing their own account_type
CREATE OR REPLACE FUNCTION public.lock_account_type()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.account_type IS DISTINCT FROM OLD.account_type AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.account_type := OLD.account_type;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS profiles_lock_account_type ON public.profiles;
CREATE TRIGGER profiles_lock_account_type BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.lock_account_type();

CREATE OR REPLACE FUNCTION public.get_my_activity()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  RETURN jsonb_build_object(
    'orders', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'order_number', o.order_number, 'reference', o.reference, 'access_token', o.access_token,
        'quantity', o.quantity, 'amount_total', o.amount_total, 'payment_status', o.payment_status,
        'ticket_type', o.ticket_type, 'created_at', o.created_at,
        'event_title', e.title, 'event_starts_at', e.starts_at, 'event_venue', e.venue, 'event_slug', e.slug
      ) ORDER BY o.created_at DESC)
      FROM public.ticket_orders o LEFT JOIN public.events e ON e.id = o.event_id
      WHERE o.user_id = v_uid OR (v_email <> '' AND lower(o.email) = v_email)), '[]'::jsonb),
    'bookings', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'reference', b.reference, 'event_type', coalesce(b.event_type, b.occasion), 'date', b.preferred_date,
        'location', b.location, 'status', b.status, 'quote_amount', b.quote_amount,
        'deposit_amount', b.deposit_amount, 'balance_amount', b.balance_amount, 'created_at', b.created_at
      ) ORDER BY b.created_at DESC) FROM public.bookings b WHERE v_email <> '' AND lower(b.email) = v_email), '[]'::jsonb),
    'dance_bookings', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'reference', d.reference, 'event_type', d.event_type, 'date', d.event_date, 'location', d.location,
        'status', d.status, 'quote_amount', d.quote_amount, 'amount_paid', d.amount_paid,
        'balance_amount', d.balance_amount, 'created_at', d.created_at
      ) ORDER BY d.created_at DESC) FROM public.dance_bookings d WHERE v_email <> '' AND lower(d.email) = v_email), '[]'::jsonb)
  );
END; $$;
REVOKE ALL ON FUNCTION public.get_my_activity() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_activity() TO authenticated;