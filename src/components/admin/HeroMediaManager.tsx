import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image as ImageIcon, Loader2, Upload, Video } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { HERO_MEDIA_KEY, heroMediaQuery, type HeroMedia } from "@/lib/site-settings";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export function HeroMediaManager() {
  const queryClient = useQueryClient();
  const { data: current } = useQuery(heroMediaQuery);
  const [urlInput, setUrlInput] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function save(next: HeroMedia | { type: "image"; url: "" }) {
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: HERO_MEDIA_KEY, value: next, updated_at: new Date().toISOString() });
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey: heroMediaQuery.queryKey });
  }

  async function handleFile(file: File) {
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      toast.error("Please choose an image or video file.");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error("File is too large (max 100MB).");
      return;
    }
    setBusy(true);
    try {
      const path = `hero/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const { error: upErr } = await supabase.storage
        .from("site-media")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: signed, error: signErr } = await supabase.storage
        .from("site-media")
        .createSignedUrl(path, TEN_YEARS);
      if (signErr || !signed) throw signErr ?? new Error("Could not create media link");
      await save({ type: isVideo ? "video" : "image", url: signed.signedUrl });
      toast.success("Hero background updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleUrl() {
    const url = urlInput.trim();
    if (!url) return;
    setBusy(true);
    try {
      const isVideo = /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
      await save({ type: isVideo ? "video" : "image", url });
      setUrlInput("");
      toast.success("Hero background updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    setBusy(true);
    try {
      await save({ type: "image", url: "" });
      toast.success("Reverted to the default hero image.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reset");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <Label htmlFor="hero-file">Upload image or video</Label>
            <Input
              id="hero-file"
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
              className="mt-2"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Max 100MB. Videos autoplay muted and loop. Landscape 1920×1080 works best.
            </p>
          </div>

          <div>
            <Label htmlFor="hero-url">Or paste a media link</Label>
            <div className="mt-2 flex gap-2">
              <Input
                id="hero-url"
                placeholder="https://…/hero.mp4"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
              <Button
                onClick={() => void handleUrl()}
                disabled={busy || !urlInput.trim()}
                className="bg-hype text-primary-foreground hover:opacity-90"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button variant="outline" className="border-border" disabled={busy} onClick={() => void reset()}>
            Use default image
          </Button>
        </div>

        <div className="rounded-2xl border border-border p-4">
          <p className="flex items-center gap-2 text-xs tracking-widest text-muted-foreground">
            {current?.type === "video" ? (
              <Video className="h-4 w-4" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
            CURRENT HERO BACKGROUND
          </p>
          <div className="mt-3 overflow-hidden rounded-xl bg-surface">
            {current?.url ? (
              current.type === "video" ? (
                <video src={current.url} muted loop autoPlay playsInline className="h-56 w-full object-cover" />
              ) : (
                <img src={current.url} alt="Current hero background" className="h-56 w-full object-cover" />
              )
            ) : (
              <div className="grid h-56 place-items-center text-sm text-muted-foreground">
                Using the default bundled hero image
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
