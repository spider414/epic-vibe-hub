import { Link } from "@tanstack/react-router";
import { Instagram, Mail, MapPin, Music2, Phone, Twitter, Youtube } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/lib/site";

export function Footer() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > 255) {
      toast.error("Please enter a valid email address");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("subscribers").insert({ email: value });
    setBusy(false);
    if (error && !error.message.includes("duplicate")) {
      toast.error("Could not add you right now. Please try again.");
      return;
    }
    setEmail("");
    toast.success("You're on the list! We'll alert you about every Epic event.");
  }

  return (
    <footer className="border-t border-border/60 bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="font-display text-3xl">
            Never miss <span className="text-hype">an Epic night</span>
          </p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Join the notification list for early-bird tickets, guest lists and pop-up parties across
            Nigeria.
          </p>
          <form onSubmit={subscribe} className="mt-5 flex max-w-md gap-2">
            <Input
              type="email"
              required
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              aria-label="Email address"
            />
            <Button disabled={busy} className="bg-hype text-primary-foreground hover:opacity-90">
              {busy ? "..." : "Join"}
            </Button>
          </form>
        </div>

        <div>
          <h3 className="text-sm tracking-[0.2em] text-muted-foreground">EXPLORE</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              { to: "/events", label: "Upcoming events" },
              { to: "/services", label: "Packages & services" },
              { to: "/dance", label: "Creative Dance Team" },
              { to: "/gallery", label: "Photos & videos" },
              { to: "/book", label: "Book an event" },
              { to: "/contact", label: "Contact us" },
            ].map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-muted-foreground hover:text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm tracking-[0.2em] text-muted-foreground">REACH US</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" /> {SITE.phone}
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" /> {SITE.email}
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> {SITE.city}
            </li>
          </ul>
          <div className="mt-5 flex gap-3">
            {[
              { href: SITE.socials.instagram, Icon: Instagram, label: "Instagram" },
              { href: SITE.socials.tiktok, Icon: Music2, label: "TikTok" },
              { href: SITE.socials.x, Icon: Twitter, label: "X" },
              { href: SITE.socials.youtube, Icon: Youtube, label: "YouTube" },
            ].map(({ href, Icon, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={label}
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {SITE.name}. Lagos • Abuja • Port Harcourt.
      </div>
    </footer>
  );
}
