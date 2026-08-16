import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Shirt,
  Ticket,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { categoryImage } from "@/components/site/EventCard";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  STATUS_LABEL,
  statusTone,
  ticketAvailability,
  type TicketTypeRow,
} from "@/lib/events";
import { createTicketOrder } from "@/lib/orders.functions";
import { formatDay, formatNaira, formatTime, SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/events/$slug")({
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("events")
      .select("title,description,flyer_url,category")
      .eq("slug", params.slug)
      .neq("status", "draft")
      .maybeSingle();
    return { seo: data };
  },
  head: ({ loaderData }) => {
    const e = loaderData?.seo;
    const title = e ? `${e.title} — Epic Entertainment` : "Event — Epic Entertainment";
    const description = e?.description
      ? e.description.slice(0, 155)
      : "Get tickets to the next Epic Entertainment party.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(e?.flyer_url?.startsWith("https://")
          ? [
              { property: "og:image", content: e.flyer_url },
              { name: "twitter:image", content: e.flyer_url },
            ]
          : []),
      ],
    };
  },
  errorComponent: () => <Fallback message="We couldn't load this event." />,
  notFoundComponent: () => <Fallback message="This event doesn't exist." />,
  component: EventDetail,
});

function Fallback({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-display text-4xl">{message}</h1>
      <Button asChild className="mt-6 bg-hype text-primary-foreground">
        <Link to="/events">Browse all events</Link>
      </Button>
    </div>
  );
}

type Step = "select" | "details" | "review";

