CREATE POLICY "Events managers upload flyers" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'site-media' AND (storage.foldername(name))[1] = 'flyers' AND public.has_role(auth.uid(), 'events'))
WITH CHECK (bucket_id = 'site-media' AND (storage.foldername(name))[1] = 'flyers' AND public.has_role(auth.uid(), 'events'));