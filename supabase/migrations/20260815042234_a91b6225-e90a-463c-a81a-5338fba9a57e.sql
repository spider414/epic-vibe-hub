DROP POLICY "published events public" ON public.events;
CREATE POLICY "events readable anon" ON public.events FOR SELECT TO anon USING (is_published);
CREATE POLICY "events readable auth" ON public.events FOR SELECT TO authenticated USING (is_published OR public.has_role(auth.uid(),'admin'));

DROP POLICY "approved testimonials public" ON public.testimonials;
CREATE POLICY "testimonials readable anon" ON public.testimonials FOR SELECT TO anon USING (is_approved);
CREATE POLICY "testimonials readable auth" ON public.testimonials FOR SELECT TO authenticated USING (is_approved OR public.has_role(auth.uid(),'admin'));

DROP POLICY "visible media public" ON public.media;
CREATE POLICY "media readable anon" ON public.media FOR SELECT TO anon USING (is_visible);
CREATE POLICY "media readable auth" ON public.media FOR SELECT TO authenticated USING (is_visible OR public.has_role(auth.uid(),'admin'));

DROP POLICY "active packages public" ON public.packages;
CREATE POLICY "packages readable anon" ON public.packages FOR SELECT TO anon USING (is_active);
CREATE POLICY "packages readable auth" ON public.packages FOR SELECT TO authenticated USING (is_active OR public.has_role(auth.uid(),'admin'));

DROP POLICY "active dancers public" ON public.dancers;
CREATE POLICY "dancers readable anon" ON public.dancers FOR SELECT TO anon USING (is_active);
CREATE POLICY "dancers readable auth" ON public.dancers FOR SELECT TO authenticated USING (is_active OR public.has_role(auth.uid(),'admin'));