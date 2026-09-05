import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarDays, Inbox, LogOut, Mail, Ticket, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { BookingsManager } from "@/components/admin/BookingsManager";
import { HeroMediaManager } from "@/components/admin/HeroMediaManager";
import { DanceBookingsManager } from "@/components/admin/DanceBookingsManager";
import { InviteCodesManager } from "@/components/admin/InviteCodesManager";
import { MembersManager } from "@/components/admin/MembersManager";
import { TicketTypesManager } from "@/components/admin/TicketTypesManager";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { canAccess, SECTIONS, type AppRole, type SectionKey } from "@/lib/roles";
import { formatEventDate, formatNaira } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Epic Entertainment" },
      {
        name: "description",
        content:
          "Manage Epic Entertainment events, ticket sales, bookings, enquiries, media and the Creative Dance Team roster.",
      },
      { property: "og:title", content: "Admin Dashboard — Epic Entertainment" },
      { property: "og:description", content: "Internal Epic Entertainment management dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: me, isLoading: roleLoading } = useQuery({
    queryKey: ["my-roles"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      const { data } = await supabase.from("user_roles").select("role");
      return { userId, roles: (data ?? []).map((r) => r.role as AppRole) };
    },
  });

  const roles = me?.roles ?? [];
  const isAdmin = roles.includes("admin");
  const hasAnyRole = roles.length > 0;
  const can = (section: SectionKey) => canAccess(roles, section);


  const events = useQuery({
    queryKey: ["admin", "events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("starts_at");
      if (error) throw error;
      return data;
    },
    enabled: hasAnyRole,
  });

  const orders = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_orders")
        .select("*, events(title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: can("tickets"),
  });

  const bookings = useQuery({
    queryKey: ["admin", "bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: can("bookings"),
  });

  const enquiries = useQuery({
    queryKey: ["admin", "enquiries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enquiries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: can("enquiries"),
  });

  const subscribers = useQuery({
    queryKey: ["admin", "subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscribers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: can("audience"),
  });

  const testimonials = useQuery({
    queryKey: ["admin", "testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: can("content"),
  });

  const media = useQuery({
    queryKey: ["admin", "media"],
    queryFn: async () => {
      const { data, error } = await supabase.from("media").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: can("content"),
  });

  const invalidate = (key: string) =>
    queryClient.invalidateQueries({ queryKey: ["admin", key] });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (roleLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-24 text-muted-foreground">Loading…</div>;
  }

  if (!hasAnyRole) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl">Waiting for access</h1>
        <p className="mt-3 text-muted-foreground">
          Your account is created, but an admin hasn't given you a role yet. Once they assign you a
          section — tickets, bookings, events and so on — it will show up here.
        </p>
        <Button onClick={signOut} variant="outline" className="mt-6 border-border">
          Sign out
        </Button>
      </div>
    );
  }

  const paidRevenue = (orders.data ?? [])
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + Number(o.amount_total), 0);
  const ticketsSold = (orders.data ?? [])
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + o.quantity, 0);

  const visibleSections = SECTIONS.filter((s) => can(s.key));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.3em] text-accent">CONTROL ROOM</p>
          <h1 className="mt-1 font-display text-4xl">
            {isAdmin ? "Admin dashboard" : "Team dashboard"}
          </h1>
        </div>
        <Button variant="outline" className="border-border" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {can("tickets") ? (
          <>
            <Stat icon={TrendingUp} label="Confirmed revenue" value={formatNaira(paidRevenue)} />
            <Stat icon={Ticket} label="Tickets sold" value={String(ticketsSold)} />
          </>
        ) : null}
        {can("bookings") ? (
          <Stat
            icon={Inbox}
            label="Booking requests"
            value={String(bookings.data?.length ?? 0)}
          />
        ) : null}
        {can("audience") ? (
          <Stat icon={Mail} label="Mailing list" value={String(subscribers.data?.length ?? 0)} />
        ) : null}
      </div>


      <Tabs defaultValue="events" className="mt-10">
        <TabsList className="flex h-auto flex-wrap justify-start">
          {["events", "tickets", "bookings", "enquiries", "content", "audience", "homepage", "access"].map((t) => (
            <TabsTrigger key={t} value={t} className="capitalize">
              {t}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* EVENTS */}
        <TabsContent value="events" className="space-y-8 pt-6">
          <NewEventForm onCreated={() => invalidate("events")} />
          <Panel title="All events">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Regular</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(events.data ?? []).map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatEventDate(e.starts_at)}
                    </TableCell>
                    <TableCell>{formatNaira(Number(e.price_regular))}</TableCell>
                    <TableCell>
                      <Switch
                        checked={e.is_published}
                        onCheckedChange={async (v) => {
                          await supabase
                            .from("events")
                            .update({ is_published: v })
                            .eq("id", e.id);
                          invalidate("events");
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={async () => {
                          await supabase.from("events").delete().eq("id", e.id);
                          invalidate("events");
                          toast.success("Event deleted");
                        }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
        </TabsContent>

        {/* TICKETS */}
        <TabsContent value="tickets" className="space-y-8 pt-6">
          <Panel title="Ticket types & pricing">
            <TicketTypesManager
              events={(events.data ?? []).map((e) => ({
                id: e.id,
                title: e.title,
                starts_at: e.starts_at,
              }))}
            />
          </Panel>
          <Panel title="Ticket orders">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(orders.data ?? []).map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.reference}</TableCell>
                    <TableCell>
                      {o.customer_name}
                      <span className="block text-xs text-muted-foreground">{o.phone}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {(o.events as { title: string } | null)?.title ?? "—"}
                    </TableCell>
                    <TableCell>
                      {o.quantity} × {o.ticket_type}
                    </TableCell>
                    <TableCell>{formatNaira(Number(o.amount_total))}</TableCell>
                    <TableCell>
                      <StatusSelect
                        value={o.payment_status}
                        options={["pending", "paid", "cancelled", "refunded", "checked_in"]}
                        onChange={async (v) => {
                          await supabase
                            .from("ticket_orders")
                            .update({ payment_status: v })
                            .eq("id", o.id);
                          invalidate("orders");
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
        </TabsContent>

        {/* BOOKINGS */}
        <TabsContent value="bookings" className="pt-6">
          <Panel title="Booking requests">
            <BookingsManager />
          </Panel>
        </TabsContent>


        {/* ENQUIRIES */}
        <TabsContent value="enquiries" className="pt-6">
          <Panel title="Enquiries">
            <div className="space-y-4">
              {(enquiries.data ?? []).map((e) => (
                <div key={e.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">
                      {e.full_name}{" "}
                      <span className="text-xs font-normal text-muted-foreground">{e.email}</span>
                    </p>
                    <StatusSelect
                      value={e.status}
                      options={["new", "in_progress", "resolved"]}
                      onChange={async (v) => {
                        await supabase.from("enquiries").update({ status: v }).eq("id", e.id);
                        invalidate("enquiries");
                      }}
                    />
                  </div>
                  {e.subject && <p className="mt-1 text-sm text-accent">{e.subject}</p>}
                  <p className="mt-2 text-sm text-muted-foreground">{e.message}</p>
                </div>
              ))}
              {enquiries.data?.length === 0 && (
                <p className="text-muted-foreground">No enquiries yet.</p>
              )}
            </div>
          </Panel>
        </TabsContent>

        {/* CONTENT */}
        <TabsContent value="content" className="space-y-8 pt-6">
          <NewMediaForm onCreated={() => invalidate("media")} />
          <Panel title="Gallery items">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(media.data ?? []).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{m.title}</p>
                    <p className="text-xs capitalize text-muted-foreground">{m.media_type}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={async () => {
                      await supabase.from("media").delete().eq("id", m.id);
                      invalidate("media");
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              {media.data?.length === 0 && (
                <p className="text-muted-foreground">No gallery items added yet.</p>
              )}
            </div>
          </Panel>

          <Panel title="Testimonials">
            <div className="space-y-3">
              {(testimonials.data ?? []).map((t) => (
                <div
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
                >
                  <div>
                    <p className="font-semibold">
                      {t.author_name}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        {t.author_role}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">{t.message}</p>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    Approved
                    <Switch
                      checked={t.is_approved}
                      onCheckedChange={async (v) => {
                        await supabase
                          .from("testimonials")
                          .update({ is_approved: v })
                          .eq("id", t.id);
                        invalidate("testimonials");
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>
          </Panel>
        </TabsContent>

        {/* AUDIENCE */}
        <TabsContent value="audience" className="pt-6">
          <Panel title="Mailing list">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(subscribers.data ?? []).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.email}</TableCell>
                    <TableCell className="text-muted-foreground">{s.phone ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString("en-NG")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
        </TabsContent>

        {/* HOMEPAGE */}
        <TabsContent value="homepage" className="pt-6">
          <Panel title="Hero background">
            <HeroMediaManager />
          </Panel>
        </TabsContent>

        {/* ACCESS */}
        <TabsContent value="access" className="pt-6">
          <Panel title="Registration invite codes">
            <InviteCodesManager />
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="card-elevated rounded-2xl p-5">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 font-display text-2xl">{value}</p>
      <p className="text-xs tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-elevated overflow-x-auto rounded-2xl p-6">
      <h2 className="mb-4 font-display text-2xl">{title}</h2>
      {children}
    </section>
  );
}

function StatusSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-40 capitalize">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o} className="capitalize">
            {o.replace(/_/g, " ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function NewEventForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    title: "",
    category: "Pool Party",
    starts_at: "",
    venue: "",
    city: "Lagos",
    flyer_url: "",
    price_regular: "",
    price_vip: "",
    capacity: "",
    description: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const slug = form.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60);
      const { error } = await supabase.from("events").insert({
        slug: `${slug}-${Math.random().toString(36).slice(2, 6)}`,
        title: form.title.trim(),
        category: form.category,
        starts_at: new Date(form.starts_at).toISOString(),
        venue: form.venue.trim(),
        city: form.city.trim(),
        flyer_url: form.flyer_url.trim() || null,
        price_regular: Number(form.price_regular || 0),
        price_vip: form.price_vip ? Number(form.price_vip) : null,
        capacity: form.capacity ? Number(form.capacity) : null,
        description: form.description.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Event created");
      setForm({ ...form, title: "", starts_at: "", venue: "", description: "" });
      onCreated();
    },
    onError: () => toast.error("Could not create the event"),
  });

  return (
    <Panel title="Create a new event">
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.title.trim() || !form.starts_at) {
            toast.error("Title and date are required");
            return;
          }
          mutation.mutate();
        }}
      >
        <AdminField
          label="Title"
          value={form.title}
          onChange={(v) => setForm({ ...form, title: v })}
        />
        <AdminField
          label="Category"
          value={form.category}
          onChange={(v) => setForm({ ...form, category: v })}
        />
        <AdminField
          label="Date & time"
          type="datetime-local"
          value={form.starts_at}
          onChange={(v) => setForm({ ...form, starts_at: v })}
        />
        <AdminField
          label="Venue"
          value={form.venue}
          onChange={(v) => setForm({ ...form, venue: v })}
        />
        <AdminField label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
        <AdminField
          label="Flyer image URL"
          value={form.flyer_url}
          onChange={(v) => setForm({ ...form, flyer_url: v })}
        />
        <AdminField
          label="Regular price (₦)"
          type="number"
          value={form.price_regular}
          onChange={(v) => setForm({ ...form, price_regular: v })}
        />
        <AdminField
          label="VIP price (₦)"
          type="number"
          value={form.price_vip}
          onChange={(v) => setForm({ ...form, price_vip: v })}
        />
        <AdminField
          label="Capacity"
          type="number"
          value={form.capacity}
          onChange={(v) => setForm({ ...form, capacity: v })}
        />
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="desc">Description</Label>
          <Textarea
            id="desc"
            rows={4}
            maxLength={4000}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <Button
          disabled={mutation.isPending}
          className="bg-hype text-primary-foreground sm:col-span-2"
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          {mutation.isPending ? "Creating…" : "Create event"}
        </Button>
      </form>
    </Panel>
  );
}

function NewMediaForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({ title: "", url: "", media_type: "image", thumbnail_url: "" });

  return (
    <Panel title="Add photo or video">
      <form
        className="grid gap-4 sm:grid-cols-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!form.title.trim() || !form.url.trim()) {
            toast.error("Title and URL are required");
            return;
          }
          const { error } = await supabase.from("media").insert({
            title: form.title.trim(),
            url: form.url.trim(),
            media_type: form.media_type,
            thumbnail_url: form.thumbnail_url.trim() || null,
          });
          if (error) {
            toast.error("Could not add media");
            return;
          }
          setForm({ title: "", url: "", media_type: "image", thumbnail_url: "" });
          onCreated();
          toast.success("Media added");
        }}
      >
        <AdminField
          label="Title"
          value={form.title}
          onChange={(v) => setForm({ ...form, title: v })}
        />
        <AdminField label="URL" value={form.url} onChange={(v) => setForm({ ...form, url: v })} />
        <AdminField
          label="Thumbnail URL (video)"
          value={form.thumbnail_url}
          onChange={(v) => setForm({ ...form, thumbnail_url: v })}
        />
        <div className="space-y-2">
          <Label>Type</Label>
          <Select
            value={form.media_type}
            onValueChange={(v) => setForm({ ...form, media_type: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="video">Video</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="bg-hype text-primary-foreground sm:col-span-4">Add to gallery</Button>
      </form>
    </Panel>
  );
}

function AdminField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} maxLength={300} />
    </div>
  );
}
