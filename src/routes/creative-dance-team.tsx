import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Instagram, PlayCircle } from "lucide-react";

import danceImg from "@/assets/dance-team.jpg";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { DANCE_SERVICES, DANCE_STYLES } from "@/lib/dance";
import { formatNaira } from "@/lib/site";

export const Route = createFileRoute("/creative-dance-team")({
  head: () => ({
    meta: [
      { title: "Creative Dance Team — Book Dancers, Choreography & Classes" },
      {
        name: "description",
        content:
          "Creative Dance Team by Epic Entertainment: professional dancers for parties, weddings, music videos and clubs in Nigeria, plus choreography, dance classes and private training.",
      },
      { property: "og:title", content: "We don't just dance. We create moments." },
      {
        property: "og:description",
        content:
          "Book the Creative Dance Team for performances, choreography, classes and private training.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreativeDanceTeamPage,
});

function CreativeDanceTeamPage() {
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

  const { data: videos } = useQuery({
    queryKey: ["media", "dance-videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media")
        .select("*")
        .eq("is_visible", true)
        .order("sort_order")
        .limit(24);
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

  const danceVideos = (videos ?? []).filter(
    (m) => m.media_type === "video" && (m.tag ?? "").toLowerCase().includes("dance"),
  );
  const fallbackVideos = (videos ?? []).filter((m) => m.media_type === "video");
  const reel = danceVideos.length > 0 ? danceVideos : fallbackVideos;

  const performanceShots = (videos ?? [])
    .filter((m) => m.media_type === "image")
    .slice(0, 6);

  return (
    <div>
      <section className="relative isolate overflow-hidden">
        <img
          src={danceImg}
          alt="Creative Dance Team performing under stage lights"
          width={1600}
          height={1008}
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 night-fade" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <p className="text-xs tracking-[0.3em] text-accent">CREATIVE DANCE TEAM</p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl leading-[0.92] sm:text-7xl">
            WE DON'T JUST DANCE.{" "}
            <span className="text-hype">WE CREATE MOMENTS.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            The performance arm of Epic Entertainment — trained dancers, original choreography and
            show-ready energy for parties, weddings, music videos, clubs and brand stages across
            Nigeria.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-hype text-primary-foreground hover:opacity-90">
              <Link to="/book-dance-team">Book the dance team</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-border bg-background/40">
              <Link to="/book-dance-team" search={{ classes: true }}>
                Join dance classes
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal>
          <p className="text-xs tracking-[0.3em] text-accent">WHAT WE DO</p>
          <h2 className="mt-2 font-display text-3xl sm:text-5xl">Services</h2>
        </Reveal>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {DANCE_SERVICES.map((s, i) => (
            <Reveal key={s.title} delay={i * 60}>
              <article className="card-elevated h-full rounded-2xl p-6 transition-transform hover:-translate-y-1">
                <span className="font-display text-3xl text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-display text-xl">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
                <Link
                  to="/book-dance-team"
                  search={{ service: s.title }}
                  className="mt-4 inline-block text-sm text-primary hover:underline"
                >
                  Book this →
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-border/60 bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <h2 className="font-display text-3xl sm:text-5xl">Dance styles</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Pick a vibe, or let us blend them into one custom show.
            </p>
          </Reveal>
          <div className="mt-7 flex flex-wrap gap-3">
            {DANCE_STYLES.map((style) => (
              <span
                key={style}
                className="rounded-full border border-primary/40 bg-primary/5 px-4 py-2 text-sm text-foreground"
              >
                {style}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal>
          <h2 className="font-display text-3xl sm:text-5xl">Meet the dancers</h2>
        </Reveal>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {(dancers ?? []).map((d, i) => (
            <Reveal key={d.id} delay={i * 60}>
              <article className="card-elevated overflow-hidden rounded-2xl">
                {d.photo_url ? (
                  <img
                    src={d.photo_url}
                    alt={d.name}
                    loading="lazy"
                    className="h-64 w-full object-cover"
                  />
                ) : (
                  <div className="grid h-64 place-items-center bg-hype">
                    <span className="font-display text-5xl text-primary-foreground">
                      {d.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-display text-xl">{d.name}</h3>
                  <p className="text-xs tracking-widest text-accent">{d.stage_role}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{d.bio}</p>
                  {d.instagram && (
                    <a
                      href={`https://instagram.com/${d.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <Instagram className="h-4 w-4" /> {d.instagram}
                    </a>
                  )}
                </div>
              </article>
            </Reveal>
          ))}
          {(dancers ?? []).length === 0 && (
            <p className="text-muted-foreground">Our roster is being updated — check back soon.</p>
          )}
        </div>
      </section>

      {(reel.length > 0 || performanceShots.length > 0) && (
        <section className="border-y border-border/60 bg-surface py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <Reveal>
              <h2 className="font-display text-3xl sm:text-5xl">Performances & videos</h2>
            </Reveal>
            {reel.length > 0 && (
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {reel.slice(0, 6).map((m, i) => (
                  <Reveal key={m.id} delay={i * 60}>
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group relative block overflow-hidden rounded-2xl border border-border"
                    >
                      <img
                        src={m.thumbnail_url ?? danceImg}
                        alt={m.title}
                        loading="lazy"
                        className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute inset-0 grid place-items-center bg-background/40">
                        <PlayCircle className="h-12 w-12 text-primary" />
                      </span>
                      <span className="absolute bottom-3 left-4 font-display text-lg">
                        {m.title}
                      </span>
                    </a>
                  </Reveal>
                ))}
              </div>
            )}
            {performanceShots.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {performanceShots.map((m) => (
                  <img
                    key={m.id}
                    src={m.thumbnail_url ?? m.url}
                    alt={m.title}
                    loading="lazy"
                    className="h-32 w-full rounded-xl object-cover"
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal>
          <h2 className="font-display text-3xl sm:text-5xl">Classes & choreography</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Weekly group classes, private one-on-one training and custom routines built for your
            wedding, artist project or brand campaign.
          </p>
        </Reveal>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {(packs ?? []).map((p, i) => (
            <Reveal key={p.id} delay={i * 70}>
              <article className="card-elevated flex h-full flex-col rounded-2xl p-7">
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
                <Button
                  asChild
                  className="mt-6 bg-hype text-primary-foreground hover:opacity-90"
                >
                  <Link to="/book-dance-team" search={{ service: p.name }}>
                    Book now
                  </Link>
                </Button>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-border/60 bg-surface py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl sm:text-5xl">Ready to make a moment?</h2>
          <p className="mt-3 text-muted-foreground">
            Send your date, style and location — we'll come back with a routine plan and quote.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-7 bg-hype text-primary-foreground hover:opacity-90"
          >
            <Link to="/book-dance-team">Book the Creative Dance Team</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