function EventDetail() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const submitOrder = useServerFn(createTicketOrder);

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("slug", slug)
        .neq("status", "draft")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: types } = useQuery({
    enabled: Boolean(event?.id),
    queryKey: ["ticket-types", event?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_types")
        .select("*")
        .eq("event_id", event!.id)
        .order("sort_order")
        .order("price");
      if (error) throw error;
      return data as TicketTypeRow[];
    },
  });

  const { data: gallery } = useQuery({
    enabled: Boolean(event?.id),
    queryKey: ["event-media", event?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media")
        .select("id,title,url,media_type,thumbnail_url")
        .eq("event_id", event!.id)
        .eq("is_visible", true)
        .order("sort_order")
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  const [step, setStep] = useState<Step>("select");
  const [typeId, setTypeId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [form, setForm] = useState({ customerName: "", email: "", phone: "", notes: "" });

  const selected = useMemo(() => types?.find((t) => t.id === typeId) ?? null, [types, typeId]);
  const avail = selected ? ticketAvailability(selected, event?.status) : null;
  const maxQty = Math.min(10, avail?.remaining ?? 10) || 1;
  const total = selected ? Number(selected.price) * qty : 0;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!event || !selected) throw new Error("Pick a ticket first");
      return submitOrder({
        data: {
          eventId: event.id,
          ticketTypeId: selected.id,
          quantity: qty,
          customerName: form.customerName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          notes: form.notes.trim() || undefined,
        },
      });
    },
    onSuccess: (res) => {
      toast.success(`Order ${res.orderNumber} created`);
      navigate({ to: "/tickets/$token", params: { token: res.accessToken } });
    },
    onError: (e: Error) => toast.error(e.message || "Could not create your order"),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24">
        <div className="h-72 animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }
  if (!event) return <Fallback message="This event doesn't exist." />;

  const status = event.status ?? "published";
  const closed = status !== "published";
  const hero = event.flyer_url || categoryImage(event.category);
  const mapQuery = encodeURIComponent(
    event.map_query || `${event.venue}, ${event.address ?? ""} ${event.city}`,
  );

  return (
    <div>
      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0">
          <img src={hero} alt="" aria-hidden className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/40" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-12">
          <Link
            to="/events"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> All events
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-hype px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
                  {event.category}
                </span>
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider",
                    statusTone(status),
                  )}
                >
                  {STATUS_LABEL[status] ?? status}
                </span>
              </div>
              <h1 className="mt-4 font-display text-[2.5rem] leading-[0.95] sm:text-6xl lg:text-7xl">
                {event.title}
              </h1>
              <ul className="mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 sm:text-base">
                <li className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" /> {formatDay(event.starts_at)}
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" /> {formatTime(event.starts_at)}
                  {event.ends_at ? ` – ${formatTime(event.ends_at)}` : ""}
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-accent" /> {event.venue}, {event.city}
                </li>
                {event.age_limit && (
                  <li className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-accent" /> {event.age_limit}
                  </li>
                )}
              </ul>
            </div>

            <div className="overflow-hidden rounded-3xl border border-border/70 shadow-[var(--shadow-card)]">
              <img
                src={hero}
                alt={`${event.title} flyer`}
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* LEFT */}
        <div className="space-y-10">
          <Reveal>
            <h2 className="font-display text-3xl">About this event</h2>
            <p className="mt-3 whitespace-pre-line text-muted-foreground">{event.description}</p>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {event.dress_code && (
              <Reveal className="rounded-2xl border border-border/70 bg-card p-5">
                <p className="flex items-center gap-2 font-display text-xl">
                  <Shirt className="h-5 w-5 text-primary" /> Dress code
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{event.dress_code}</p>
              </Reveal>
            )}
            {event.rules && (
              <Reveal className="rounded-2xl border border-border/70 bg-card p-5" delay={80}>
                <p className="flex items-center gap-2 font-display text-xl">
                  <ShieldCheck className="h-5 w-5 text-accent" /> House rules
                </p>
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                  {event.rules}
                </p>
              </Reveal>
            )}
          </div>

          <Reveal>
            <h2 className="font-display text-3xl">Location</h2>
            <p className="mt-2 text-muted-foreground">
              {event.venue}
              {event.address ? `, ${event.address}` : ""}, {event.city}
            </p>
            <div className="mt-4 overflow-hidden rounded-3xl border border-border/70">
              <iframe
                title={`Map to ${event.venue}`}
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                loading="lazy"
                className="h-64 w-full sm:h-80"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Reveal>

          {gallery && gallery.length > 0 && (
            <Reveal>
              <h2 className="font-display text-3xl">Gallery</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {gallery.map((m) => (
                  <a
                    key={m.id}
                    href={m.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group overflow-hidden rounded-2xl border border-border/70"
                  >
                    <img
                      src={m.thumbnail_url || m.url}
                      alt={m.title}
                      loading="lazy"
                      className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </a>
                ))}
              </div>
            </Reveal>
          )}
        </div>

        {/* CHECKOUT */}
        <aside id="tickets" className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">Get tickets</h2>
              <Steps step={step} />
            </div>

            {closed ? (
              <p className="mt-6 rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                {STATUS_LABEL[status] ?? status} — tickets are not available for this event.
              </p>
            ) : (
              <>
                {step === "select" && (
                  <div className="mt-5 space-y-3">
                    {(types ?? []).length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Ticket types are being finalised. Check back soon.
                      </p>
                    )}
                    {(types ?? []).map((t) => {
                      const a = ticketAvailability(t, status);
                      const active = t.id === typeId;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          disabled={!a.onSale}
                          onClick={() => {
                            setTypeId(t.id);
                            setQty(1);
                          }}
                          className={cn(
                            "w-full rounded-2xl border p-4 text-left transition-colors",
                            active
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50",
                            !a.onSale && "cursor-not-allowed opacity-50",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold">{t.name}</p>
                              {t.description && (
                                <p className="text-xs text-muted-foreground">{t.description}</p>
                              )}
                              <p className="mt-1 text-xs text-accent">{a.reason}</p>
                            </div>
                            <p className="font-display text-xl text-primary">
                              {formatNaira(Number(t.price))}
                            </p>
                          </div>
                        </button>
                      );
                    })}

                    {selected && avail?.onSale && (
                      <div className="rounded-2xl border border-border p-4">
                        <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                          Quantity
                        </Label>
                        <div className="mt-2 flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 border-border"
                            onClick={() => setQty((q) => Math.max(1, q - 1))}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-display text-2xl">{qty}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 border-border"
                            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <span className="ml-auto font-display text-xl text-primary">
                            {formatNaira(total)}
                          </span>
                        </div>
                      </div>
                    )}

                    <Button
                      className="h-12 w-full bg-hype text-primary-foreground"
                      disabled={!selected || !avail?.onSale}
                      onClick={() => setStep("details")}
                    >
                      Continue
                    </Button>
                  </div>
                )}

                {step === "details" && (
                  <form
                    className="mt-5 space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setStep("review");
                    }}
                  >
                    <Field label="Full name" value={form.customerName} required minLength={2}
                      onChange={(v) => setForm((f) => ({ ...f, customerName: v }))} />
                    <Field label="Email" type="email" value={form.email} required
                      onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
                    <Field label="Phone" type="tel" value={form.phone} required minLength={7}
                      onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
                    <div className="space-y-2">
                      <Label>Notes (optional)</Label>
                      <Textarea
                        value={form.notes}
                        maxLength={500}
                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                        placeholder="Anything we should know?"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" className="h-12 flex-1 border-border"
                        onClick={() => setStep("select")}>
                        Back
                      </Button>
                      <Button type="submit" className="h-12 flex-1 bg-hype text-primary-foreground">
                        Review order
                      </Button>
                    </div>
                  </form>
                )}

                {step === "review" && selected && (
                  <div className="mt-5 space-y-4">
                    <dl className="space-y-2 rounded-2xl border border-border p-4 text-sm">
                      <Row label="Event" value={event.title} />
                      <Row label="Ticket" value={`${selected.name} × ${qty}`} />
                      <Row label="Name" value={form.customerName} />
                      <Row label="Email" value={form.email} />
                      <Row label="Phone" value={form.phone} />
                      <Separator className="my-2" />
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Total</dt>
                        <dd className="font-display text-2xl text-primary">{formatNaira(total)}</dd>
                      </div>
                    </dl>

                    <p className="rounded-2xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
                      Payment is by bank transfer to {SITE.bank.bank} · {SITE.bank.account} (
                      {SITE.bank.name}). Your ticket stays <strong>pending</strong> until we confirm
                      the transfer — it is never marked paid automatically.
                    </p>

                    <div className="flex gap-2">
                      <Button type="button" variant="outline" className="h-12 flex-1 border-border"
                        onClick={() => setStep("details")} disabled={mutation.isPending}>
                        Back
                      </Button>
                      <Button
                        className="h-12 flex-1 bg-hype text-primary-foreground"
                        onClick={() => mutation.mutate()}
                        disabled={mutation.isPending}
                      >
                        {mutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Ticket className="mr-2 h-4 w-4" /> Place order
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Unique order number + scannable QR
              ticket for every order.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Steps({ step }: { step: Step }) {
  const steps: Step[] = ["select", "details", "review"];
  return (
    <div className="flex items-center gap-1.5" aria-label={`Step ${steps.indexOf(step) + 1} of 3`}>
      {steps.map((s, i) => (
        <span
          key={s}
          className={cn(
            "h-1.5 rounded-full transition-all",
            i <= steps.indexOf(step) ? "w-6 bg-primary" : "w-3 bg-muted",
          )}
        />
      ))}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        className="h-12"
        type={type}
        value={value}
        required={required}
        minLength={minLength}
        maxLength={160}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
