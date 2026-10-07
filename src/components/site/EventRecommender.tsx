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
    <section className="card-elevated rounded-3xl p-6">
      <h2 className="flex items-center gap-2 font-display text-2xl">
        <Sparkles className="h-5 w-5 text-primary" /> Find your next party
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell us what you're into — music, vibe, budget, who you're rolling with — and our AI picks
        upcoming events for you.
      </p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <Textarea
          rows={3}
          maxLength={500}
          placeholder="e.g. Afrobeats and amapiano, pool or beach vibes, going with 4 friends, under ₦20k"
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
        />
        <Button disabled={busy} className="bg-hype text-primary-foreground hover:opacity-90">
          {busy ? "Finding events…" : "Get suggestions"}
        </Button>
      </form>

      {recs && (
        <div className="mt-6 grid gap-3">
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
                className="flex gap-4 rounded-2xl border border-border p-4 transition-colors hover:border-primary/60"
              >
                {r.flyer_url && (
                  <img src={r.flyer_url} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                )}
                <div>
                  <p className="font-display text-xl">{r.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatEventDate(r.starts_at)} · {r.venue}, {r.city}
                  </p>
                  <p className="mt-1 text-sm">{r.reason}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </section>
  );
}
