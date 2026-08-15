import { Link } from "@tanstack/react-router";
import { CalendarDays, Clock, MapPin, Ticket } from "lucide-react";

import apartmentImg from "@/assets/apartment-party.jpg";
import beachImg from "@/assets/beach-party.jpg";
import clubImg from "@/assets/club-night.jpg";
import heroImg from "@/assets/hero-party.jpg";
import poolImg from "@/assets/pool-party.jpg";
import { Button } from "@/components/ui/button";
import { STATUS_LABEL, statusTone } from "@/lib/events";
import { formatDay, formatTime, formatNaira } from "@/lib/site";
import { cn } from "@/lib/utils";

export type EventRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  starts_at: string;
  venue: string;
  city: string;
  flyer_url: string | null;
  price_regular: number;
  description?: string | null;
  status?: string;
};

export function categoryImage(category: string) {
  const key = (category ?? "").toLowerCase();
  if (key.includes("pool")) return poolImg;
  if (key.includes("beach")) return beachImg;
  if (key.includes("apartment") || key.includes("hangout")) return apartmentImg;
  if (key.includes("club") || key.includes("theme")) return clubImg;
  return heroImg;
}

export function EventCard({
  event,
  fromPrice,
  compact = false,
}: {
  event: EventRow;
  fromPrice?: number;
  compact?: boolean;
}) {
  const date = new Date(event.starts_at);
  const status = event.status ?? "published";
  const closed = status === "cancelled" || status === "completed";

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-[var(--shadow-card)] transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-[var(--shadow-glow)]">
      <Link
        to="/events/$slug"
        params={{ slug: event.slug }}
        className="relative block aspect-[4/5] overflow-hidden sm:aspect-[4/3]"
      >
        <img
          src={event.flyer_url || categoryImage(event.category)}
          alt={`${event.title} event flyer`}
          loading="lazy"
          className={cn(
            "h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.06]",
            closed && "grayscale",
          )}
        />
        <div className="absolute inset-0 night-fade" />

        <span className="absolute left-3 top-3 rounded-full border border-primary-foreground/10 bg-hype px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
          {event.category}
        </span>
        {status !== "published" && (
          <span
            className={cn(
              "absolute right-3 top-3 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur",
              statusTone(status),
            )}
          >
            {STATUS_LABEL[status]}
          </span>
        )}

        {/* date chip */}
        <span className="absolute bottom-3 left-3 flex flex-col items-center rounded-2xl border border-border/60 bg-background/85 px-3 py-1.5 backdrop-blur">
          <span className="font-display text-xl leading-none text-primary">{date.getDate()}</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {date.toLocaleString("en-NG", { month: "short" })}
          </span>
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-display text-xl leading-tight sm:text-2xl">
          <Link to="/events/$slug" params={{ slug: event.slug }} className="hover:text-primary">
            {event.title}
          </Link>
        </h3>

        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-primary" /> {formatDay(event.starts_at)}
          </li>
          <li className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-primary" /> {formatTime(event.starts_at)}
          </li>
          <li className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-accent" />
            <span className="truncate">
              {event.venue}, {event.city}
            </span>
          </li>
        </ul>

        {!compact && event.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground/80">{event.description}</p>
        )}

        <p className="mt-auto pt-1 text-sm">
          <span className="text-muted-foreground">From </span>
          <span className="font-display text-xl text-primary">
            {formatNaira(fromPrice ?? event.price_regular)}
          </span>
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button asChild variant="outline" size="sm" className="h-11 border-border">
            <Link to="/events/$slug" params={{ slug: event.slug }}>
              View event
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="h-11 bg-hype text-primary-foreground hover:opacity-90"
            disabled={closed}
          >
            <Link to="/events/$slug" params={{ slug: event.slug }} hash="tickets">
              <Ticket className="mr-1.5 h-4 w-4" /> Get tickets
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
