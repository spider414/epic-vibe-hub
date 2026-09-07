import { useQuery } from "@tanstack/react-query";

import { HERO_MEDIA_KEY, mediaQuery } from "@/lib/site-settings";

type Props = {
  fallbackSrc: string;
  alt: string;
  className?: string;
  settingsKey?: string;
};

/** Hero background — admin-managed image or video, with a bundled fallback. */
export function HeroBackground({ fallbackSrc, alt, className, settingsKey }: Props) {
  const { data } = useQuery(mediaQuery(settingsKey ?? HERO_MEDIA_KEY));
  const cls = className ?? "absolute inset-0 h-full w-full object-cover opacity-60";

  if (data?.type === "video") {
    return (
      <video
        key={data.url}
        src={data.url}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={alt}
        className={cls}
      />
    );
  }

  return (
    <img
      src={data?.url || fallbackSrc}
      alt={alt}
      width={1920}
      height={1088}
      className={cls}
    />
  );
}
