import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PlayCircle } from "lucide-react";
import { useState } from "react";

import apartmentImg from "@/assets/apartment-party.jpg";
import beachImg from "@/assets/beach-party.jpg";
import clubImg from "@/assets/club-night.jpg";
import danceImg from "@/assets/dance-team.jpg";
import heroImg from "@/assets/hero-party.jpg";
import poolImg from "@/assets/pool-party.jpg";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Photos & Videos from Epic Entertainment Events" },
      {
        name: "description",
        content:
          "Flyers, photos and videos from past Epic Entertainment pool parties, beach takeovers, club nights and Creative Dance Team performances.",
      },
      { property: "og:title", content: "Epic Entertainment Gallery" },
      {
        property: "og:description",
        content: "See the energy — photos and videos from our past events.",
      },
    ],
  }),
  component: GalleryPage,
});

const HIGHLIGHTS = [
  { src: heroImg, title: "Splash Season pool rave", tag: "Pool Party" },
  { src: beachImg, title: "Beach takeover, Elegushi", tag: "Beach Party" },
  { src: clubImg, title: "VIP tables, All White Night", tag: "Club Night" },
  { src: danceImg, title: "Creative Dance Team live set", tag: "Dance" },
  { src: apartmentImg, title: "Penthouse hangout", tag: "Hangout" },
  { src: poolImg, title: "Rooftop day party", tag: "Pool Party" },
];

function GalleryPage() {
  const [tab, setTab] = useState<"photos" | "videos">("photos");

  const { data: media } = useQuery({
    queryKey: ["media"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media")
        .select("*")
        .eq("is_visible", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const photos = (media ?? []).filter((m) => m.media_type === "image");
  const videos = (media ?? []).filter((m) => m.media_type === "video");

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <p className="text-xs tracking-[0.3em] text-accent">THE ARCHIVE</p>
      <h1 className="mt-2 font-display text-5xl sm:text-6xl">
        Photos & <span className="text-hype">videos</span>
      </h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        A look at the nights we've delivered. Fresh galleries drop after every event.
      </p>

      <div className="mt-8 flex gap-2">
        {(["photos", "videos"] as const).map((t) => (
          <Button
            key={t}
            size="sm"
            variant={tab === t ? "default" : "outline"}
            className={tab === t ? "bg-hype text-primary-foreground" : "border-border"}
            onClick={() => setTab(t)}
          >
            {t === "photos" ? "Photos" : "Videos"}
          </Button>
        ))}
      </div>

      {tab === "photos" ? (
        <div className="mt-8 columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
          {HIGHLIGHTS.map((h) => (
            <figure key={h.title} className="group relative overflow-hidden rounded-2xl">
              <img
                src={h.src}
                alt={h.title}
                loading="lazy"
                className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <figcaption className="absolute inset-x-0 bottom-0 night-fade p-4">
                <span className="text-[10px] tracking-[0.25em] text-primary">
                  {h.tag.toUpperCase()}
                </span>
                <p className="font-display text-lg">{h.title}</p>
              </figcaption>
            </figure>
          ))}
          {photos.map((m) => (
            <figure key={m.id} className="group relative overflow-hidden rounded-2xl">
              <img src={m.url} alt={m.title} loading="lazy" className="w-full object-cover" />
              <figcaption className="absolute inset-x-0 bottom-0 night-fade p-4">
                <p className="font-display text-lg">{m.title}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {videos.length === 0 && (
            <p className="text-muted-foreground">
              Event videos are being uploaded — check back shortly or follow us on Instagram.
            </p>
          )}
          {videos.map((m) => (
            <a
              key={m.id}
              href={m.url}
              target="_blank"
              rel="noreferrer noopener"
              className="card-elevated group relative overflow-hidden rounded-2xl"
            >
              <img
                src={m.thumbnail_url || heroImg}
                alt={m.title}
                loading="lazy"
                className="aspect-video w-full object-cover opacity-80"
              />
              <PlayCircle className="absolute inset-0 m-auto h-14 w-14 text-primary transition-transform group-hover:scale-110" />
              <p className="p-4 font-display text-lg">{m.title}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
