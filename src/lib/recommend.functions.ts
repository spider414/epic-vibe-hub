import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { recommendEvents } from "./recommend.server";

export const getEventRecommendations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ interests: z.string().trim().min(3).max(500) }).parse(data))
  .handler(async ({ data }) => recommendEvents(data.interests));
