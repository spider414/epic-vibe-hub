import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Loader2, Paperclip, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import danceImg from "@/assets/dance-team.jpg";
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
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_FILES, type BookingAttachment } from "@/lib/bookings";
import {
  DANCE_BUDGETS,
  DANCE_DURATIONS,
  DANCE_EVENT_TYPES,
  DANCE_STYLES,
} from "@/lib/dance";
import { SITE } from "@/lib/site";

type Search = { service?: string | undefined; classes?: boolean | undefined };

export const Route = createFileRoute("/book-dance-team")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    service: typeof search["service"] === "string" ? search["service"] : undefined,
    classes:
      search["classes"] === true || search["classes"] === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Book the Creative Dance Team — Performances, Classes & Choreography" },
      {
        name: "description",
        content:
          "Request professional dancers from the Creative Dance Team for your party, wedding, music video or club night in Nigeria, or book choreography and dance classes.",
      },
      { property: "og:title", content: "Book the Creative Dance Team" },
      {
        property: "og:description",
        content:
          "Tell us your date, style, location and number of dancers — we'll send a routine plan and quote.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BookDanceTeamPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(40),
  event_type: z.string().trim().min(1, "Select the type of event"),
  location: z.string().trim().min(2, "Where is it holding?").max(240),
});

function BookDanceTeamPage() {
  const search = Route.useSearch();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    event_type: "",
    event_date: "",
    location: "",
    dancers_count: "",
    duration: "",
    dance_style: "",
    budget: "",
    details: search.service ? `Interested in: ${search.service}` : "",
  });
  const [choreography, setChoreography] = useState(false);
  const [classes, setClasses] = useState(Boolean(search.classes));
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
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
        const path = `dance/${crypto.randomUUID()}/${safe}`;
        const { error } = await supabase.storage.from("booking-uploads").upload(path, file);
        if (error) throw new Error(`Could not upload ${file.name}`);
        attachments.push({ name: file.name, path, size: file.size, type: file.type });
      }

      const { data, error } = await supabase.rpc("create_dance_booking", {
        _payload: {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          event_type: form.event_type,
          event_date: form.event_date,
          location: form.location.trim(),
          dancers_count: form.dancers_count,
          duration: form.duration,
          dance_style: form.dance_style,
          needs_choreography: choreography,
          needs_classes: classes,
          budget: form.budget,
          details: form.details.trim(),
          attachments,
        },
      });
      if (error || !data) throw new Error("submit failed");
      setReference(data as string);
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
        src={danceImg}
        alt=""
        aria-hidden
        loading="lazy"
        className="absolute inset-x-0 top-0 h-72 w-full object-cover opacity-25"
      />
      <div className="absolute inset-x-0 top-0 h-72 night-fade" />

      <div className="relative mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-16">
        <p className="text-xs tracking-[0.3em] text-accent">CREATIVE DANCE TEAM</p>
        <h1 className="mt-2 font-display text-4xl leading-[0.95] sm:text-6xl">
          Book the <span className="text-hype">dance team</span>
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Performances, choreography, classes and private training. Share your details and we'll
          reply with a routine plan, dancer count and quote.
        </p>

        {reference ? (
          <div className="card-elevated mt-10 rounded-3xl p-8 text-center sm:p-12">
            <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
            <h2 className="mt-4 font-display text-3xl">Thank you</h2>
            <p className="mt-3 text-muted-foreground">
              Your dance booking request has been received. Our team will contact you shortly.
            </p>
            <p className="mt-6 text-xs tracking-[0.3em] text-muted-foreground">
              BOOKING REFERENCE
            </p>
            <p className="mt-1 font-display text-3xl text-primary">{reference}</p>
            <a
              href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
                `Hi Creative Dance Team, my booking reference is ${reference}`,
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
                    id="phone"
                    label="Phone / WhatsApp"
                    required
                    value={form.phone}
                    onChange={(v) => set("phone", v)}
                  />
                  <Field
                    id="email"
                    label="Email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(v) => set("email", v)}
                  />
                </div>
              </Section>
            </Reveal>

            <Reveal delay={80}>
              <Section title="Performance details">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="event_type">Event type</Label>
                    <Select value={form.event_type} onValueChange={(v) => set("event_type", v)}>
                      <SelectTrigger id="event_type" className="h-12">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DANCE_EVENT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Field
                    id="event_date"
                    label="Event date"
                    type="date"
                    value={form.event_date}
                    onChange={(v) => set("event_date", v)}
                  />
                  <Field
                    id="location"
                    label="Location"
                    required
                    placeholder="Venue, area, city"
                    value={form.location}
                    onChange={(v) => set("location", v)}
                  />
                  <Field
                    id="dancers_count"
                    label="Number of dancers"
                    type="number"
                    placeholder="e.g. 4"
                    value={form.dancers_count}
                    onChange={(v) => set("dancers_count", v)}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="duration">Performance duration</Label>
                    <Select value={form.duration} onValueChange={(v) => set("duration", v)}>
                      <SelectTrigger id="duration" className="h-12">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {DANCE_DURATIONS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dance_style">Dance style</Label>
                    <Select value={form.dance_style} onValueChange={(v) => set("dance_style", v)}>
                      <SelectTrigger id="dance_style" className="h-12">
                        <SelectValue placeholder="Select a style" />
                      </SelectTrigger>
                      <SelectContent>
                        {DANCE_STYLES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
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
                        {DANCE_BUDGETS.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors ${
                      choreography
                        ? "border-primary/60 bg-primary/10"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <Checkbox
                      checked={choreography}
                      onCheckedChange={() => setChoreography((v) => !v)}
                    />
                    <span>Choreography required</span>
                  </label>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors ${
                      classes
                        ? "border-primary/60 bg-primary/10"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <Checkbox checked={classes} onCheckedChange={() => setClasses((v) => !v)} />
                    <span>Dance class required</span>
                  </label>
                </div>
              </Section>
            </Reveal>

            <Reveal delay={140}>
              <Section title="Anything else?">
                <div className="space-y-2">
                  <Label htmlFor="details">Additional information</Label>
                  <Textarea
                    id="details"
                    rows={5}
                    maxLength={4000}
                    value={form.details}
                    onChange={(e) => set("details", e.target.value)}
                    placeholder="Songs, theme, costume colours, stage size, timeline…"
                  />
                </div>

                <div className="mt-5 space-y-3">
                  <Label htmlFor="attachments">Reference files, photos or videos (optional)</Label>
                  <Input
                    id="attachments"
                    type="file"
                    multiple
                    accept="image/*,video/*,application/pdf,.doc,.docx"
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
              {busy ? "Sending your request…" : "Send dance booking request"}
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
