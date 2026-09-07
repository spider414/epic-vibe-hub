import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import {
  CONTACT_INFO_KEY,
  DEFAULT_CONTACT,
  contactInfoQuery,
  type ContactInfo,
} from "@/lib/site-settings";

const FIELDS: { key: keyof ContactInfo; label: string; placeholder: string }[] = [
  { key: "phone", label: "Phone number", placeholder: "+234 800 000 0000" },
  { key: "whatsapp", label: "WhatsApp number (digits only)", placeholder: "2348000000000" },
  { key: "email", label: "Email address", placeholder: "bookings@example.com" },
  { key: "city", label: "Location", placeholder: "Lagos, Nigeria" },
  { key: "instagram", label: "Instagram link", placeholder: "https://instagram.com/…" },
  { key: "tiktok", label: "TikTok link", placeholder: "https://tiktok.com/@…" },
  { key: "x", label: "X (Twitter) link", placeholder: "https://x.com/…" },
  { key: "youtube", label: "YouTube link", placeholder: "https://youtube.com/@…" },
];

export function ContactInfoManager() {
  const queryClient = useQueryClient();
  const { data } = useQuery(contactInfoQuery);
  const [form, setForm] = useState<ContactInfo>(DEFAULT_CONTACT);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  async function save() {
    const value: ContactInfo = { ...form };
    for (const f of FIELDS) value[f.key] = String(value[f.key] ?? "").trim().slice(0, 300);
    if (value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: CONTACT_INFO_KEY, value, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) {
      toast.error("Could not save. Please try again.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: contactInfoQuery.queryKey });
    toast.success("Contact details updated across the site.");
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-2">
            <Label htmlFor={`contact-${f.key}`}>{f.label}</Label>
            <Input
              id={`contact-${f.key}`}
              maxLength={300}
              placeholder={f.placeholder}
              value={form[f.key] ?? ""}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <Button
          disabled={busy}
          onClick={() => void save()}
          className="bg-hype text-primary-foreground hover:opacity-90"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save contact details"}
        </Button>
        <Button variant="outline" className="border-border" onClick={() => setForm(DEFAULT_CONTACT)}>
          Reset fields
        </Button>
      </div>
    </div>
  );
}
