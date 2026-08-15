import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { EventCard, type EventRow } from "@/components/site/EventCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Upcoming Events & Tickets — Epic Entertainment" },
      {
        name: "description",
        content:
          "See every upcoming Epic Entertainment party in Nigeria — pool parties, beach takeovers, club nights and themed events — and buy tickets online.",
      },
      { property: "og:title", content: "Upcoming Events & Tickets — Epic Entertainment" },
      {
        property: "og:description",
        content: "Pool parties, beach takeovers and club nights. Secure your ticket online.",
      },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const [filter, setFilter] = useState("All");

  const { data: upcoming, isLoading } = useQuery({
    queryKey: ["events", "upcoming"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id,slug,title,category,starts_at,venue,city,flyer_url,price_regular")
        .eq("is_published", true)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at");
      if (error) throw error;
      return data as EventRow[];
    },
  });

  const { data: past } = useQuery({
    queryKey: ["events", "past"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id,slug,title,category,starts_at,venue,city,flyer_url,price_regular")
        .eq("is_published", true)
        .lt("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data as EventRow[];
    },
  });

  const categories = ["All", ...new Set((upcoming ?? []).map((e) => e.category))];
  const shown = (upcoming ?? []).filter((e) => filter === "All" || e.category === filter);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <p className="text-xs tracking-[0.3em] text-accent">TICKETS ON SALE</p>
      <h1 className="mt-2 font-display text-5xl sm:text-6xl">
        Upcoming <span className="text-hype">events</span>
      </h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Pick your vibe, grab your ticket and show up ready. Every ticket gets a unique reference for
        entry.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {categories.map((c) => (
          <Button
            key={c}
            size="sm"
            variant={filter === c ? "default" : "outline"}
            className={filter === c ? "bg-hype text-primary-foreground" : "border-border"}
            onClick={() => setFilter(c)}
          >
            {c}
          </Button>
        ))}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && <p className="text-muted-foreground">Loading events…</p>}
        {shown.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
        {!isLoading && shown.length === 0 && (
          <p className="text-muted-foreground">
            Nothing listed here yet. Join the mailing list below for the next drop.
          </p>
        )}
      </div>

      {past && past.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-3xl">Past events</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
