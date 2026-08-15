import { createFileRoute } from "@tanstack/react-router";
import { Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Epic Entertainment — Enquiries & Bookings" },
      {
        name: "description",
        content:
          "Call, WhatsApp, email or message Epic Entertainment in Lagos for event enquiries, ticket support, dance bookings and partnerships.",
      },
      { property: "og:title", content: "Contact Epic Entertainment" },
      {
        property: "og:description",
        content: "Reach the Epic Entertainment team for enquiries, bookings and partnerships.",
      },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(20).optional(),
  subject: z.string().trim().max(150).optional(),
  message: z.string().trim().min(5, "Tell us a bit more").max(2000),
});

function ContactPage() {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("enquiries").insert({
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      subject: parsed.data.subject || null,
      message: parsed.data.message,
    });
    setBusy(false);
    if (error) {
      toast.error("Message failed to send. Please try again.");
      return;
    }
    setForm({ full_name: "", email: "", phone: "", subject: "", message: "" });
    toast.success("Message sent! We'll get back to you shortly.");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <p className="text-xs tracking-[0.3em] text-accent">SAY HELLO</p>
      <h1 className="mt-2 font-display text-5xl sm:text-6xl">
        Let's <span className="text-hype">talk</span>
      </h1>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          {[
            { Icon: Phone, label: "Call us", value: SITE.phone, href: `tel:${SITE.phone}` },
            {
              Icon: MessageCircle,
              label: "WhatsApp",
              value: "Chat with the team",
              href: `https://wa.me/${SITE.whatsapp}`,
            },
            { Icon: Mail, label: "Email", value: SITE.email, href: `mailto:${SITE.email}` },
            {
              Icon: Instagram,
              label: "Instagram",
              value: "@epicentertainment",
              href: SITE.socials.instagram,
            },
            { Icon: MapPin, label: "Based in", value: SITE.city },
          ].map((c) => (
            <div key={c.label} className="card-elevated flex items-start gap-4 rounded-2xl p-5">
              <c.Icon className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-xs tracking-[0.2em] text-muted-foreground">
                  {c.label.toUpperCase()}
                </p>
                {c.href ? (
                  <a
                    href={c.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-semibold hover:text-primary"
                  >
                    {c.value}
                  </a>
                ) : (
                  <p className="font-semibold">{c.value}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="card-elevated space-y-5 rounded-3xl p-6 sm:p-8">
          <h2 className="font-display text-2xl">Send an enquiry</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                required
                maxLength={100}
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                maxLength={255}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                maxLength={20}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                maxLength={150}
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              rows={6}
              required
              maxLength={2000}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>
          <Button
            disabled={busy}
            size="lg"
            className="w-full bg-hype text-primary-foreground hover:opacity-90"
          >
            {busy ? "Sending…" : "Send message"}
          </Button>
        </form>
      </div>
    </div>
  );
}
