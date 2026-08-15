import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Epic Entertainment Team Dashboard" },
      {
        name: "description",
        content:
          "Sign in to the Epic Entertainment dashboard to manage events, tickets, bookings and content.",
      },
      { property: "og:title", content: "Sign in — Epic Entertainment" },
      { property: "og:description", content: "Team access to the Epic Entertainment dashboard." },
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
  const [busy, setBusy] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    const parsed = credsSchema.safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0]!.message);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/admin", replace: true });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    const parsed = credsSchema.safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0]!.message);
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      ...parsed.data,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName.trim() },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (data.session) {
      navigate({ to: "/admin", replace: true });
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
    navigate({ to: "/admin", replace: true });
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-20">
      <h1 className="font-display text-4xl">
        Team <span className="text-hype">access</span>
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sign in to manage events, tickets, bookings and content.
      </p>

      <div className="card-elevated mt-8 rounded-3xl p-6">
        <Tabs defaultValue="signin">
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
          </TabsContent>
        </Tabs>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" />
        </div>
        <Button variant="outline" className="w-full border-border" onClick={google}>
          Continue with Google
        </Button>
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
        <Input
          id="password"
          type="password"
          required
          minLength={8}
          maxLength={72}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
    </>
  );
}
