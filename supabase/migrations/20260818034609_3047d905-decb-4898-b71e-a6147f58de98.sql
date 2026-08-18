CREATE POLICY "anyone can upload booking references"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'booking-uploads');

CREATE POLICY "admins read booking uploads"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'booking-uploads' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete booking uploads"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'booking-uploads' AND public.has_role(auth.uid(), 'admin'));