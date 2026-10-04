import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CalendarDays, LogOut, MapPin, Music2, PartyPopper, Ticket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "My account — Epic Entertainment" },
      { name: "description", content: "Your Epic Entertainment tickets and bookings in one place." },
      { property: "og:title", content: "My account — Epic Entertainment" },
      { property: "og:description", content: "View your tickets and bookings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

type Order = {
  order_number: string | null;
  reference: string | null;
  access_token: string | null;
  quantity: number;
  amount_total: number;
  payment_status: string;
  ticket_type: string | null;
  event_title: string | null;
  event_starts_at: string | null;
  event_venue: string | null;
};
type Booking = {
  reference: string | null;
  event_type: string | null;
  date: string | null;
  location: string | null;
  status: string;
  quote_amount: number | null;
  balance_amount: number | null;
};
type Activity = { orders: Order[]; bookings: Booking[]; dance_bookings: Booking[] };

const naira = (n: number | null | undefined) =>
  n == null ? "—" : `₦${Number(n).toLocaleString("en-NG")}`;
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "Date TBC";

function AccountPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });
  const { data, isLoading, error } = useQuery({
    queryKey: ["my-activity"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_my_activity" as never);
      if (error) throw error;
      return data as unknown as Activity;
    },
  });

  async function signOut() {
    await supabase.auth.signOut();
    qc.clear();
    navigate({ to: "/", replace: true });
  }

  const name = (user?.user_metadata?.["full_name"] as string | undefined) || user?.email;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.3em] text-muted-foreground">MY ACCOUNT</p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl">
            Hey, <span className="text-hype">{name}</span>
          </h1>
        </div>
        <Button variant="outline" className="border-border" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>

      {isLoading && <p className="mt-10 text-muted-foreground">Loading your activity…</p>}
      {error && <p className="mt-10 text-destructive">Couldn't load your activity. Please refresh.</p>}

      {data && (
        <div className="mt-10 space-y-12">
          <Section icon={<Ticket className="h-5 w-5" />} title="My tickets" empty="No tickets yet." count={data.orders.length}
            cta={<Link to="/events" className="text-primary underline">Browse events</Link>}>
            {data.orders.map((o, i) => (
              <div key={i} className="card-elevated flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
                <div>
                  <p className="font-display text-xl">{o.event_title ?? "Event"}</p>
                  <p className="mt-1 flex flex-wrap gap-x-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" />{fmtDate(o.event_starts_at)}</span>
                    {o.event_venue && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{o.event_venue}</span>}
                  </p>
                  <p className="mt-1 text-sm">
                    {o.quantity} × {o.ticket_type ?? "ticket"} · {naira(o.amount_total)} · <Status s={o.payment_status} />
                  </p>
                </div>
                {o.access_token && (
                  <Button asChild className="bg-hype text-primary-foreground">
                    <Link to="/tickets/$token" params={{ token: o.access_token }}>View ticket</Link>
                  </Button>
                )}
              </div>
            ))}
          </Section>

          <Section icon={<PartyPopper className="h-5 w-5" />} title="My event bookings" empty="No event bookings yet." count={data.bookings.length}
            cta={<Link to="/book-us" className="text-primary underline">Book Epic for your event</Link>}>
            {data.bookings.map((b, i) => <BookingRow key={i} b={b} />)}
          </Section>

          <Section icon={<Music2 className="h-5 w-5" />} title="My dance team bookings" empty="No dance team bookings yet." count={data.dance_bookings.length}
            cta={<Link to="/book-dance-team" className="text-primary underline">Book the dance team</Link>}>
            {data.dance_bookings.map((b, i) => <BookingRow key={i} b={b} />)}
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ icon, title, empty, count, cta, children }: {
  icon: React.ReactNode; title: string; empty: string; count: number; cta: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="flex items-center gap-2 font-display text-2xl">{icon}{title}</h2>
      <div className="mt-4 grid gap-3">
        {count === 0 ? <p className="rounded-2xl border border-border p-5 text-sm text-muted-foreground">{empty} {cta}</p> : children}
      </div>
    </section>
  );
}

function BookingRow({ b }: { b: Booking }) {
  return (
    <div className="card-elevated rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-xl">{b.event_type ?? "Booking"}</p>
        <span className="font-mono text-xs text-muted-foreground">{b.reference}</span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{fmtDate(b.date)}{b.location ? ` · ${b.location}` : ""}</p>
      <p className="mt-1 text-sm">
        <Status s={b.status} /> · Quote {naira(b.quote_amount)} · Balance {naira(b.balance_amount)}
      </p>
    </div>
  );
}

function Status({ s }: { s: string }) {
  return <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">{s.replace(/_/g, " ")}</span>;
}
