import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { homeForCurrentUser } from "@/lib/account";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Epic Entertainment" },
      { name: "description", content: "Choose a new password for your Epic Entertainment account." },
      { property: "og:title", content: "Reset password — Epic Entertainment" },
      { property: "og:description", content: "Set a new password for your account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery");
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (isRecovery && session)) setReady(true);
      setChecked(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (isRecovery && data.session) setReady(true);
      setTimeout(() => setChecked(true), 1500);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8 || password.length > 72) {
      toast.error("Password must be 8–72 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated — you're signed in.");
    navigate({ to: await homeForCurrentUser(), replace: true });
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-20">
      <h1 className="font-display text-4xl">
        New <span className="text-hype">password</span>
      </h1>
      <div className="card-elevated mt-8 rounded-3xl p-6">
        {ready ? (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pw">New password</Label>
              <div className="relative">
                <Input id="pw" type={show ? "text" : "password"} required minLength={8} maxLength={72}
                  className="pr-11" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShow((v) => !v)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw2">Confirm password</Label>
              <Input id="pw2" type={show ? "text" : "password"} required minLength={8} maxLength={72}
                value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <Button disabled={busy} className="w-full bg-hype text-primary-foreground hover:opacity-90">
              {busy ? "Saving…" : "Save new password"}
            </Button>
          </form>
        ) : checked ? (
          <p className="text-sm text-muted-foreground">
            This reset link is invalid or has expired.{" "}
            <Link to="/auth" className="text-primary underline">Request a new one</Link>.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Checking your reset link…</p>
        )}
      </div>
    </div>
  );
}
