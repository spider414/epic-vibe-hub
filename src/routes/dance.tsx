import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Music4, Sparkles, Users } from "lucide-react";

import danceImg from "@/assets/dance-team.jpg";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/site";

export const Route = createFileRoute("/dance")({
  head: () => ({
    meta: [
      { title: "Creative Dance Team — Performances, Classes & Choreography" },
      {
        name: "description",
        content:
          "Book the Creative Dance Team for parties, weddings, music videos and clubs in Nigeria, or join weekly afrobeats, amapiano and hip-hop dance classes.",
      },
      { property: "og:title", content: "Creative Dance Team — Epic Entertainment" },
      {
        property: "og:description",
        content: "Professional dancers, choreography and classes for every occasion.",
      },
    ],
  }),
  component: DancePage,
});

function DancePage() {
  const { data: dancers } = useQuery({
    queryKey: ["dancers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dancers")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: packs } = useQuery({
    queryKey: ["packages", "dance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .eq("category", "dance")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <section className="relative isolate overflow-hidden">
        <img
          src={danceImg}
          alt="Creative Dance Team performing on stage"
          width={1600}
          height={1008}
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 night-fade" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6">
          <p className="text-xs tracking-[0.3em] text-accent">PART OF EPIC ENTERTAINMENT</p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl sm:text-7xl">
            Creative <span className="text-hype">Dance Team</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Trained performers delivering afrobeats, amapiano, hip-hop and afro-fusion sets for
            parties, weddings, music videos, clubs and corporate stages.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-hype text-primary-foreground hover:opacity-90">
              <Link to="/book" search={{ type: "dance_performance" }}>
                Book a performance
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-border bg-background/40">
              <Link to="/book" search={{ type: "dance_class" }}>
                Join dance classes
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Music4,
              title: "Live performances",
              text: "3–8 dancers, custom routines to your playlist, full costumes and styling.",
            },
            {
              icon: Sparkles,
              title: "Choreography",
              text: "Bridal train, groom squad, surprise dances and artist video routines.",
            },
            {
              icon: Users,
              title: "Dance classes",
              text: "Weekly group classes and private 1-on-1 sessions, beginner to advanced.",
            },
          ].map((c) => (
            <div key={c.title} className="card-elevated rounded-2xl p-7">
              <c.icon className="h-8 w-8 text-primary" />
              <h2 className="mt-4 font-display text-2xl">{c.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border/60 bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="font-display text-4xl">Meet the crew</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(dancers ?? []).map((d) => (
              <article key={d.id} className="card-elevated overflow-hidden rounded-2xl">
                {d.photo_url ? (
                  <img
                    src={d.photo_url}
                    alt={d.name}
                    loading="lazy"
                    className="h-56 w-full object-cover"
                  />
                ) : (
                  <div className="grid h-56 place-items-center bg-hype">
                    <span className="font-display text-5xl text-primary-foreground">
                      {d.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-display text-xl">{d.name}</h3>
                  <p className="text-xs tracking-widest text-accent">{d.stage_role}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{d.bio}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="font-display text-4xl">Dance rates</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {(packs ?? []).map((p) => (
            <article key={p.id} className="card-elevated flex flex-col rounded-2xl p-7">
              <h3 className="font-display text-2xl">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
              <p className="mt-4 font-display text-3xl text-primary">
                {formatNaira(p.price_from ? Number(p.price_from) : null)}
              </p>
              <p className="text-xs text-muted-foreground">{p.price_note}</p>
              <ul className="mt-5 flex-1 space-y-2 text-sm text-muted-foreground">
                {p.features.map((f: string) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <Button asChild className="mt-6 bg-hype text-primary-foreground hover:opacity-90">
                <Link to="/book" search={{ package: p.name, type: "dance_performance" }}>
                  Book now
                </Link>
              </Button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
