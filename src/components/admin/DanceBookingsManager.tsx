import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, MessageCircle, Paperclip, Phone, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { type BookingAttachment } from "@/lib/bookings";
import { DANCE_BOOKING_STATUSES, danceStatusLabel } from "@/lib/dance";
import { formatNaira } from "@/lib/site";

type DanceBooking = {
  id: string;
  reference: string | null;
  full_name: string;
  email: string;
  phone: string;
  event_type: string | null;
  event_date: string | null;
  location: string | null;
  dancers_count: number | null;
  duration: string | null;
  dance_style: string | null;
  needs_choreography: boolean;
  needs_classes: boolean;
  budget: string | null;
  details: string | null;
  attachments: unknown;
  assigned_dancers: string[];
  status: string;
  internal_notes: string | null;
  quote_amount: number | null;
  amount_paid: number | null;
  payment_status: string;
  balance_amount: number | null;
  created_at: string;
};

const STATUS_TONE: Record<string, string> = {
  new: "bg-primary/15 text-primary",
  contacted: "bg-accent/15 text-accent",
  quoted: "bg-accent/15 text-accent",
  confirmed: "bg-primary/20 text-primary",
  in_progress: "bg-muted text-foreground",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/15 text-destructive",
};

function toAttachments(value: unknown): BookingAttachment[] {
  return Array.isArray(value) ? (value as BookingAttachment[]) : [];
}

