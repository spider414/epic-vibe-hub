import { supabase } from "@/integrations/supabase/client";

export type HeroMedia = { type: "image" | "video"; url: string };

export const HERO_MEDIA_KEY = "hero_media";

export async function fetchHeroMedia(): Promise<HeroMedia | null> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", HERO_MEDIA_KEY)
    .maybeSingle();
  if (error) throw error;
  const value = (data?.value ?? null) as HeroMedia | null;
  if (!value || !value.url) return null;
  return { type: value.type === "video" ? "video" : "image", url: value.url };
}

export const heroMediaQuery = {
  queryKey: ["site-settings", HERO_MEDIA_KEY],
  queryFn: fetchHeroMedia,
};
