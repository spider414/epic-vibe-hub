import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Ticket, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/events", label: "Events" },
  { to: "/services", label: "Services" },
  { to: "/dance", label: "Dance Team" },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setSignedIn(Boolean(session)),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isAdminArea = pathname.startsWith("/admin");

  return (
    <>
      <header
        className={cn(
          "no-print sticky top-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-border/70 bg-background/85 backdrop-blur-xl"
            : "border-b border-transparent bg-gradient-to-b from-background/90 to-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Epic Entertainment home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-hype font-display text-lg text-primary-foreground shadow-[var(--shadow-glow)]">
              E
            </span>
            <span className="font-display text-lg leading-none sm:text-xl">
              Epic<span className="text-primary">.</span>
              <span className="block text-[9px] tracking-[0.32em] text-muted-foreground sm:text-[10px]">
                ENTERTAINMENT
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                activeProps={{ className: "bg-muted/70 text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link to={signedIn ? "/admin" : "/auth"}>{signedIn ? "Dashboard" : "Sign in"}</Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-border bg-transparent tracking-wide"
            >
              <Link to="/book">BOOK US</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-hype tracking-wide text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-90"
            >
              <Link to="/events">
                <Ticket className="mr-1.5 h-4 w-4" /> GET TICKETS
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <Button
              asChild
              size="sm"
              className="h-10 bg-hype px-3 text-xs tracking-wide text-primary-foreground"
            >
              <Link to="/events">
                <Ticket className="mr-1 h-4 w-4" /> TICKETS
              </Link>
            </Button>
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE SHEET */}
      <div
        className={cn(
          "no-print fixed inset-0 z-40 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={cn(
            "absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
        />
        <nav
          className={cn(
            "absolute inset-x-0 top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border/70 bg-card px-4 pb-10 pt-4 transition-transform duration-300",
            open ? "translate-y-0" : "-translate-y-4 opacity-0",
          )}
        >
          <ul className="flex flex-col">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="flex min-h-14 items-center justify-between border-b border-border/60 font-display text-2xl text-foreground"
                  activeProps={{ className: "text-primary" }}
                >
                  {item.label}
                  <span className="text-muted-foreground">→</span>
                </Link>
              </li>
            ))}
            <li>
              <Link
                to={signedIn ? "/admin" : "/auth"}
                className="flex min-h-14 items-center border-b border-border/60 text-base text-muted-foreground"
              >
                {signedIn ? "Dashboard" : "Team sign in"}
              </Link>
            </li>
          </ul>
          <div className="mt-6 grid gap-3">
            <Button asChild size="lg" className="h-14 bg-hype text-base text-primary-foreground">
              <Link to="/events">
                <Ticket className="mr-2 h-5 w-5" /> GET TICKETS
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 border-border text-base">
              <Link to="/book">BOOK US</Link>
            </Button>
          </div>
        </nav>
      </div>

      {/* STICKY MOBILE CTA */}
      {!isAdminArea && (
        <div className="no-print pointer-events-none fixed inset-x-0 bottom-0 z-30 p-3 lg:hidden">
          <div className="pointer-events-auto mx-auto flex max-w-md gap-2 rounded-2xl border border-border/70 bg-background/90 p-2 shadow-[var(--shadow-card)] backdrop-blur-xl">
            <Button asChild className="h-12 flex-1 bg-hype text-primary-foreground">
              <Link to="/events">
                <Ticket className="mr-2 h-4 w-4" /> Get tickets
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 flex-1 border-border">
              <Link to="/book">Book us</Link>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
