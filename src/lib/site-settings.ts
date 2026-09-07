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

// ---------- Contact / social details (admin editable) ----------

import { SITE } from "@/lib/site";

export type ContactInfo = {
  phone: string;
  whatsapp: string;
  email: string;
  city: string;
  instagram: string;
  tiktok: string;
  x: string;
  youtube: string;
};

export const CONTACT_INFO_KEY = "contact_info";

export const DEFAULT_CONTACT: ContactInfo = {
  phone: SITE.phone,
  whatsapp: SITE.whatsapp,
  email: SITE.email,
  city: SITE.city,
  instagram: SITE.socials.instagram,
  tiktok: SITE.socials.tiktok,
  x: SITE.socials.x,
  youtube: SITE.socials.youtube,
};

export async function fetchContactInfo(): Promise<ContactInfo> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", CONTACT_INFO_KEY)
    .maybeSingle();
  if (error) throw error;
  const value = (data?.value ?? null) as Partial<ContactInfo> | null;
  return { ...DEFAULT_CONTACT, ...(value ?? {}) };
}

export const contactInfoQuery = {
  queryKey: ["site-settings", CONTACT_INFO_KEY],
  queryFn: fetchContactInfo,
};
