import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setSignedIn(Boolean(session)),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-hype font-display text-lg text-primary-foreground">
            E
          </span>
          <span className="font-display text-xl leading-none">
            Epic<span className="text-primary">.</span>
            <span className="block text-[10px] tracking-[0.3em] text-muted-foreground">
              ENTERTAINMENT
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-primary" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button asChild variant="ghost" size="sm">
            <Link to={signedIn ? "/admin" : "/auth"}>{signedIn ? "Dashboard" : "Sign in"}</Link>
          </Button>
          <Button asChild size="sm" className="bg-hype text-primary-foreground hover:opacity-90">
            <Link to="/book">Book us</Link>
          </Button>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-lg border border-border lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-base text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to={signedIn ? "/admin" : "/auth"}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-base text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {signedIn ? "Dashboard" : "Sign in"}
            </Link>
            <Button asChild className="mt-2 bg-hype text-primary-foreground">
              <Link to="/book" onClick={() => setOpen(false)}>
                Book us
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
