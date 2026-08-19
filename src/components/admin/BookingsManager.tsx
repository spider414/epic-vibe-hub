import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, MessageCircle, Paperclip, Phone, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  BOOKING_STATUSES,
  EVENT_TYPES,
  bookingStatusLabel,
  type BookingAttachment,
} from "@/lib/bookings";
import { formatNaira } from "@/lib/site";

type Booking = {
  id: string;
  reference: string | null;
  booking_type: string;
  full_name: string;
  email: string;
  phone: string;
  organisation: string | null;
  contact_method: string;
  event_type: string | null;
  occasion: string | null;
  preferred_date: string | null;
  alt_date: string | null;
  location: string | null;
  guest_count: number | null;
  duration: string | null;
  budget: string | null;
  services: string[];
  package_name: string | null;
  details: string | null;
  attachments: unknown;
  status: string;
  internal_notes: string | null;
  quote_amount: number | null;
  quote_notes: string | null;
  deposit_amount: number | null;
  deposit_status: string;
  balance_amount: number | null;
  created_at: string;
};

const STATUS_TONE: Record<string, string> = {
  new: "bg-primary/15 text-primary",
  contacted: "bg-accent/15 text-accent",
  quoted: "bg-accent/15 text-accent",
  deposit_paid: "bg-primary/15 text-primary",
  confirmed: "bg-primary/20 text-primary",
  in_progress: "bg-muted text-foreground",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/15 text-destructive",
};

function toAttachments(value: unknown): BookingAttachment[] {
  return Array.isArray(value) ? (value as BookingAttachment[]) : [];
}

export function BookingsManager() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [eventType, setEventType] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const bookings = useQuery({
    queryKey: ["admin", "bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Booking[];
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { error } = await supabase.from("bookings").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });
      toast.success("Booking updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (bookings.data ?? []).filter((b) => {
      if (status !== "all" && b.status !== status) return false;
      if (eventType !== "all" && b.event_type !== eventType) return false;
      if (!term) return true;
      return [b.reference, b.full_name, b.email, b.phone, b.organisation, b.location]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [bookings.data, q, status, eventType]);

  const active = (bookings.data ?? []).find((b) => b.id === openId) ?? null;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reference, name, email, phone, location"
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {BOOKING_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={eventType} onValueChange={setEventType}>
          <SelectTrigger className="sm:w-52">
            <SelectValue placeholder="Event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All event types</SelectItem>
            {EVENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
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
                {bookingStatusLabel(b.status)}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {[
                b.event_type,
                b.preferred_date,
                b.guest_count ? `${b.guest_count} guests` : null,
                b.budget,
              ]
                .filter(Boolean)
                .join(" • ") || "No event details provided"}
            </p>
            {b.services?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {b.services.slice(0, 6).map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </button>
        ))}
        {rows.length === 0 && (
          <p className="text-muted-foreground">
            {bookings.isLoading ? "Loading bookings…" : "No booking requests match these filters."}
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
              <BookingDetail
                booking={active}
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

function BookingDetail({
  booking,
  onSave,
  saving,
}: {
  booking: Booking;
  onSave: (patch: Record<string, unknown>) => void;
  saving: boolean;
}) {
  const [notes, setNotes] = useState(booking.internal_notes ?? "");
  const [quote, setQuote] = useState(booking.quote_amount?.toString() ?? "");
  const [quoteNotes, setQuoteNotes] = useState(booking.quote_notes ?? "");
  const [deposit, setDeposit] = useState(booking.deposit_amount?.toString() ?? "");
  const attachments = toAttachments(booking.attachments);
  const balance = Math.max(Number(quote || 0) - Number(deposit || 0), 0);

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
        <Badge variant="outline" className="capitalize">
          {booking.booking_type.replace(/_/g, " ")}
        </Badge>
        <Select value={booking.status} onValueChange={(v) => onSave({ status: v })}>
          <SelectTrigger className="h-8 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BOOKING_STATUSES.map((s) => (
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
          <a href={`mailto:${booking.email}?subject=Epic%20Entertainment%20${booking.reference ?? ""}`}>
            <Mail className="mr-1.5 h-4 w-4" /> Email
          </a>
        </Button>
      </div>

      <section className="rounded-xl border border-border p-4 text-sm">
        <h3 className="font-display text-lg">Request details</h3>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
          <Row label="Email" value={booking.email} />
          <Row label="Phone" value={booking.phone} />
          <Row label="Organisation" value={booking.organisation} />
          <Row label="Preferred contact" value={booking.contact_method} />
          <Row label="Event type" value={booking.event_type} />
          <Row label="Occasion" value={booking.occasion} />
          <Row label="Preferred date" value={booking.preferred_date} />
          <Row label="Alternative date" value={booking.alt_date} />
          <Row label="Location" value={booking.location} />
          <Row label="Guests" value={booking.guest_count?.toString()} />
          <Row label="Duration" value={booking.duration} />
          <Row label="Budget" value={booking.budget} />
          <Row label="Package" value={booking.package_name} />
          <Row label="Received" value={new Date(booking.created_at).toLocaleString()} />
        </dl>
        {booking.services?.length > 0 && (
          <p className="mt-3 text-muted-foreground">
            <span className="text-foreground">Services:</span> {booking.services.join(", ")}
          </p>
        )}
        {booking.details && (
          <p className="mt-3 whitespace-pre-wrap text-muted-foreground">{booking.details}</p>
        )}
      </section>

      {attachments.length > 0 && (
        <section className="rounded-xl border border-border p-4">
          <h3 className="font-display text-lg">Attachments</h3>
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
        <h3 className="font-display text-lg">Internal notes</h3>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Team-only notes about this client…"
        />
        <Button size="sm" disabled={saving} onClick={() => onSave({ internal_notes: notes })}>
          Save notes
        </Button>
      </section>

      <section className="space-y-3 rounded-xl border border-border p-4">
        <h3 className="font-display text-lg">Quote & payments</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="quote-amount">Quote amount (₦)</Label>
            <Input
              id="quote-amount"
              inputMode="decimal"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deposit-amount">Deposit received (₦)</Label>
            <Input
              id="deposit-amount"
              inputMode="decimal"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="quote-notes">Quote notes</Label>
          <Textarea
            id="quote-notes"
            rows={3}
            value={quoteNotes}
            onChange={(e) => setQuoteNotes(e.target.value)}
          />
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
                quote_notes: quoteNotes || null,
                deposit_amount: deposit === "" ? null : Number(deposit),
              })
            }
          >
            Save quote & deposit
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={saving || Number(deposit || 0) <= 0}
            onClick={() =>
              onSave({
                deposit_amount: deposit === "" ? null : Number(deposit),
                deposit_status: "paid",
                status: "deposit_paid",
              })
            }
          >
            Mark deposit paid
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Deposit status: <span className="capitalize">{booking.deposit_status}</span>
        </p>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value || "—"}</dd>
    </div>
  );
}
