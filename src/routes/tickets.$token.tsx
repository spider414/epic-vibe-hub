import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Download, Loader2, MapPin, ShieldCheck } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { formatDay, formatNaira, formatTime, SITE } from "@/lib/site";

export const Route = createFileRoute("/tickets/$token")({
  head: () => ({
    meta: [
      { title: "Your ticket — Epic Entertainment" },
      { name: "description", content: "View, download and present your Epic Entertainment digital ticket." },
      { property: "og:title", content: "Your ticket — Epic Entertainment" },
      { property: "og:description", content: "View, download and present your Epic Entertainment digital ticket." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TicketPage,
});

type OrderPayload = {
  order: {
    order_number: string;
    customer_name: string;
    email: string;
    quantity: number;
    amount_total: number;
    payment_status: string;
    ticket_type: string;
    created_at: string;
  };
  event: {
    title: string;
    slug: string;
    starts_at: string;
    venue: string;
    city: string;
    flyer_url: string | null;
    status: string;
  } | null;
  tickets: Array<{
    ticket_code: string;
    serial: number;
    status: string;
    holder_name: string | null;
  }>;
};

const STATUS_COPY: Record<string, { label: string; tone: string }> = {
  pending: { label: "Awaiting payment", tone: "border-amber-400/40 bg-amber-400/10 text-amber-300" },
  paid: { label: "Paid", tone: "border-primary/40 bg-primary/10 text-primary" },
  cancelled: { label: "Cancelled", tone: "border-destructive/40 bg-destructive/10 text-destructive" },
  refunded: { label: "Refunded", tone: "border-muted-foreground/30 bg-muted text-muted-foreground" },
  checked_in: { label: "Checked in", tone: "border-primary/40 bg-primary/10 text-primary" },
};

function QrCode({ value }: { value: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, { margin: 1, width: 320 }).then((url) => {
      if (active) setSrc(url);
    });
    return () => {
      active = false;
    };
  }, [value]);
  if (!src) return <div className="h-40 w-40 animate-pulse rounded-xl bg-muted" />;
  return <img src={src} alt={`QR code for ticket ${value}`} className="h-40 w-40 rounded-xl bg-white p-2" />;
}

function TicketPage() {
  const { token } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["ticket-order", token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_order_by_token", { _token: token });
      if (error) throw error;
      return (data ?? null) as OrderPayload | null;
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!data?.order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl">Ticket not found</h1>
        <p className="mt-3 text-muted-foreground">This ticket link is invalid or has expired.</p>
        <Button asChild className="mt-6 bg-hype text-primary-foreground">
          <Link to="/events">Browse events</Link>
        </Button>
      </div>
    );
  }

  const { order, event, tickets } = data;
  const status = STATUS_COPY[order.payment_status] ?? {
    label: order.payment_status,
    tone: "border-border bg-muted text-muted-foreground",
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
        {SITE.name}
      </p>
      <h1 className="mt-2 font-display text-4xl leading-none sm:text-5xl">
        {event?.title ?? "Your ticket"}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        {event ? (
          <>
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              {formatDay(event.starts_at)} · {formatTime(event.starts_at)}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              {event.venue}, {event.city}
            </span>
          </>
        ) : null}
        <span
          className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${status.tone}`}
        >
          {status.label}
        </span>
      </div>

      <div className="ticket-shell mt-8 rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Order number" value={order.order_number} />
          <Field label="Ticket type" value={order.ticket_type} />
          <Field label="Name" value={order.customer_name} />
          <Field label="Quantity" value={String(order.quantity)} />
          <Field label="Total" value={formatNaira(Number(order.amount_total))} />
          <Field label="Email" value={order.email} />
        </div>

        <Separator className="my-6" />

        {order.payment_status === "paid" && tickets.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {tickets.map((t) => (
              <div
                key={t.ticket_code}
                className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-background p-5 text-center"
              >
                <QrCode value={t.ticket_code} />
                <p className="font-mono text-sm">{t.ticket_code}</p>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Ticket {t.serial} of {order.quantity} · {t.status.replace("_", " ")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
            <p className="flex items-center gap-2 font-semibold text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" /> Payment pending
            </p>
            <p className="mt-2">
              Transfer <strong className="text-foreground">{formatNaira(Number(order.amount_total))}</strong> to{" "}
              <strong className="text-foreground">
                {SITE.bank.name} · {SITE.bank.bank} · {SITE.bank.account}
              </strong>{" "}
              using <strong className="text-foreground">{order.order_number}</strong> as the reference. Your QR
              tickets appear here automatically once we confirm the payment.
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            className="bg-hype text-primary-foreground"
            onClick={() => window.print()}
            disabled={order.payment_status !== "paid"}
          >
            <Download className="mr-2 h-4 w-4" /> Download ticket
          </Button>
          <Button asChild variant="outline">
            <Link to="/events">Browse more events</Link>
          </Button>
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Keep this link safe — anyone with it can view your ticket. Questions? {SITE.email}
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
