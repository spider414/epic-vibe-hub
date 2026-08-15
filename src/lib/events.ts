export const EVENT_CATEGORIES = [
  "Pool Party",
  "Beach Party",
  "Club Night",
  "Apartment Party",
  "Hangout",
  "Themed Party",
  "Other",
] as const;

export const EVENT_STATUSES = [
  "draft",
  "published",
  "sold_out",
  "completed",
  "cancelled",
] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];

export const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  published: "On sale",
  sold_out: "Sold out",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Tailwind classes for a status pill, built from design tokens only. */
export function statusTone(status: string) {
  switch (status) {
    case "published":
      return "border-primary/40 bg-primary/15 text-primary";
    case "sold_out":
      return "border-accent/40 bg-accent/15 text-accent";
    case "cancelled":
      return "border-destructive/40 bg-destructive/15 text-destructive";
    case "completed":
      return "border-border bg-muted text-muted-foreground";
    default:
      return "border-gold/40 bg-gold/15 text-gold";
  }
}

export const TICKET_STATUSES = ["pending", "paid", "cancelled", "refunded", "checked_in"] as const;

export type TicketTypeRow = {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  quantity_total: number | null;
  quantity_sold: number;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
  status: string;
  sort_order: number;
};

export type Availability = {
  onSale: boolean;
  remaining: number | null;
  reason: string;
};

export function ticketAvailability(t: TicketTypeRow, eventStatus?: string): Availability {
  const remaining =
    t.quantity_total === null ? null : Math.max(t.quantity_total - (t.quantity_sold ?? 0), 0);
  const now = Date.now();

  if (eventStatus === "cancelled") return { onSale: false, remaining, reason: "Event cancelled" };
  if (eventStatus === "completed") return { onSale: false, remaining, reason: "Event finished" };
  if (eventStatus === "sold_out") return { onSale: false, remaining: 0, reason: "Sold out" };
  if (t.status !== "on_sale") return { onSale: false, remaining, reason: "Not on sale" };
  if (t.sale_starts_at && new Date(t.sale_starts_at).getTime() > now)
    return { onSale: false, remaining, reason: "Sales not open yet" };
  if (t.sale_ends_at && new Date(t.sale_ends_at).getTime() < now)
    return { onSale: false, remaining, reason: "Sales closed" };
  if (remaining !== null && remaining <= 0) return { onSale: false, remaining: 0, reason: "Sold out" };

  return {
    onSale: true,
    remaining,
    reason: remaining !== null && remaining <= 15 ? `Only ${remaining} left` : "On sale",
  };
}

export function lowestPrice(types: TicketTypeRow[] | undefined, fallback: number) {
  const live = (types ?? []).filter((t) => t.status === "on_sale");
  if (live.length === 0) return fallback;
  return Math.min(...live.map((t) => Number(t.price)));
}
