import { createOpenAI } from "@ai-sdk/openai";
import { createClient } from "@supabase/supabase-js";
import { streamText } from "ai";

import type { Database } from "@/integrations/supabase/types";

const RUN_ID = "X-Lovable-AIG-Run-ID";
const MODEL = "openai/gpt-6-astra";

function runIdFetch() {
  let runId: string | undefined;
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (runId && !headers.has(RUN_ID)) headers.set(RUN_ID, runId);
    const res = await fetch(input, { ...init, headers });
    runId ??= res.headers.get(RUN_ID)?.trim() || undefined;
    return res;
  };
}

export type Recommendation = {
  slug: string;
  title: string;
  starts_at: string;
  venue: string;
  city: string;
  flyer_url: string | null;
  reason: string;
};

export async function recommendEvents(interests: string): Promise<Recommendation[]> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured.");

  const db = createClient<Database>(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data: events, error } = await db
    .from("events")
    .select("slug, title, description, category, starts_at, venue, city, flyer_url, dress_code, age_limit, price_regular")
    .eq("is_published", true)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at")
    .limit(40);
  if (error) throw new Error("Couldn't load events.");
  if (!events?.length) return [];

  const catalog = events.map((e) => ({
    slug: e.slug,
    title: e.title,
    category: e.category,
    date: e.starts_at,
    where: `${e.venue}, ${e.city}`,
    from_price_naira: e.price_regular,
    dress_code: e.dress_code,
    age: e.age_limit,
    about: e.description.slice(0, 400),
  }));

  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch(),
  });

  const result = streamText({
    model: provider.responses(MODEL),
    instructions:
      "You recommend upcoming Epic Entertainment party events in Nigeria to a guest. Only choose from the provided catalog. " +
      'Reply with JSON only: {"picks":[{"slug":"...","reason":"one friendly sentence, max 25 words, why it fits"}]}. ' +
      "Pick up to 3 best matches, best first. If nothing fits well, still pick the closest 1-2.",
    messages: [
      {
        role: "user",
        content: `Guest interests: ${interests}\n\nCatalog (json):\n${JSON.stringify(catalog)}`,
      },
    ],
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  const text = await result.text;
  const match = text.match(/\{[\s\S]*\}/);
  let picks: { slug?: string; reason?: string }[] = [];
  try {
    picks = (JSON.parse(match?.[0] ?? "{}").picks ?? []) as typeof picks;
  } catch {
    picks = [];
  }
  const bySlug = new Map(events.map((e) => [e.slug, e]));
  return picks
    .filter((p) => p.slug && bySlug.has(p.slug))
    .slice(0, 3)
    .map((p) => {
      const e = bySlug.get(p.slug!)!;
      return {
        slug: e.slug,
        title: e.title,
        starts_at: e.starts_at,
        venue: e.venue,
        city: e.city,
        flyer_url: e.flyer_url,
        reason: String(p.reason ?? "").slice(0, 200),
      };
    });
}
