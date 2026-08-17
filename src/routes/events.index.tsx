import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";

import { EventCard, type EventRow } from "@/components/site/EventCard";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { EVENT_CATEGORIES, lowestPrice, type TicketTypeRow } from "@/lib/events";
import { formatNaira } from "@/lib/site";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Upcoming Events & Tickets — Epic Entertainment" },
      {
        name: "description",
        content:
          "Every upcoming Epic Entertainment party in Nigeria — pool parties, beach takeovers, club nights and themed events. Filter by date, city and price, then buy tickets online.",
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

const EVENT_COLUMNS =
  "id,slug,title,description,category,starts_at,venue,city,flyer_url,price_regular,status";

const PRICE_BANDS = [
  { id: "all", label: "Any price", min: 0, max: Infinity },
  { id: "free", label: "Free", min: 0, max: 0 },
  { id: "under10", label: "Under ₦10,000", min: 0.01, max: 9999 },
  { id: "10to25", label: "₦10,000 – ₦25,000", min: 10000, max: 25000 },
  { id: "over25", label: "Above ₦25,000", min: 25001, max: Infinity },
] as const;

const DATE_BANDS = [
  { id: "all", label: "Any date" },
  { id: "week", label: "Next 7 days" },
  { id: "month", label: "Next 30 days" },
  { id: "later", label: "Later" },
] as const;

function EventsPage() {
  const [category, setCategory] = useState("all");
  const [city, setCity] = useState("all");
  const [band, setBand] = useState<string>("all");
  const [dateBand, setDateBand] = useState<string>("all");
  const [q, setQ] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: upcoming, isLoading } = useQuery({
    queryKey: ["events", "upcoming"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(EVENT_COLUMNS)
        .gte("starts_at", new Date().toISOString())
        .neq("status", "draft")
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
        .select(EVENT_COLUMNS)
        .lt("starts_at", new Date().toISOString())
        .neq("status", "draft")
        .order("starts_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data as EventRow[];
    },
  });

  const { data: types } = useQuery({
    queryKey: ["ticket-types", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_types")
        .select("id,event_id,name,description,price,quantity_total,quantity_sold,sale_starts_at,sale_ends_at,status,sort_order");
      if (error) throw error;
      return data as TicketTypeRow[];
    },
  });

  const priceFor = useMemo(() => {
    const map = new Map<string, TicketTypeRow[]>();
    (types ?? []).forEach((t) => map.set(t.event_id, [...(map.get(t.event_id) ?? []), t]));
    return (e: EventRow) => lowestPrice(map.get(e.id), Number(e.price_regular));
  }, [types]);

  const cities = useMemo(
    () => Array.from(new Set((upcoming ?? []).map((e) => e.city))).sort(),
    [upcoming],
  );

  const shown = useMemo(() => {
    const now = Date.now();
    const priceBand = PRICE_BANDS.find((p) => p.id === band)!;
    return (upcoming ?? []).filter((e) => {
      if (category !== "all" && e.category !== category) return false;
      if (city !== "all" && e.city !== city) return false;

      const price = priceFor(e);
      if (band !== "all" && (price < priceBand.min || price > priceBand.max)) return false;

      const days = (new Date(e.starts_at).getTime() - now) / 86_400_000;
      if (dateBand === "week" && days > 7) return false;
      if (dateBand === "month" && days > 30) return false;
      if (dateBand === "later" && days <= 30) return false;

      if (q.trim()) {
        const hay = `${e.title} ${e.venue} ${e.city} ${e.category}`.toLowerCase();
        if (!hay.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [upcoming, category, city, band, dateBand, q, priceFor]);

  const activeFilters =
    Number(category !== "all") +
    Number(city !== "all") +
    Number(band !== "all") +
    Number(dateBand !== "all");

  function reset() {
    setCategory("all");
    setCity("all");
    setBand("all");
    setDateBand("all");
    setQ("");
  }

  return (
    <div>
      {/* HEADER */}
      <section className="relative overflow-hidden border-b border-border/60 bg-surface grain">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-xs tracking-[0.3em] text-accent">TICKETS ON SALE</p>
          <h1 className="mt-3 font-display text-[2.75rem] leading-[0.95] sm:text-6xl lg:text-7xl">
            Upcoming <span className="text-hype">events</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            Pick your vibe, grab your ticket and show up ready. Every order gets a unique reference
            and a scannable digital ticket.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        {/* SEARCH + FILTERS */}
        <div className="rounded-3xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)] sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search events, venues, cities…"
                aria-label="Search events"
                maxLength={80}
                className="h-12 pl-9"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-12 justify-between border-border sm:w-44"
              onClick={() => setFiltersOpen((v) => !v)}
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </span>
              {activeFilters > 0 && (
                <span className="ml-2 rounded-full bg-hype px-2 text-xs text-primary-foreground">
                  {activeFilters}
                </span>
              )}
            </Button>
          </div>

          <div className={cn("grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-4", !filtersOpen && "hidden")}>
            <Filter label="Category" value={category} onChange={setCategory}
              options={[{ v: "all", l: "All categories" }, ...EVENT_CATEGORIES.map((c) => ({ v: c, l: c }))]} />
            <Filter label="Location" value={city} onChange={setCity}
              options={[{ v: "all", l: "All locations" }, ...cities.map((c) => ({ v: c, l: c }))]} />
            <Filter label="Date" value={dateBand} onChange={setDateBand}
              options={DATE_BANDS.map((d) => ({ v: d.id, l: d.label }))} />
            <Filter label="Price" value={band} onChange={setBand}
              options={PRICE_BANDS.map((p) => ({ v: p.id, l: p.label }))} />
            {activeFilters > 0 && (
              <Button variant="ghost" className="justify-self-start text-muted-foreground" onClick={reset}>
                <X className="mr-1 h-4 w-4" /> Clear filters
              </Button>
            )}
          </div>
        </div>

        {/* QUICK CATEGORY PILLS */}
        <div className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {["all", ...EVENT_CATEGORIES].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm transition-colors",
                category === c
                  ? "border-transparent bg-hype font-semibold text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {c === "all" ? "All events" : c}
            </button>
          ))}
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          {isLoading ? "Loading events…" : `${shown.length} event${shown.length === 1 ? "" : "s"} found`}
        </p>

        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((event, i) => (
            <Reveal key={event.id} delay={(i % 3) * 90}>
              <EventCard event={event} fromPrice={priceFor(event)} />
            </Reveal>
          ))}
        </div>

        {!isLoading && shown.length === 0 && (
          <div className="mt-6 rounded-3xl border border-dashed border-border p-10 text-center">
            <p className="font-display text-2xl">No events match that</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try clearing your filters — or join the mailing list and hear about the next drop
              first.
            </p>
            <Button onClick={reset} variant="outline" className="mt-5 border-border">
              Clear filters
            </Button>
          </div>
        )}

        {past && past.length > 0 && (
          <section className="mt-20">
            <h2 className="font-display text-3xl sm:text-4xl">Past events</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Missed these? Photos and videos live in the gallery.
            </p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((event) => (
                <EventCard key={event.id} event={event} fromPrice={priceFor(event)} compact />
              ))}
            </div>
          </section>
        )}

        <p className="mt-10 text-xs text-muted-foreground">
          Prices shown are the lowest ticket type currently on sale. Example: {formatNaira(10000)}.
        </p>
      </div>
    </div>
  );
}

function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-12">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.v} value={o.v}>
              {o.l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
