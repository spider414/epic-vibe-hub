import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/site";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Event Packages & Services — Epic Entertainment" },
      {
        name: "description",
        content:
          "Party planning, hosting, DJs, decor, dance performances and choreography packages from Epic Entertainment in Nigeria, with transparent starting prices.",
      },
      { property: "og:title", content: "Event Packages & Services — Epic Entertainment" },
      {
        property: "og:description",
        content: "From apartment hangouts to full-scale branded productions. See our packages.",
      },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const { data: packages } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const eventPacks = (packages ?? []).filter((p) => p.category === "events");
  const dancePacks = (packages ?? []).filter((p) => p.category === "dance");

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <p className="text-xs tracking-[0.3em] text-accent">PACKAGES & SERVICES</p>
      <h1 className="mt-2 font-display text-5xl sm:text-6xl">
        Pick a package,
        <br />
        <span className="text-hype">we handle the rest</span>
      </h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Every package is a starting point — we tailor scope, scale and budget to your event. Prices
        shown are indicative starting rates for Lagos; travel outside Lagos is quoted separately.
      </p>

      <PackageGrid title="Event planning & hosting" items={eventPacks} />
      <PackageGrid title="Creative Dance Team" items={dancePacks} />

      <section className="mt-20 card-elevated rounded-3xl p-8 text-center">
        <h2 className="font-display text-3xl">Something custom?</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Corporate activations, cruises, festivals, concerts and sponsorships — send us the brief
          and we'll build a bespoke proposal.
        </p>
        <Button asChild className="mt-6 bg-hype text-primary-foreground hover:opacity-90">
          <Link to="/book">Request a custom quote</Link>
        </Button>
      </section>
    </div>
  );
}

type Pack = {
  id: string;
  name: string;
  tagline: string | null;
  price_from: number | null;
  price_note: string | null;
  features: string[];
};

function PackageGrid({ title, items }: { title: string; items: Pack[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-16">
      <h2 className="font-display text-3xl">{title}</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {items.map((p, i) => (
          <article
            key={p.id}
            className={`card-elevated relative flex flex-col rounded-2xl p-7 ${
              i === 1 ? "glow" : ""
            }`}
          >
            {i === 1 && (
              <span className="absolute -top-3 left-7 rounded-full bg-hype px-3 py-1 text-[10px] font-bold tracking-widest text-primary-foreground">
                MOST BOOKED
              </span>
            )}
            <h3 className="font-display text-2xl">{p.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
            <p className="mt-5 font-display text-3xl text-primary">
              {formatNaira(p.price_from ? Number(p.price_from) : null)}
            </p>
            <p className="text-xs text-muted-foreground">{p.price_note}</p>
            <ul className="mt-6 flex-1 space-y-2 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-7 bg-hype text-primary-foreground hover:opacity-90">
              <Link to="/book" search={{ package: p.name }}>
                Book this package
              </Link>
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}
