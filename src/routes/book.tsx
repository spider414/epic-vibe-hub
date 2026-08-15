import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import clubImg from "@/assets/club-night.jpg";
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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/lib/site";

type BookSearch = { package?: string | undefined; type?: string | undefined };

export const Route = createFileRoute("/book")({
  validateSearch: (search: Record<string, unknown>): BookSearch => ({
    package: typeof search["package"] === "string" ? search["package"] : undefined,
    type: typeof search["type"] === "string" ? search["type"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Book Epic Entertainment — Party Planning & Hosting" },
      {
        name: "description",
        content:
          "Book Epic Entertainment to plan and host your pool party, beach party, birthday, wedding or brand event anywhere in Nigeria.",
      },
      { property: "og:title", content: "Book Epic Entertainment for your event" },
      {
        property: "og:description",
        content: "Tell us your vibe, date and budget — we'll come back with a full proposal.",
      },
    ],
  }),
  component: BookPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(20),
  occasion: z.string().trim().max(100).optional(),
  location: z.string().trim().max(200).optional(),
  details: z.string().trim().max(2000).optional(),
});

const TYPES = [
  { value: "event_hosting", label: "Plan / host my event" },
  { value: "dance_performance", label: "Dance performance" },
  { value: "dance_class", label: "Dance classes" },
  { value: "choreography", label: "Choreography session" },
];

function BookPage() {
  const search = Route.useSearch();
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [bookingType, setBookingType] = useState(search.type ?? "event_hosting");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    organisation: "",
    occasion: "",
    preferred_date: "",
    location: "",
    guest_count: "",
    budget: "",
    details: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("bookings").insert({
      booking_type: bookingType,
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      organisation: form.organisation.trim() || null,
      occasion: form.occasion.trim() || null,
      preferred_date: form.preferred_date || null,
      location: form.location.trim() || null,
      guest_count: form.guest_count ? Number(form.guest_count) : null,
      budget: form.budget || null,
      package_name: search.package ?? null,
      details: form.details.trim() || null,
    });
    setBusy(false);
    if (error) {
      toast.error("Could not send your request. Please try again.");
      return;
    }
    setDone(true);
    toast.success("Booking request sent — we'll respond within 24 hours.");
  }

  return (
    <div className="relative isolate">
      <img
        src={clubImg}
        alt=""
        aria-hidden
        loading="lazy"
        className="absolute inset-x-0 top-0 h-72 w-full object-cover opacity-25"
      />
      <div className="absolute inset-x-0 top-0 h-72 night-fade" />

      <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-xs tracking-[0.3em] text-accent">BOOKINGS</p>
        <h1 className="mt-2 font-display text-5xl sm:text-6xl">
          Book <span className="text-hype">Epic Entertainment</span>
        </h1>
        <p className="mt-4 text-muted-foreground">
          Individuals, groups, brands and organisations — tell us what you're planning and we'll come
          back with a tailored proposal and deposit details.
          {search.package && (
            <>
              {" "}
              You selected the <strong className="text-primary">{search.package}</strong> package.
            </>
          )}
        </p>

        {done ? (
          <div className="card-elevated mt-10 rounded-3xl p-10 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
            <h2 className="mt-4 font-display text-3xl">Request received</h2>
            <p className="mt-3 text-muted-foreground">
              Our team will call or email you within 24 hours. For anything urgent, reach us on{" "}
              {SITE.phone}.
            </p>
            <a
              href={`https://wa.me/${SITE.whatsapp}`}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-6 inline-flex rounded-md bg-hype px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Chat with us on WhatsApp
            </a>
          </div>
        ) : (
          <form onSubmit={submit} className="card-elevated mt-10 space-y-5 rounded-3xl p-6 sm:p-8">
            <div className="space-y-2">
              <Label>What do you need?</Label>
              <Select value={bookingType} onValueChange={setBookingType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="full_name"
                label="Full name"
                required
                value={form.full_name}
                onChange={(v) => setForm({ ...form, full_name: v })}
              />
              <Field
                id="organisation"
                label="Company / group (optional)"
                value={form.organisation}
                onChange={(v) => setForm({ ...form, organisation: v })}
              />
              <Field
                id="email"
                label="Email"
                type="email"
                required
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
              />
              <Field
                id="phone"
                label="Phone / WhatsApp"
                required
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
              />
              <Field
                id="occasion"
                label="Occasion"
                placeholder="Birthday, wedding, launch…"
                value={form.occasion}
                onChange={(v) => setForm({ ...form, occasion: v })}
              />
              <Field
                id="preferred_date"
                label="Preferred date"
                type="date"
                value={form.preferred_date}
                onChange={(v) => setForm({ ...form, preferred_date: v })}
              />
              <Field
                id="location"
                label="Location"
                placeholder="Lekki, Lagos"
                value={form.location}
                onChange={(v) => setForm({ ...form, location: v })}
              />
              <Field
                id="guest_count"
                label="Expected guests"
                type="number"
                value={form.guest_count}
                onChange={(v) => setForm({ ...form, guest_count: v })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget range</Label>
              <Select value={form.budget} onValueChange={(v) => setForm({ ...form, budget: v })}>
                <SelectTrigger id="budget">
                  <SelectValue placeholder="Select a range" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Under ₦250,000",
                    "₦250,000 – ₦750,000",
                    "₦750,000 – ₦2,000,000",
                    "₦2,000,000+",
                    "Not sure yet",
                  ].map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="details">Tell us about the vibe</Label>
              <Textarea
                id="details"
                rows={5}
                maxLength={2000}
                value={form.details}
                onChange={(e) => setForm({ ...form, details: e.target.value })}
                placeholder="Theme, music, decor, dancers, venue ideas…"
              />
            </div>

            <Button
              disabled={busy}
              size="lg"
              className="w-full bg-hype text-primary-foreground hover:opacity-90"
            >
              {busy ? "Sending…" : "Send booking request"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        required={required}
        placeholder={placeholder}
        maxLength={200}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
