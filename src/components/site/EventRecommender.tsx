import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getEventRecommendations } from "@/lib/recommend.functions";
import { formatEventDate } from "@/lib/site";

type Rec = Awaited<ReturnType<typeof getEventRecommendations>>[number];

export function EventRecommender() {
  const recommend = useServerFn(getEventRecommendations);
  const [interests, setInterests] = useState("");
  const [busy, setBusy] = useState(false);
  const [recs, setRecs] = useState<Rec[] | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (interests.trim().length < 3) {
      toast.error("Tell us a little about what you enjoy");
      return;
    }
    setBusy(true);
    try {
      setRecs(await recommend({ data: { interests: interests.trim() } }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't get suggestions. Try again later.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="min-w-0 border-y border-border py-6 sm:py-8">
      <h2 className="flex items-start gap-2 font-display text-2xl leading-tight">
        <Sparkles className="mt-1 h-5 w-5 shrink-0 text-primary" /> Find your next party
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell us what you're into — music, vibe, budget, who you're rolling with — and our AI picks
        upcoming events for you.
      </p>
      <form onSubmit={submit} className="mt-4 min-w-0 space-y-3">
        <label htmlFor="event-interests" className="block text-sm font-medium">Your interests</label>
        <Textarea
          id="event-interests"
          className="min-h-32 w-full min-w-0 resize-y text-base md:text-base"
          rows={3}
          maxLength={500}
          placeholder="e.g. Afrobeats and amapiano, pool or beach vibes, going with 4 friends, under ₦20k"
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
        />
        <Button disabled={busy} className="min-h-11 w-full bg-hype text-primary-foreground hover:opacity-90 sm:w-auto">
          {busy ? "Finding events…" : "Get suggestions"}
        </Button>
      </form>

      {recs && (
        <div className="mt-6 grid min-w-0 gap-3" aria-live="polite" aria-busy={busy}>
          {recs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No upcoming events right now — check back soon.
            </p>
          ) : (
            recs.map((r) => (
              <Link
                key={r.slug}
                to="/events/$slug"
                params={{ slug: r.slug }}
                className="grid min-w-0 grid-cols-1 gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/60 focus-visible:outline-2 focus-visible:outline-ring sm:flex sm:gap-4 sm:p-4"
              >
                {r.flyer_url && (
                  <img src={r.flyer_url} alt="" className="aspect-video w-full rounded-md object-cover sm:aspect-square sm:h-20 sm:w-20 sm:shrink-0" />
                )}
                <div className="min-w-0 [overflow-wrap:anywhere]">
                  <p className="font-display text-xl leading-tight">{r.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {formatEventDate(r.starts_at)} · {r.venue}, {r.city}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">{r.reason}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </section>
  );
}
