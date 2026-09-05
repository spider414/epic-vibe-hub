REVOKE EXECUTE ON FUNCTION public.has_section(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_team_member(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_section(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_team_member(uuid) TO authenticated;