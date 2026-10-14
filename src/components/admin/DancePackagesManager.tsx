import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatNaira } from "@/lib/site";

type Package = Database["public"]["Tables"]["packages"]["Row"];

export function DancePackagesManager() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Package | null>(null);
  const { data: packages, isPending, error } = useQuery({
    queryKey: ["admin", "dance-packages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("packages").select("*").eq("category", "dance").order("sort_order");
      if (error) throw error;
      return data;
    },
  });
  const save = useMutation({
    mutationFn: async (form: FormData) => {
      if (!editing) throw new Error("Select a package to edit.");
      const priceText = String(form.get("price") ?? "").trim();
      const price = priceText === "" ? null : Number(priceText);
      const name = String(form.get("name") ?? "").trim();
      if (!name || (price !== null && (!Number.isFinite(price) || price < 0))) {
        throw new Error("Enter a package name and a valid price.");
      }
      const { data, error } = await supabase.from("packages").update({
        name,
        tagline: String(form.get("tagline") ?? "").trim() || null,
        price_from: price,
        price_note: String(form.get("price_note") ?? "").trim() || null,
        features: String(form.get("features") ?? "").split("\n").map((line) => line.trim()).filter(Boolean),
        sort_order: Number(form.get("sort_order")),
        is_active: editing.is_active,
      }).eq("id", editing.id).eq("category", "dance").select("id").single();
      if (error) throw error;
      if (!data) throw new Error("The package could not be saved.");
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin", "dance-packages"] }),
        qc.invalidateQueries({ queryKey: ["packages"] }),
      ]);
      setEditing(null);
      toast.success("Dance package updated");
    },
    onError: (error) => toast.error(error.message),
  });

  if (isPending) return <p className="text-muted-foreground">Loading packages…</p>;
  if (error) return <p role="alert" className="text-destructive">Couldn't load dance packages. Please refresh.</p>;

  return (
    <div className="min-w-0 space-y-6">
      {editing && (
        <form key={editing.id} className="grid min-w-0 gap-4" onSubmit={(e) => {
          e.preventDefault();
          save.mutate(new FormData(e.currentTarget));
        }}>
          <h3 className="break-words font-display text-xl leading-tight">Editing: {editing.name}</h3>
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-2"><Label htmlFor="dance-package-name">Package name</Label><Input id="dance-package-name" name="name" required maxLength={150} defaultValue={editing.name} disabled={save.isPending} /></div>
            <div className="min-w-0 space-y-2"><Label htmlFor="dance-package-tagline">Tagline</Label><Input id="dance-package-tagline" name="tagline" maxLength={300} defaultValue={editing.tagline ?? ""} disabled={save.isPending} /></div>
            <div className="min-w-0 space-y-2"><Label htmlFor="dance-package-price">Starting price (₦)</Label><Input id="dance-package-price" name="price" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={editing.price_from ?? ""} disabled={save.isPending} /></div>
            <div className="min-w-0 space-y-2"><Label htmlFor="dance-package-note">Price note</Label><Input id="dance-package-note" name="price_note" maxLength={300} defaultValue={editing.price_note ?? ""} disabled={save.isPending} /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="dance-package-features">What's included (one item per line)</Label><Textarea id="dance-package-features" name="features" rows={6} className="text-base md:text-base" defaultValue={editing.features.join("\n")} disabled={save.isPending} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="dance-package-order">Display order</Label><Input id="dance-package-order" name="sort_order" type="number" step="1" required defaultValue={editing.sort_order} disabled={save.isPending} /></div>
            <div className="flex items-center gap-3"><Switch id="dance-package-active" checked={editing.is_active} disabled={save.isPending} onCheckedChange={(is_active) => setEditing({ ...editing, is_active })} /><Label htmlFor="dance-package-active">Visible on dance page</Label></div>
          </div>
          <div className="grid gap-3 sm:flex">
            <Button type="submit" className="min-h-11" disabled={save.isPending}><Save className="mr-2 h-4 w-4" />{save.isPending ? "Saving…" : "Save changes"}</Button>
            <Button type="button" variant="outline" className="min-h-11" disabled={save.isPending} onClick={() => setEditing(null)}><X className="mr-2 h-4 w-4" />Cancel editing</Button>
          </div>
        </form>
      )}
      <div className="divide-y divide-border">
        {packages?.map((pack) => (
          <div key={pack.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-4">
            <div className="min-w-0 break-words">
              <p className="font-display text-xl leading-tight">{pack.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{formatNaira(pack.price_from)} · {pack.is_active ? "Visible" : "Hidden"}</p>
            </div>
            <Button variant="outline" className="min-h-11 shrink-0" disabled={save.isPending} aria-label={`Edit ${pack.name}`} onClick={() => setEditing(pack)}><Pencil className="mr-2 h-4 w-4" />Edit</Button>
          </div>
        ))}
        {packages?.length === 0 && <p className="text-muted-foreground">No dance packages yet.</p>}
      </div>
    </div>
  );
}