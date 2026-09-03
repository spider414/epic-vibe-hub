import { useQuery } from "@tanstack/react-query";
import { Copy, KeyRound, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

type InviteCode = {
  id: string;
  code: string;
  created_at: string;
  expires_at: string;
  claimed_email: string | null;
  used_at: string | null;
};

function useCountdown(target: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (!target) return null;
  const left = Math.max(0, Math.floor((new Date(target).getTime() - now) / 1000));
  return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
}

export function InviteCodesManager() {
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState<{ code: string; expires_at: string } | null>(null);
  const countdown = useCountdown(fresh?.expires_at ?? null);

  const codes = useQuery({
    queryKey: ["admin", "invite-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invite_codes" as never)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(25);
      if (error) throw error;
      return (data ?? []) as unknown as InviteCode[];
    },
    refetchInterval: 15000,
  });

  async function generate() {
    setBusy(true);
    const { data, error } = await supabase.rpc("generate_invite_code" as never);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const row = (Array.isArray(data) ? data[0] : data) as
      | { code: string; expires_at: string }
      | undefined;
    if (!row) {
      toast.error("Could not generate a code. Try again.");
      return;
    }
    setFresh(row);
    codes.refetch();
    toast.success("Invite code generated — valid for 5 minutes.");
  }

  function copy(value: string) {
    navigator.clipboard?.writeText(value);
    toast.success("Code copied");
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        New team members cannot register without a 6-digit code. Each code works once and expires
        after 5 minutes.
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <Button
          onClick={generate}
          disabled={busy}
          className="bg-hype text-primary-foreground hover:opacity-90"
        >
          {busy ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <KeyRound className="mr-2 h-4 w-4" />
          )}
          Generate code
        </Button>

        {fresh && (
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
            <span className="font-display text-3xl tracking-[0.35em] text-primary">
              {fresh.code}
            </span>
            <span className="text-xs text-muted-foreground">
              expires in {countdown ?? "0:00"}
            </span>
            <Button size="icon" variant="ghost" onClick={() => copy(fresh.code)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Claimed by</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(codes.data ?? []).map((c) => {
            const expired = new Date(c.expires_at).getTime() < Date.now();
            return (
              <TableRow key={c.id}>
                <TableCell className="font-mono tracking-widest">{c.code}</TableCell>
                <TableCell>
                  {c.used_at ? (
                    <Badge variant="secondary">Used</Badge>
                  ) : expired ? (
                    <Badge variant="outline">Expired</Badge>
                  ) : (
                    <Badge>Active</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{c.claimed_email ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(c.created_at).toLocaleString("en-NG")}
                </TableCell>
              </TableRow>
            );
          })}
          {!codes.isLoading && (codes.data?.length ?? 0) === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground">
                No codes generated yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
