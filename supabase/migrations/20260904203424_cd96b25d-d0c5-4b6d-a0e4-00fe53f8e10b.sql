CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TABLE (code text, expires_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code text;
  v_exp timestamptz := now() + interval '5 minutes';
  i int := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can generate invite codes';
  END IF;

  DELETE FROM public.invite_codes ic WHERE ic.used_at IS NULL AND ic.expires_at < now();

  LOOP
    i := i + 1;
    v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');
    BEGIN
      INSERT INTO public.invite_codes (code, created_by, expires_at)
      VALUES (v_code, auth.uid(), v_exp);
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF i > 20 THEN RAISE EXCEPTION 'Could not generate a unique code'; END IF;
    END;
  END LOOP;

  RETURN QUERY SELECT v_code, v_exp;
END; $$;