export function DanceBookingsManager() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const bookings = useQuery({
    queryKey: ["admin", "dance-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dance_bookings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as DanceBooking[];
    },
  });

  const dancers = useQuery({
    queryKey: ["admin", "dancers", "roster"],
    queryFn: async () => {
      const { data, error } = await supabase.from("dancers").select("id,name").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { error } = await supabase.from("dance_bookings").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "dance-bookings"] });
      toast.success("Dance booking updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (bookings.data ?? []).filter((b) => {
      if (status !== "all" && b.status !== status) return false;
      if (!term) return true;
      return [b.reference, b.full_name, b.email, b.phone, b.location, b.dance_style]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [bookings.data, q, status]);

  const active = (bookings.data ?? []).find((b) => b.id === openId) ?? null;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reference, name, email, phone, location, style"
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {DANCE_BOOKING_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {rows.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setOpenId(b.id)}
            className="w-full rounded-xl border border-border p-4 text-left transition-colors hover:border-primary/60"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {b.full_name}
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    {b.reference ?? "—"}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {b.email} • {b.phone}
                  {b.location ? ` • ${b.location}` : ""}
                </p>
              </div>
              <Badge className={STATUS_TONE[b.status] ?? "bg-muted"} variant="secondary">
                {danceStatusLabel(b.status)}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {[
                b.event_type,
                b.event_date,
                b.dance_style,
                b.dancers_count ? `${b.dancers_count} dancers` : null,
                b.needs_choreography ? "Choreography" : null,
                b.needs_classes ? "Classes" : null,
              ]
                .filter(Boolean)
                .join(" • ") || "No performance details provided"}
            </p>
          </button>
        ))}
        {rows.length === 0 && (
          <p className="text-muted-foreground">
            {bookings.isLoading
              ? "Loading dance bookings…"
              : "No dance booking requests match these filters."}
          </p>
        )}
      </div>

      <Sheet open={Boolean(active)} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {active && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-2xl">{active.full_name}</SheetTitle>
              </SheetHeader>
              <DanceBookingDetail
                booking={active}
                roster={dancers.data ?? []}
                onSave={(patch) => update.mutate({ id: active.id, patch })}
                saving={update.isPending}
              />
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DanceBookingDetail({
  booking,
  roster,
  onSave,
  saving,
}: {
  booking: DanceBooking;
  roster: { id: string; name: string }[];
  onSave: (patch: Record<string, unknown>) => void;
  saving: boolean;
}) {
  const [notes, setNotes] = useState(booking.internal_notes ?? "");
  const [quote, setQuote] = useState(booking.quote_amount?.toString() ?? "");
  const [paid, setPaid] = useState(booking.amount_paid?.toString() ?? "");
  const [assigned, setAssigned] = useState<string[]>(booking.assigned_dancers ?? []);
  const attachments = toAttachments(booking.attachments);
  const balance = Math.max(Number(quote || 0) - Number(paid || 0), 0);

  function toggleDancer(id: string) {
    setAssigned((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  }

  async function openAttachment(path: string) {
    const { data, error } = await supabase.storage
      .from("booking-uploads")
      .createSignedUrl(path, 60 * 10);
    if (error || !data) {
      toast.error("Could not open file");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  return (
    <div className="mt-5 space-y-6 pb-10">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="font-mono">
          {booking.reference ?? "—"}
        </Badge>
        <Select value={booking.status} onValueChange={(v) => onSave({ status: v })}>
          <SelectTrigger className="h-8 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DANCE_BOOKING_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button asChild variant="outline" size="sm">
          <a href={`tel:${booking.phone}`}>
            <Phone className="mr-1.5 h-4 w-4" /> Call
          </a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a
            href={`https://wa.me/${booking.phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp
          </a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a
            href={`mailto:${booking.email}?subject=Creative%20Dance%20Team%20${booking.reference ?? ""}`}
          >
            <Mail className="mr-1.5 h-4 w-4" /> Email
          </a>
        </Button>
      </div>

      <section className="rounded-xl border border-border p-4 text-sm">
        <h3 className="font-display text-lg">Customer & request</h3>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
          <Row label="Email" value={booking.email} />
          <Row label="Phone" value={booking.phone} />
          <Row label="Event type" value={booking.event_type} />
          <Row label="Event date" value={booking.event_date} />
          <Row label="Location" value={booking.location} />
          <Row label="Dancers requested" value={booking.dancers_count?.toString()} />
          <Row label="Duration" value={booking.duration} />
          <Row label="Dance style" value={booking.dance_style} />
          <Row label="Choreography" value={booking.needs_choreography ? "Yes" : "No"} />
          <Row label="Dance class" value={booking.needs_classes ? "Yes" : "No"} />
          <Row label="Budget" value={booking.budget} />
          <Row label="Received" value={new Date(booking.created_at).toLocaleString()} />
        </dl>
        {booking.details && (
          <p className="mt-3 whitespace-pre-wrap text-muted-foreground">{booking.details}</p>
        )}
      </section>

      {attachments.length > 0 && (
        <section className="rounded-xl border border-border p-4">
          <h3 className="font-display text-lg">Reference files</h3>
          <ul className="mt-3 space-y-2">
            {attachments.map((a) => (
              <li key={a.path}>
                <button
                  type="button"
                  onClick={() => openAttachment(a.path)}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Paperclip className="h-4 w-4" /> {a.name}
                  <span className="text-xs text-muted-foreground">
                    {(a.size / 1024).toFixed(0)} KB
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3 rounded-xl border border-border p-4">
        <h3 className="font-display text-lg">Assign dancers</h3>
        {roster.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add dancers to the roster in the Content tab first.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {roster.map((d) => (
              <label
                key={d.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <Checkbox
                  checked={assigned.includes(d.id)}
                  onCheckedChange={() => toggleDancer(d.id)}
                />
                <span>{d.name}</span>
              </label>
            ))}
          </div>
        )}
        <Button
          size="sm"
          disabled={saving || roster.length === 0}
          onClick={() => onSave({ assigned_dancers: assigned })}
        >
          Save assignment
        </Button>
      </section>

      <section className="space-y-3 rounded-xl border border-border p-4">
        <h3 className="font-display text-lg">Internal notes</h3>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Team-only notes about this booking…"
        />
        <Button size="sm" disabled={saving} onClick={() => onSave({ internal_notes: notes })}>
          Save notes
        </Button>
      </section>

      <section className="space-y-3 rounded-xl border border-border p-4">
        <h3 className="font-display text-lg">Quote & payment</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="dance-quote">Quote amount (₦)</Label>
            <Input
              id="dance-quote"
              inputMode="decimal"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dance-paid">Amount received (₦)</Label>
            <Input
              id="dance-paid"
              inputMode="decimal"
              value={paid}
              onChange={(e) => setPaid(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Remaining balance</span>
          <span className="font-display text-lg text-primary">{formatNaira(balance)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={saving}
            onClick={() =>
              onSave({
                quote_amount: quote === "" ? null : Number(quote),
                amount_paid: paid === "" ? null : Number(paid),
              })
            }
          >
            Save quote & payment
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={saving || Number(paid || 0) <= 0}
            onClick={() =>
              onSave({
                amount_paid: paid === "" ? null : Number(paid),
                payment_status: balance === 0 ? "paid" : "part_paid",
              })
            }
          >
            Record payment
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Payment status: <span className="capitalize">{booking.payment_status.replace("_", " ")}</span>
        </p>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value || "—"}</dd>
    </div>
  );
}
