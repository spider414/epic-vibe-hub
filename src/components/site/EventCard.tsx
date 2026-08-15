import { Link } from "@tanstack/react-router";
import { CalendarDays, MapPin } from "lucide-react";

import apartmentImg from "@/assets/apartment-party.jpg";
import beachImg from "@/assets/beach-party.jpg";
import clubImg from "@/assets/club-night.jpg";
import heroImg from "@/assets/hero-party.jpg";
import poolImg from "@/assets/pool-party.jpg";
import { Badge } from "@/components/ui/badge";
import { formatEventDate, formatNaira } from "@/lib/site";

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
};

export function categoryImage(category: string) {
  const key = category.toLowerCase();
  if (key.includes("pool")) return poolImg;
  if (key.includes("beach")) return beachImg;
  if (key.includes("apartment") || key.includes("hangout")) return apartmentImg;
  if (key.includes("club") || key.includes("theme")) return clubImg;
  return heroImg;
}

export function EventCard({ event }: { event: EventRow }) {
  return (
    <Link
      to="/events/$slug"
      params={{ slug: event.slug }}
      className="group card-elevated overflow-hidden rounded-2xl transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={event.flyer_url || categoryImage(event.category)}
          alt={`${event.title} flyer`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 night-fade" />
        <Badge className="absolute left-3 top-3 bg-hype text-primary-foreground">
          {event.category}
        </Badge>
      </div>
      <div className="space-y-3 p-5">
        <h3 className="font-display text-xl leading-tight">{event.title}</h3>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4 text-primary" /> {formatEventDate(event.starts_at)}
        </p>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-accent" /> {event.venue}, {event.city}
        </p>
        <p className="pt-1 text-sm">
          <span className="text-muted-foreground">From </span>
          <span className="font-display text-lg text-primary">
            {formatNaira(event.price_regular)}
          </span>
        </p>
      </div>
    </Link>
  );
}
