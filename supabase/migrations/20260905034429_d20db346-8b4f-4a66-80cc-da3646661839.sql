ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'events';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tickets';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'bookings';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dance';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'content';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'audience';

CREATE OR REPLACE FUNCTION public.has_section(_user_id uuid, _section text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND (role::text = 'admin' OR role::text = _section)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_team_member(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id);
$$;

-- EVENTS: events staff manage, ticket staff can read
CREATE POLICY "events staff manage events" ON public.events
  FOR ALL TO authenticated
  USING (public.has_section(auth.uid(), 'events'))
  WITH CHECK (public.has_section(auth.uid(), 'events'));
CREATE POLICY "team can read events" ON public.events
  FOR SELECT TO authenticated
  USING (public.is_team_member(auth.uid()));

-- TICKETS
CREATE POLICY "ticket staff manage ticket types" ON public.ticket_types
  FOR ALL TO authenticated
  USING (public.has_section(auth.uid(), 'tickets'))
  WITH CHECK (public.has_section(auth.uid(), 'tickets'));
CREATE POLICY "ticket staff manage orders" ON public.ticket_orders
  FOR ALL TO authenticated
  USING (public.has_section(auth.uid(), 'tickets'))
  WITH CHECK (public.has_section(auth.uid(), 'tickets'));
CREATE POLICY "ticket staff manage tickets" ON public.tickets
  FOR ALL TO authenticated
  USING (public.has_section(auth.uid(), 'tickets'))
  WITH CHECK (public.has_section(auth.uid(), 'tickets'));

-- BOOKINGS
CREATE POLICY "booking staff manage bookings" ON public.bookings
  FOR ALL TO authenticated
  USING (public.has_section(auth.uid(), 'bookings'))
  WITH CHECK (public.has_section(auth.uid(), 'bookings'));

-- DANCE
CREATE POLICY "dance staff manage dance bookings" ON public.dance_bookings
  FOR ALL TO authenticated
  USING (public.has_section(auth.uid(), 'dance'))
  WITH CHECK (public.has_section(auth.uid(), 'dance'));
CREATE POLICY "dance staff manage dancers" ON public.dancers
  FOR ALL TO authenticated
  USING (public.has_section(auth.uid(), 'dance'))
  WITH CHECK (public.has_section(auth.uid(), 'dance'));

-- CONTENT
CREATE POLICY "content staff manage media" ON public.media
  FOR ALL TO authenticated
  USING (public.has_section(auth.uid(), 'content'))
  WITH CHECK (public.has_section(auth.uid(), 'content'));
CREATE POLICY "content staff manage testimonials" ON public.testimonials
  FOR ALL TO authenticated
  USING (public.has_section(auth.uid(), 'content'))
  WITH CHECK (public.has_section(auth.uid(), 'content'));
CREATE POLICY "content staff manage packages" ON public.packages
  FOR ALL TO authenticated
  USING (public.has_section(auth.uid(), 'content'))
  WITH CHECK (public.has_section(auth.uid(), 'content'));
CREATE POLICY "content staff manage site settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (public.has_section(auth.uid(), 'content'))
  WITH CHECK (public.has_section(auth.uid(), 'content'));

-- AUDIENCE
CREATE POLICY "audience staff manage subscribers" ON public.subscribers
  FOR ALL TO authenticated
  USING (public.has_section(auth.uid(), 'audience'))
  WITH CHECK (public.has_section(auth.uid(), 'audience'));
CREATE POLICY "audience staff manage enquiries" ON public.enquiries
  FOR ALL TO authenticated
  USING (public.has_section(auth.uid(), 'audience'))
  WITH CHECK (public.has_section(auth.uid(), 'audience'));
