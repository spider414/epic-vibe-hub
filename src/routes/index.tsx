import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Music4, PartyPopper, Sparkles, Star, Ticket, Users } from "lucide-react";

import beachImg from "@/assets/beach-party.jpg";
import clubImg from "@/assets/club-night.jpg";
import danceImg from "@/assets/dance-team.jpg";
import heroImg from "@/assets/hero-party.jpg";
import poolImg from "@/assets/pool-party.jpg";
import { EventCard, type EventRow } from "@/components/site/EventCard";
import { HeroBackground } from "@/components/site/HeroBackground";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Epic Entertainment — Pool, Beach & Club Parties in Nigeria" },
      {
        name: "description",
        content:
          "Nigeria's party people. Buy tickets to Epic Entertainment events, book us to host your party, or book the Creative Dance Team for performances and classes.",
      },
      { property: "og:title", content: "Epic Entertainment — Pool, Beach & Club Parties in Nigeria" },
      {
        property: "og:description",
        content:
          "Nigeria's party people. Buy tickets to Epic Entertainment events, book us to host your party, or book the Creative Dance Team for performances and classes.",
      },
    ],
  }),
  component: Home,
});

const MARQUEE = [
  "POOL PARTIES",
  "BEACH TAKEOVERS",
  "CLUB NIGHTS",
  "APARTMENT VIBES",
  "DANCE SHOWS",
  "THEMED PARTIES",
];

function Home() {
  const { data: events } = useQuery({
    queryKey: ["events", "upcoming", "home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id,slug,title,category,starts_at,venue,city,flyer_url,price_regular")
        .eq("is_published", true)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(3);
      if (error) throw error;
      return data as EventRow[];
    },
  });

  const { data: testimonials } = useQuery({
    queryKey: ["testimonials", "home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("id,author_name,author_role,message,rating")
        .eq("is_approved", true)
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <HeroBackground
          fallbackSrc={heroImg}
          alt="Epic Entertainment pool party crowd in Lagos"
        />
        <div className="absolute inset-0 night-fade" />
        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-24 sm:px-6 sm:pb-32 sm:pt-32">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background/50 px-4 py-1.5 text-xs tracking-[0.25em] text-primary backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> LAGOS • ABUJA • PORT HARCOURT
          </p>
          <h1 className="mt-6 max-w-4xl font-display text-5xl sm:text-7xl lg:text-8xl">
            We throw the parties
            <br />
            <span className="text-hype">Nigeria talks about</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Epic Entertainment plans, hosts and powers unforgettable events — and our Creative Dance
            Team brings the stage to life. Grab a ticket, or let us build your night from scratch.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="bg-hype text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-90"
            >
              <Link to="/events">
                <Ticket className="mr-2 h-5 w-5" /> Buy event tickets
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-border bg-background/40">
              <Link to="/book-us">Book us for your party</Link>
            </Button>
          </div>
          <dl className="mt-14 grid max-w-2xl grid-cols-3 gap-6">
            {[
              { k: "300+", v: "Events hosted" },
              { k: "50k+", v: "Guests entertained" },
              { k: "12", v: "Pro dancers" },
            ].map((s) => (
              <div key={s.v}>
                <dt className="font-display text-3xl text-primary sm:text-4xl">{s.k}</dt>
                <dd className="text-xs tracking-wide text-muted-foreground sm:text-sm">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="overflow-hidden border-y border-border/60 bg-hype py-3">
        <div className="marquee-track flex w-max gap-8 whitespace-nowrap">
          {[...MARQUEE, ...MARQUEE, ...MARQUEE, ...MARQUEE].map((t, i) => (
            <span key={i} className="font-display text-xl text-primary-foreground">
              {t} <span className="opacity-50">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* UPCOMING EVENTS */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.3em] text-accent">WHAT'S NEXT</p>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl">Upcoming events</h2>
          </div>
          <Button asChild variant="ghost" className="text-primary">
            <Link to="/events">
              See all events <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </Reveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(events ?? []).map((event, i) => (
            <Reveal key={event.id} delay={i * 80}>
              <EventCard event={event} />
            </Reveal>
          ))}
          {events?.length === 0 && (
            <p className="text-muted-foreground">
              No events on sale right now — join our list and you'll hear first.
            </p>
          )}
        </div>
      </section>

      {/* WHAT WE DO */}
      <section className="border-y border-border/60 bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <p className="text-xs tracking-[0.3em] text-accent">WHAT WE DO</p>
            <h2 className="mt-2 max-w-2xl font-display text-4xl sm:text-5xl">
              One brand, every kind of turn-up
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                img: poolImg,
                title: "Pool & beach parties",
                text: "Daytime splash sessions and sunset beach takeovers with DJs, games and full production.",
              },
              {
                img: clubImg,
                title: "Club & themed nights",
                text: "All-white nights, VIP tables, celebrity DJs and themed experiences built around a concept.",
              },
              {
                img: danceImg,
                title: "Creative Dance Team",
                text: "Professional dancers for parties, weddings, music videos and clubs — plus classes and choreography.",
              },
            ].map((c, i) => (
              <Reveal key={c.title} as="article" delay={i * 90} className="card-elevated overflow-hidden rounded-2xl">
                <img
                  src={c.img}
                  alt={c.title}
                  loading="lazy"
                  className="h-52 w-full object-cover"
                />
                <div className="p-6">
                  <h3 className="font-display text-2xl">{c.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* BOOK STRIP */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: PartyPopper,
              title: "Book an event",
              text: "Birthdays, brand activations, weddings, cruises — we plan and host it end to end.",
              to: "/book" as const,
              cta: "Request a quote",
            },
            {
              icon: Music4,
              title: "Book the dancers",
              text: "Live performances, video shoots and bridal train choreography.",
              to: "/dance" as const,
              cta: "Book Creative Dance Team",
            },
            {
              icon: Users,
              title: "Dance classes",
              text: "Weekly afrobeats, amapiano and hip-hop classes for all levels.",
              to: "/dance" as const,
              cta: "Join a class",
            },
          ].map((c, i) => (
            <Reveal key={c.title} delay={i * 90} className="card-elevated rounded-2xl p-7">
              <c.icon className="h-8 w-8 text-primary" />
              <h3 className="mt-4 font-display text-2xl">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
              <Button asChild variant="link" className="mt-3 px-0 text-primary">
                <Link to={c.to}>
                  {c.cta} <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="border-t border-border/60 bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <p className="text-xs tracking-[0.3em] text-accent">THE REVIEWS</p>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl">People who partied with us</h2>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(testimonials ?? []).map((t, i) => (
              <Reveal key={t.id} delay={i * 80} className="card-elevated rounded-2xl p-6">
                <div className="flex gap-0.5 text-gold">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-3 text-sm text-muted-foreground">“{t.message}”</blockquote>
                <figcaption className="mt-4 text-sm font-semibold">
                  {t.author_name}
                  <span className="block text-xs font-normal text-muted-foreground">
                    {t.author_role}
                  </span>
                </figcaption>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative isolate overflow-hidden">
        <img
          src={beachImg}
          alt="Beach party at sunset"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 night-fade" />
        <Reveal className="relative mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
          <h2 className="font-display text-4xl sm:text-6xl">
            Your party. <span className="text-hype">Our energy.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Tell us the vibe you want and we'll handle planning, hosting, sound, decor, dancers and
            everything in between.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-hype text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-90"
          >
            <Link to="/book-us">Start your booking</Link>
          </Button>
        </Reveal>
      </section>
    </>
  );
}
