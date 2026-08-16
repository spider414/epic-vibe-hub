import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { TicketTypeRow } from "@/lib/events";
import { formatNaira } from "@/lib/site";

const PRESETS = ["Early Bird", "Regular", "VIP", "Group"];
const TYPE_STATUSES = ["on_sale", "paused", "sold_out", "hidden"] as const;

type EventOption = { id: string; title: string; starts_at: string };

const emptyDraft = {
  name: "Regular",
  price: "",
  quantity_total: "",
  sale_starts_at: "",
  sale_ends_at: "",
  status: "on_sale" as string,
  description: "",
};

export function TicketTypesManager({ events }: { events: EventOption[] }) {
  const queryClient = useQueryClient();
  const [eventId, setEventId] = useState<string>(events[0]?.id ?? "");
  const [draft, setDraft] = useState({ ...emptyDraft });

  const types = useQuery({
    enabled: Boolean(eventId),
    queryKey: ["admin", "ticket-types", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_types")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order")
        .order("price");
      if (error) throw error;
      return data as TicketTypeRow[];
    },
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "ticket-types", eventId] });

  const create = useMutation({
    mutationFn: async () => {
      if (!eventId) throw new Error("Pick an event first");
      if (!draft.name.trim()) throw new Error("Ticket name is required");
      const price = Number(draft.price);
      if (!Number.isFinite(price) || price < 0) throw new Error("Enter a valid price");
      const { error } = await supabase.from("ticket_types").insert({
        event_id: eventId,
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        price,
        quantity_total: draft.quantity_total ? Number(draft.quantity_total) : null,
        sale_starts_at: draft.sale_starts_at ? new Date(draft.sale_starts_at).toISOString() : null,
        sale_ends_at: draft.sale_ends_at ? new Date(draft.sale_ends_at).toISOString() : null,
        status: draft.status,
        sort_order: (types.data?.length ?? 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ticket type added");
      setDraft({ ...emptyDraft });
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function patch(id: string, values: Record<string, unknown>) {
    const { error } = await supabase.from("ticket_types").update(values).eq("id", id);
    if (error) toast.error(error.message);
    else refresh();
  }

  return (
    <div className="space-y-6">
      <div className="max-w-md">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Event</Label>
        <Select value={eventId} onValueChange={setEventId}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Select an event" />
          </SelectTrigger>
          <SelectContent>
            {events.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {eventId ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Sold</TableHead>
                <TableHead>Sales window</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(types.data ?? []).map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>
                    <Input
                      defaultValue={String(t.price)}
                      className="h-9 w-28"
                      type="number"
                      min={0}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (Number.isFinite(v) && v !== Number(t.price)) patch(t.id, { price: v });
                      }}
                    />
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {formatNaira(Number(t.price))}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Input
                      defaultValue={t.quantity_total ?? ""}
                      placeholder="∞"
                      className="h-9 w-24"
                      type="number"
                      min={0}
                      onBlur={(e) => {
                        const raw = e.target.value.trim();
                        const v = raw === "" ? null : Number(raw);
                        if (v !== t.quantity_total) patch(t.id, { quantity_total: v });
                      }}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.quantity_sold ?? 0}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Input
                        type="datetime-local"
                        className="h-9 w-48"
                        defaultValue={toLocalInput(t.sale_starts_at)}
                        onBlur={(e) =>
                          patch(t.id, {
                            sale_starts_at: e.target.value
                              ? new Date(e.target.value).toISOString()
                              : null,
                          })
                        }
                      />
                      <Input
                        type="datetime-local"
                        className="h-9 w-48"
                        defaultValue={toLocalInput(t.sale_ends_at)}
                        onBlur={(e) =>
                          patch(t.id, {
                            sale_ends_at: e.target.value
                              ? new Date(e.target.value).toISOString()
                              : null,
                          })
                        }
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select value={t.status} onValueChange={(v) => patch(t.id, { status: v })}>
                      <SelectTrigger className="h-9 w-36 capitalize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPE_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={async () => {
                        const { error } = await supabase
                          .from("ticket_types")
                          .delete()
                          .eq("id", t.id);
                        if (error) toast.error(error.message);
                        else {
                          toast.success("Ticket type removed");
                          refresh();
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {types.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    No ticket types yet for this event.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>

          <div className="rounded-2xl border border-border bg-card/60 p-5">
            <p className="font-display text-xl">Add ticket type</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label>Name</Label>
                <Input
                  className="mt-2"
                  value={draft.name}
                  list="ticket-type-presets"
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
                <datalist id="ticket-type-presets">
                  {PRESETS.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label>Price (₦)</Label>
                <Input
                  className="mt-2"
                  type="number"
                  min={0}
                  value={draft.price}
                  onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                />
              </div>
              <div>
                <Label>Quantity available</Label>
                <Input
                  className="mt-2"
                  type="number"
                  min={0}
                  placeholder="Leave blank for unlimited"
                  value={draft.quantity_total}
                  onChange={(e) => setDraft({ ...draft, quantity_total: e.target.value })}
                />
              </div>
              <div>
                <Label>Sale starts</Label>
                <Input
                  className="mt-2"
                  type="datetime-local"
                  value={draft.sale_starts_at}
                  onChange={(e) => setDraft({ ...draft, sale_starts_at: e.target.value })}
                />
              </div>
              <div>
                <Label>Sale ends</Label>
                <Input
                  className="mt-2"
                  type="datetime-local"
                  value={draft.sale_ends_at}
                  onChange={(e) => setDraft({ ...draft, sale_ends_at: e.target.value })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={draft.status}
                  onValueChange={(v) => setDraft({ ...draft, status: v })}
                >
                  <SelectTrigger className="mt-2 capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <Label>Description</Label>
                <Input
                  className="mt-2"
                  placeholder="What's included with this ticket?"
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </div>
            </div>
            <Button
              className="mt-5 bg-hype text-primary-foreground"
              disabled={create.isPending}
              onClick={() => create.mutate()}
            >
              <Plus className="mr-2 h-4 w-4" /> Add ticket type
            </Button>
          </div>
        </>
      ) : (
        <p className="text-muted-foreground">Create an event first, then add ticket types.</p>
      )}
    </div>
  );
}

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
