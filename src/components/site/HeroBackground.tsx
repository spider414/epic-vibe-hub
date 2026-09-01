import { useQuery } from "@tanstack/react-query";

import { heroMediaQuery } from "@/lib/site-settings";

type Props = {
  fallbackSrc: string;
  alt: string;
  className?: string;
};

/** Homepage hero background — admin-managed image or video, with a bundled fallback. */
export function HeroBackground({ fallbackSrc, alt, className }: Props) {
  const { data } = useQuery(heroMediaQuery);
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
