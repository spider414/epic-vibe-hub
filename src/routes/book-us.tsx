import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Loader2, Paperclip, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import clubImg from "@/assets/club-night.jpg";
import { Reveal } from "@/components/site/Reveal";
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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  BOOKING_SERVICES,
  BUDGET_RANGES,
  CONTACT_METHODS,
  DURATIONS,
  EVENT_TYPES,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_FILES,
  type BookingAttachment,
} from "@/lib/bookings";
import { SITE } from "@/lib/site";

type BookUsSearch = { package?: string | undefined };

export const Route = createFileRoute("/book-us")({
  validateSearch: (search: Record<string, unknown>): BookUsSearch => ({
    package: typeof search["package"] === "string" ? search["package"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Book Us — Have Epic Entertainment Host Your Event" },
      {
        name: "description",
        content:
          "Request Epic Entertainment to plan, host and run your private party, brand event or wedding in Nigeria. Tell us your date, guests, services and budget.",
      },
      { property: "og:title", content: "Book Epic Entertainment for your event" },
      {
        property: "og:description",
        content:
          "Send your event details, pick the services you need and our team will come back with a full proposal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BookUsPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(40),
  event_type: z.string().trim().min(1, "Select the type of event"),
  location: z.string().trim().min(2, "Where is the event holding?").max(240),
});

const emptyForm = {
  full_name: "",
  email: "",
  phone: "",
  organisation: "",
  contact_method: "phone",
  event_type: "",
  preferred_date: "",
  alt_date: "",
  location: "",
  guest_count: "",
  duration: "",
  budget: "",
  details: "",
};

function BookUsPage() {
  const search = Route.useSearch();
  const [form, setForm] = useState(emptyForm);
  const [services, setServices] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  function set<K extends keyof typeof emptyForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleService(name: string) {
    setServices((s) => (s.includes(name) ? s.filter((x) => x !== name) : [...s, name]));
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list);
    const tooBig = incoming.find((f) => f.size > MAX_UPLOAD_BYTES);
    if (tooBig) {
      toast.error(`${tooBig.name} is larger than 10MB`);
      return;
    }
    setFiles((prev) => [...prev, ...incoming].slice(0, MAX_UPLOAD_FILES));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }
    setBusy(true);
    try {
      const attachments: BookingAttachment[] = [];
      for (const file of files) {
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
        const path = `${crypto.randomUUID()}/${safe}`;
        const { error } = await supabase.storage.from("booking-uploads").upload(path, file);
        if (error) throw new Error(`Could not upload ${file.name}`);
        attachments.push({ name: file.name, path, size: file.size, type: file.type });
      }

      const { data, error } = await supabase.rpc("create_booking", {
        _payload: {
          booking_type: "event_hosting",
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          organisation: form.organisation.trim(),
          contact_method: form.contact_method,
          event_type: form.event_type,
          occasion: form.event_type,
          preferred_date: form.preferred_date,
          alt_date: form.alt_date,
          location: form.location.trim(),
          guest_count: form.guest_count,
          duration: form.duration,
          budget: form.budget,
          services,
          package_name: search.package ?? "",
          details: form.details.trim(),
          attachments,
        },
      });
      if (error || !data) throw new Error("submit failed");
      setReference(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast.error("We couldn't send your request. Please try again.");
    } finally {
      setBusy(false);
    }
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

      <div className="relative mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-16">
        <p className="text-xs tracking-[0.3em] text-accent">BOOK US</p>
        <h1 className="mt-2 font-display text-4xl leading-[0.95] sm:text-6xl">
          Let us run <span className="text-hype">your event</span>
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Tell us everything about the party you're planning — date, guests, vibe and the services
          you need. Our team replies with a tailored proposal, quote and deposit details.
          {search.package && (
            <>
              {" "}
              You selected the <strong className="text-primary">{search.package}</strong> package.
            </>
          )}
        </p>

        {reference ? (
          <div className="card-elevated mt-10 rounded-3xl p-8 text-center sm:p-12">
            <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
            <h2 className="mt-4 font-display text-3xl">Thank you</h2>
            <p className="mt-3 text-muted-foreground">
              Your event request has been received. Our team will contact you shortly.
            </p>
            <p className="mt-6 text-xs tracking-[0.3em] text-muted-foreground">
              BOOKING REFERENCE
            </p>
            <p className="mt-1 font-display text-3xl text-primary">{reference}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              Keep this reference — quote it when you call or message us on {SITE.phone}.
            </p>
            <a
              href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
                `Hi Epic Entertainment, my booking reference is ${reference}`,
              )}`}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-6 inline-flex rounded-md bg-hype px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Chat with us on WhatsApp
            </a>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-10 space-y-6">
            <Reveal>
              <Section title="Your details">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    id="full_name"
                    label="Full name"
                    required
                    value={form.full_name}
                    onChange={(v) => set("full_name", v)}
                  />
                  <Field
                    id="organisation"
                    label="Company / organisation"
                    value={form.organisation}
                    onChange={(v) => set("organisation", v)}
                  />
                  <Field
                    id="email"
                    label="Email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(v) => set("email", v)}
                  />
                  <Field
                    id="phone"
                    label="Phone / WhatsApp"
                    required
                    value={form.phone}
                    onChange={(v) => set("phone", v)}
                  />
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="contact_method">Preferred contact method</Label>
                    <Select
                      value={form.contact_method}
                      onValueChange={(v) => set("contact_method", v)}
                    >
                      <SelectTrigger id="contact_method" className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACT_METHODS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Section>
            </Reveal>

            <Reveal delay={80}>
              <Section title="Event details">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="event_type">Event type</Label>
                    <Select value={form.event_type} onValueChange={(v) => set("event_type", v)}>
                      <SelectTrigger id="event_type" className="h-12">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Field
                    id="location"
                    label="Location / venue"
                    required
                    placeholder="Lekki, Lagos"
                    value={form.location}
                    onChange={(v) => set("location", v)}
                  />
                  <Field
                    id="preferred_date"
                    label="Preferred date"
                    type="date"
                    value={form.preferred_date}
                    onChange={(v) => set("preferred_date", v)}
                  />
                  <Field
                    id="alt_date"
                    label="Alternative date"
                    type="date"
                    value={form.alt_date}
                    onChange={(v) => set("alt_date", v)}
                  />
                  <Field
                    id="guest_count"
                    label="Number of guests"
                    type="number"
                    placeholder="150"
                    value={form.guest_count}
                    onChange={(v) => set("guest_count", v)}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="duration">Event duration</Label>
                    <Select value={form.duration} onValueChange={(v) => set("duration", v)}>
                      <SelectTrigger id="duration" className="h-12">
                        <SelectValue placeholder="How long?" />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATIONS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="budget">Estimated budget</Label>
                    <Select value={form.budget} onValueChange={(v) => set("budget", v)}>
                      <SelectTrigger id="budget" className="h-12">
                        <SelectValue placeholder="Select a range" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUDGET_RANGES.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Section>
            </Reveal>

            <Reveal delay={140}>
              <Section
                title="Services you need"
                subtitle="Pick everything that applies — you can adjust later."
              >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {BOOKING_SERVICES.map((s) => {
                    const active = services.includes(s);
                    return (
                      <label
                        key={s}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors ${
                          active
                            ? "border-primary/60 bg-primary/10"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <Checkbox checked={active} onCheckedChange={() => toggleService(s)} />
                        <span>{s}</span>
                      </label>
                    );
                  })}
                </div>
              </Section>
            </Reveal>

            <Reveal delay={200}>
              <Section title="Anything else?">
                <div className="space-y-2">
                  <Label htmlFor="details">Additional information</Label>
                  <Textarea
                    id="details"
                    rows={5}
                    maxLength={4000}
                    value={form.details}
                    onChange={(e) => set("details", e.target.value)}
                    placeholder="Theme, colours, music, special requests, sponsors, timeline…"
                  />
                </div>

                <div className="mt-5 space-y-3">
                  <Label htmlFor="attachments">
                    Upload files, photos or reference documents (optional)
                  </Label>
                  <Input
                    id="attachments"
                    type="file"
                    multiple
                    accept="image/*,application/pdf,.doc,.docx"
                    className="h-12 cursor-pointer file:mr-3 file:text-primary"
                    onChange={(e) => {
                      addFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Up to {MAX_UPLOAD_FILES} files, 10MB each.
                  </p>
                  {files.length > 0 && (
                    <ul className="space-y-2">
                      {files.map((f, i) => (
                        <li
                          key={`${f.name}-${i}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="truncate">{f.name}</span>
                          </span>
                          <button
                            type="button"
                            aria-label={`Remove ${f.name}`}
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => setFiles((prev) => prev.filter((_, x) => x !== i))}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Section>
            </Reveal>

            <Button
              disabled={busy}
              size="lg"
              className="w-full bg-hype text-primary-foreground hover:opacity-90 sm:h-14 sm:text-base"
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {busy ? "Sending your request…" : "Send event request"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card-elevated rounded-3xl p-5 sm:p-8">
      <h2 className="font-display text-2xl">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </section>
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
        className="h-12"
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        maxLength={240}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
