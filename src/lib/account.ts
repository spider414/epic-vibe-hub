import { supabase } from "@/integrations/supabase/client";

/** Where a signed-in user should land: team members go to the dashboard, guests to their account. */
export async function homeForCurrentUser(): Promise<"/admin" | "/account"> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) return "/account";
  const { data: prof } = await supabase
    .from("profiles")
    .select("account_type" as never)
    .eq("id", id)
    .maybeSingle();
  return (prof as { account_type?: string } | null)?.account_type === "team" ? "/admin" : "/account";
}
