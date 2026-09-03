CREATE TABLE public.invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  claimed_email text,
  claimed_at timestamptz,
  used_at timestamptz,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX invite_codes_active_code ON public.invite_codes (code) WHERE used_at IS NULL;

GRANT SELECT ON public.invite_codes TO authenticated;
GRANT ALL ON public.invite_codes TO service_role;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read invite codes" ON public.invite_codes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

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

  DELETE FROM public.invite_codes WHERE used_at IS NULL AND expires_at < now();

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
REVOKE ALL ON FUNCTION public.generate_invite_code() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_invite_code() TO authenticated;

CREATE OR REPLACE FUNCTION public.claim_invite_code(_code text, _email text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN true;
  END IF;

  SELECT id INTO v_id FROM public.invite_codes
  WHERE code = trim(_code) AND used_at IS NULL AND expires_at > now()
  ORDER BY created_at DESC LIMIT 1;

  IF v_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.invite_codes
  SET claimed_email = lower(trim(_email)), claimed_at = now()
  WHERE id = v_id;
  RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.claim_invite_code(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_invite_code(text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.enforce_invite_code()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_id FROM public.invite_codes
  WHERE used_at IS NULL
    AND claimed_email = lower(trim(NEW.email))
    AND claimed_at IS NOT NULL
    AND expires_at > now()
  ORDER BY claimed_at DESC LIMIT 1;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'A valid invite code from an admin is required to register';
  END IF;

  UPDATE public.invite_codes SET used_at = now(), used_by = NEW.id WHERE id = v_id;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.enforce_invite_code() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER profiles_enforce_invite BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_invite_code();