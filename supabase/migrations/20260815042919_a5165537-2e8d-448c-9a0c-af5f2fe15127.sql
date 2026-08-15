-- ============ EVENTS ============
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS map_query text,
  ADD COLUMN IF NOT EXISTS dress_code text,
  ADD COLUMN IF NOT EXISTS rules text,
  ADD COLUMN IF NOT EXISTS age_limit text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';

UPDATE public.events SET status = CASE WHEN is_published THEN 'published' ELSE 'draft' END;

CREATE OR REPLACE FUNCTION public.sync_event_publish()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('draft','published','sold_out','completed','cancelled') THEN
    RAISE EXCEPTION 'Invalid event status %', NEW.status;
  END IF;
  NEW.is_published := NEW.status <> 'draft';
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.sync_event_publish() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS events_sync_publish ON public.events;
CREATE TRIGGER events_sync_publish BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.sync_event_publish();

-- ============ TICKET TYPES ============
CREATE TABLE IF NOT EXISTS public.ticket_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  quantity_total integer,
  quantity_sold integer NOT NULL DEFAULT 0,
  sale_starts_at timestamptz,
  sale_ends_at timestamptz,
  status text NOT NULL DEFAULT 'on_sale',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ticket_types TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_types TO authenticated;
GRANT ALL ON public.ticket_types TO service_role;
ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ticket types readable anon" ON public.ticket_types FOR SELECT TO anon
USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.is_published));
CREATE POLICY "ticket types readable auth" ON public.ticket_types FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.is_published)
       OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage ticket types" ON public.ticket_types FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER ticket_types_updated_at BEFORE UPDATE ON public.ticket_types
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed a Regular/VIP type from existing event pricing
INSERT INTO public.ticket_types (event_id, name, description, price, quantity_total, sort_order)
SELECT id, 'Regular', 'General admission', price_regular, capacity, 1 FROM public.events;
INSERT INTO public.ticket_types (event_id, name, description, price, sort_order)
SELECT id, 'VIP', 'Priority entry + reserved seating', price_vip, 2
FROM public.events WHERE price_vip IS NOT NULL;

-- ============ ORDERS ============
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1;

ALTER TABLE public.ticket_orders
  ADD COLUMN IF NOT EXISTS order_number text,
  ADD COLUMN IF NOT EXISTS access_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS ticket_type_id uuid REFERENCES public.ticket_types(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_provider text NOT NULL DEFAULT 'bank_transfer',
  ADD COLUMN IF NOT EXISTS provider_reference text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'EPIC-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.order_number_seq')::text, 6, '0');
  END IF;
  NEW.reference := NEW.order_number;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.set_order_number() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER ticket_orders_number BEFORE INSERT ON public.ticket_orders
FOR EACH ROW EXECUTE FUNCTION public.set_order_number();

UPDATE public.ticket_orders SET order_number = reference WHERE order_number IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ticket_orders_order_number_key ON public.ticket_orders(order_number);
CREATE UNIQUE INDEX IF NOT EXISTS ticket_orders_access_token_key ON public.ticket_orders(access_token);

-- ============ TICKETS ============
CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.ticket_orders(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  ticket_type_id uuid REFERENCES public.ticket_types(id) ON DELETE SET NULL,
  ticket_code uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  serial integer NOT NULL DEFAULT 1,
  holder_name text,
  status text NOT NULL DEFAULT 'pending',
  checked_in_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage tickets" ON public.tickets FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "own tickets readable" ON public.tickets FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.ticket_orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- create one ticket row per unit when an order is placed
CREATE OR REPLACE FUNCTION public.create_tickets_for_order()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE i integer;
BEGIN
  FOR i IN 1..GREATEST(NEW.quantity, 1) LOOP
    INSERT INTO public.tickets (order_id, event_id, ticket_type_id, serial, holder_name, status)
    VALUES (NEW.id, NEW.event_id, NEW.ticket_type_id, i, NEW.customer_name, NEW.payment_status);
  END LOOP;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.create_tickets_for_order() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER ticket_orders_create_tickets AFTER INSERT ON public.ticket_orders
FOR EACH ROW EXECUTE FUNCTION public.create_tickets_for_order();

-- keep tickets + sold counters in sync with order payment status
CREATE OR REPLACE FUNCTION public.sync_order_payment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    UPDATE public.tickets SET status = NEW.payment_status
      WHERE order_id = NEW.id AND status <> 'checked_in';

    IF NEW.payment_status = 'paid' AND OLD.payment_status <> 'paid' THEN
      NEW.paid_at := now();
      UPDATE public.events SET tickets_sold = tickets_sold + NEW.quantity WHERE id = NEW.event_id;
      IF NEW.ticket_type_id IS NOT NULL THEN
        UPDATE public.ticket_types SET quantity_sold = quantity_sold + NEW.quantity
          WHERE id = NEW.ticket_type_id;
      END IF;
    ELSIF OLD.payment_status = 'paid' AND NEW.payment_status <> 'paid' THEN
      UPDATE public.events SET tickets_sold = GREATEST(tickets_sold - NEW.quantity, 0)
        WHERE id = NEW.event_id;
      IF NEW.ticket_type_id IS NOT NULL THEN
        UPDATE public.ticket_types SET quantity_sold = GREATEST(quantity_sold - NEW.quantity, 0)
          WHERE id = NEW.ticket_type_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.sync_order_payment() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER ticket_orders_sync_payment BEFORE UPDATE ON public.ticket_orders
FOR EACH ROW EXECUTE FUNCTION public.sync_order_payment();

-- ============ CUSTOMER TICKET LOOKUP ============
CREATE OR REPLACE FUNCTION public.get_order_by_token(_token uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'order', jsonb_build_object(
      'order_number', o.order_number,
      'customer_name', o.customer_name,
      'email', o.email,
      'quantity', o.quantity,
      'amount_total', o.amount_total,
      'payment_status', o.payment_status,
      'ticket_type', COALESCE(tt.name, o.ticket_type),
      'created_at', o.created_at
    ),
    'event', jsonb_build_object(
      'title', e.title,
      'slug', e.slug,
      'starts_at', e.starts_at,
      'venue', e.venue,
      'city', e.city,
      'flyer_url', e.flyer_url,
      'status', e.status
    ),
    'tickets', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'ticket_code', t.ticket_code, 'serial', t.serial,
        'status', t.status, 'holder_name', t.holder_name
      ) ORDER BY t.serial)
      FROM public.tickets t WHERE t.order_id = o.id
    ), '[]'::jsonb)
  )
  FROM public.ticket_orders o
  LEFT JOIN public.events e ON e.id = o.event_id
  LEFT JOIN public.ticket_types tt ON tt.id = o.ticket_type_id
  WHERE o.access_token = _token;
$$;
GRANT EXECUTE ON FUNCTION public.get_order_by_token(uuid) TO anon, authenticated;