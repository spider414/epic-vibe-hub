import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import {
  ASSIGNABLE_ROLES,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  type AppRole,
  type AssignableRole,
} from "@/lib/roles";

const NO_ROLE = "__none__";

export function MembersManager({ currentUserId }: { currentUserId: string | undefined }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const members = useQuery({
    queryKey: ["admin", "members"],
    queryFn: async () => {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, phone, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("user_roles").select("id, user_id, role"),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;
      return (profilesRes.data ?? []).map((p) => ({
        ...p,
        roles: (rolesRes.data ?? [])
          .filter((r) => r.user_id === p.id)
          .map((r) => r.role as AppRole),
      }));
    },
  });

  async function setRole(userId: string, role: string) {
    const { error: delError } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (delError) {
      toast.error(delError.message);
      return;
    }
    if (role !== NO_ROLE) {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: role as AppRole });
      if (error) {
        toast.error(error.message);
        return;
      }
    }
    toast.success(
      role === NO_ROLE
        ? "Access removed — this member can no longer open the dashboard"
        : `Role updated to ${ROLE_LABELS[role as AssignableRole]}`,
    );
    queryClient.invalidateQueries({ queryKey: ["admin", "members"] });
    queryClient.invalidateQueries({ queryKey: ["my-roles"] });
  }

  const term = search.trim().toLowerCase();
  const rows = (members.data ?? []).filter(
    (m) =>
      !term ||
      (m.full_name ?? "").toLowerCase().includes(term) ||
      (m.email ?? "").toLowerCase().includes(term),
  );

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        New team members register with a profile only. They see nothing in the dashboard until you
        give them a role here. A role opens just that section — you keep full visibility of
        everything.
      </p>

      <Input
        placeholder="Search by name or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Current access</TableHead>
            <TableHead className="w-64">Assign role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((m) => {
            const current = (m.roles[0] as AssignableRole | undefined) ?? undefined;
            const isSelf = m.id === currentUserId;
            return (
              <TableRow key={m.id}>
                <TableCell>
                  <span className="font-medium">{m.full_name || "Unnamed member"}</span>
                  <span className="block text-xs text-muted-foreground">{m.email}</span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(m.created_at).toLocaleDateString("en-NG")}
                </TableCell>
                <TableCell>
                  {current ? (
                    <Badge className="bg-primary/15 text-primary">{ROLE_LABELS[current]}</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      No role yet
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    value={current ?? NO_ROLE}
                    onValueChange={(v) => setRole(m.id, v)}
                    disabled={isSelf}
                  >
                    <SelectTrigger className="w-60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_ROLE}>No role (profile only)</SelectItem>
                      {ASSIGNABLE_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABELS[r]}
                          <span className="block text-xs text-muted-foreground">
                            {ROLE_DESCRIPTIONS[r]}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isSelf ? (
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      You can't change your own role
                    </span>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground">
                No team members found.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
