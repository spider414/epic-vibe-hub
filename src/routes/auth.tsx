import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { homeForCurrentUser } from "@/lib/account";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Epic Entertainment" },
      {
        name: "description",
        content:
          "Sign in to Epic Entertainment to see your tickets and bookings, or access the team dashboard.",
      },
      { property: "og:title", content: "Sign in — Epic Entertainment" },
      { property: "og:description", content: "Guest and team sign-in for Epic Entertainment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const credsSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"guest" | "team">("guest");
  const [busy, setBusy] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteUnlocked, setInviteUnlocked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return;
      if (localStorage.getItem("epic_login_mode") === "guest") {
        navigate({ to: "/account", replace: true });
        return;
      }
      homeForCurrentUser().then((to) => navigate({ to, replace: true }));
    });
  }, [navigate]);

  async function unlockRegistration(e: React.FormEvent) {
    e.preventDefault();
    const parsedEmail = z.string().trim().email().max(255).safeParse(inviteEmail);
    if (!parsedEmail.success) {
      toast.error("Enter the email you will register with");
      return;
    }
    if (!/^\d{6}$/.test(inviteCode.trim())) {
      toast.error("Enter the 6-digit code from your admin");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.rpc("claim_invite_code" as never, {
      _code: inviteCode.trim(),
      _email: parsedEmail.data,
    } as never);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data) {
      toast.error("That code is invalid, already used or expired. Ask your admin for a new one.");
      return;
    }
    setEmail(parsedEmail.data);
    setInviteUnlocked(true);
    toast.success("Code accepted — complete your registration now.");
  }


  async function finishSignIn() {
    const home = await homeForCurrentUser();
    if (mode === "team") {
      if (home !== "/admin") {
        await supabase.auth.signOut();
        toast.error("This email is not registered as a team member. Use the Guest tab instead.");
        return;
      }
      localStorage.setItem("epic_login_mode", "team");
      navigate({ to: "/admin", replace: true });
      return;
    }
    localStorage.setItem("epic_login_mode", "guest");
    navigate({ to: "/account", replace: true });
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    const parsed = credsSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await finishSignIn();
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    const parsed = credsSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    if (mode === "team" && parsed.data.email.toLowerCase() !== inviteEmail.trim().toLowerCase()) {
      toast.error("Use the same email the invite code was verified with.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      ...parsed.data,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName.trim() },
      },
    });
    setBusy(false);
    if (error) {
      const invalidCode = /invite code/i.test(error.message);
      toast.error(
        invalidCode
          ? "Your invite code expired. Ask your admin for a new one."
          : error.message,
      );
      if (invalidCode) {
        setInviteUnlocked(false);
        setInviteCode("");
      }
      return;
    }

    if (data.session) {
      await finishSignIn();
      return;
    }
    toast.success("Check your email to confirm your account.");
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    await finishSignIn();
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-20">
      <h1 className="font-display text-4xl">
        {mode === "guest" ? (
          <>My <span className="text-hype">account</span></>
        ) : (
          <>Team <span className="text-hype">access</span></>
        )}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {mode === "guest"
          ? "Sign in or create a free account to see your tickets and bookings."
          : "Sign in to manage events, tickets, bookings and content."}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-1 rounded-2xl border border-border bg-muted/30 p-1">
        {(["guest", "team"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "rounded-xl py-2.5 text-sm font-medium transition-colors",
              mode === m ? "bg-hype text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m === "guest" ? "Guest" : "Team member"}
          </button>
        ))}
      </div>

      <div className="card-elevated mt-8 rounded-3xl p-6">
        <Tabs defaultValue="signin" key={mode}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={signIn} className="space-y-4 pt-4">
              <EmailPassword {...{ email, setEmail, password, setPassword }} />
              <Button
                disabled={busy}
                className="w-full bg-hype text-primary-foreground hover:opacity-90"
              >
                {busy ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            {mode === "team" && !inviteUnlocked ? (
              <form onSubmit={unlockRegistration} className="space-y-4 pt-4">
                <p className="rounded-2xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  Registration is invite-only. Ask an admin to generate a 6-digit code in the
                  dashboard. Each code works once and expires after 5 minutes.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="inviteEmail">Your email</Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    required
                    maxLength={255}
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inviteCode">6-digit invite code</Label>
                  <Input
                    id="inviteCode"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    className="text-center font-display text-2xl tracking-[0.5em]"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                </div>
                <Button
                  disabled={busy}
                  className="w-full bg-hype text-primary-foreground hover:opacity-90"
                >
                  {busy ? "Checking…" : "Verify code"}
                </Button>
              </form>
            ) : (
              <form onSubmit={signUp} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    maxLength={100}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <EmailPassword {...{ email, setEmail, password, setPassword }} />
                <Button
                  disabled={busy}
                  className="w-full bg-hype text-primary-foreground hover:opacity-90"
                >
                  {busy ? "Creating…" : "Create account"}
                </Button>
              </form>
            )}
          </TabsContent>

        </Tabs>

        {(mode === "guest" || inviteUnlocked) && (
          <>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" />
            </div>
            <Button variant="outline" className="w-full border-border" onClick={google}>
              Continue with Google
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function EmailPassword({
  email,
  setEmail,
  password,
  setPassword,
}: {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          maxLength={255}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={show ? "text" : "password"}
            required
            minLength={8}
            maxLength={72}
            className="pr-11"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground transition-colors hover:text-foreground"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </>
  );
}
