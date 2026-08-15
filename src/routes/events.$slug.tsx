import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, CheckCircle2, MapPin, Ticket } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { categoryImage } from "@/components/site/EventCard";
import { Badge } from "@/components/ui/badge";
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
import { SITE, formatEventDate, formatNaira } from "@/lib/site";

export const Route = createFileRoute("/events/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Tickets — ${params.slug.replace(/-/g, " ")} | Epic Entertainment` },
      {
        name: "description",
        content:
          "Event details, line-up, venue and online tickets for this Epic Entertainment party in Nigeria.",
      },
      { property: "og:title", content: "Epic Entertainment event tickets" },
      {
        property: "og:description",
        content: "Get your ticket for the next Epic Entertainment party.",
      },
    ],
  }),
  component: EventDetail,
});

const orderSchema = z.object({
  customer_name: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(20),
  quantity: z.number().int().min(1).max(20),
});

function EventDetail() {
  const { slug } = Route.useParams();
  const [form, setForm] = useState({ customer_name: "", email: "", phone: "", quantity: "1" });
  const [ticketType, setTicketType] = useState("regular");
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-24 text-muted-foreground">Loading event…</div>;
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl">Event not found</h1>
        <Button asChild className="mt-6 bg-hype text-primary-foreground">
          <Link to="/events">Browse all events</Link>
        </Button>
      </div>
    );
  }

  const unitPrice =
    ticketType === "vip" && event.price_vip ? Number(event.price_vip) : Number(event.price_regular);
  const total = unitPrice * (Number(form.quantity) || 1);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!event) return;
    const parsed = orderSchema.safeParse({ ...form, quantity: Number(form.quantity) });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase
      .from("ticket_orders")
      .insert({
        event_id: event.id,
        customer_name: parsed.data.customer_name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        ticket_type: ticketType,
        quantity: parsed.data.quantity,
        amount_total: unitPrice * parsed.data.quantity,
      })
      .select("reference")
      .single();
    setBusy(false);
    if (error) {
      toast.error("We couldn't reserve that ticket. Please try again.");
      return;
    }
    setReference(data.reference);
    toast.success("Ticket reserved! Complete payment to confirm.");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="relative overflow-hidden rounded-3xl">
            <img
              src={event.flyer_url || categoryImage(event.category)}
              alt={`${event.title} flyer`}
              className="aspect-[16/10] w-full object-cover"
            />
            <div className="absolute inset-0 night-fade" />
            <Badge className="absolute left-4 top-4 bg-hype text-primary-foreground">
              {event.category}
            </Badge>
          </div>

          <h1 className="mt-8 font-display text-4xl sm:text-6xl">{event.title}</h1>
          <div className="mt-5 flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" /> {formatEventDate(event.starts_at)}
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" /> {event.venue}, {event.city}
            </span>
          </div>
          <p className="mt-6 whitespace-pre-line text-muted-foreground">{event.description}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="card-elevated rounded-2xl p-5">
              <p className="text-xs tracking-[0.2em] text-muted-foreground">REGULAR</p>
              <p className="font-display text-3xl text-primary">
                {formatNaira(Number(event.price_regular))}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">General admission</p>
            </div>
            {event.price_vip && (
              <div className="card-elevated rounded-2xl p-5">
                <p className="text-xs tracking-[0.2em] text-muted-foreground">VIP</p>
                <p className="font-display text-3xl text-gold">
                  {formatNaira(Number(event.price_vip))}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Priority entry + reserved seating
                </p>
              </div>
            )}
          </div>
        </div>

        {/* TICKET FORM */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card-elevated rounded-3xl p-6">
            {reference ? (
              <div className="space-y-4 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
                <h2 className="font-display text-2xl">Ticket reserved</h2>
                <p className="text-sm text-muted-foreground">
                  Your reference is{" "}
                  <span className="font-mono font-bold text-primary">{reference}</span>. Pay{" "}
                  <strong>{formatNaira(total)}</strong> to confirm and quote this reference as the
                  transfer narration.
                </p>
                <div className="rounded-xl border border-border p-4 text-left text-sm">
                  <p className="text-muted-foreground">Bank transfer</p>
                  <p className="font-semibold">{SITE.bank.name}</p>
                  <p>
                    {SITE.bank.bank} • {SITE.bank.account}
                  </p>
                </div>
                <a
                  href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
                    `Hi Epic Entertainment, I just reserved ticket ${reference} for ${event.title}.`,
                  )}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex w-full items-center justify-center rounded-md bg-hype px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  Send payment proof on WhatsApp
                </a>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <h2 className="flex items-center gap-2 font-display text-2xl">
                  <Ticket className="h-5 w-5 text-primary" /> Get your ticket
                </h2>

                <div className="space-y-2">
                  <Label htmlFor="ticketType">Ticket type</Label>
                  <Select value={ticketType} onValueChange={setTicketType}>
                    <SelectTrigger id="ticketType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">
                        Regular — {formatNaira(Number(event.price_regular))}
                      </SelectItem>
                      {event.price_vip && (
                        <SelectItem value="vip">
                          VIP — {formatNaira(Number(event.price_vip))}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    maxLength={100}
                    required
                    value={form.customer_name}
                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    maxLength={255}
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    maxLength={20}
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qty">Quantity</Label>
                  <Input
                    id="qty"
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-display text-2xl text-primary">{formatNaira(total)}</span>
                </div>

                <Button
                  disabled={busy}
                  className="w-full bg-hype text-primary-foreground hover:opacity-90"
                >
                  {busy ? "Reserving…" : "Reserve ticket"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  You'll get a payment reference instantly. Card payments coming soon.
                </p>
              </form>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
