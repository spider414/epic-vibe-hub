export const SITE = {
  name: "Epic Entertainment",
  tagline: "Nigeria's party people",
  phone: "+234 800 000 0000",
  whatsapp: "2348000000000",
  email: "bookings@epicentertainment.ng",
  city: "Lagos, Nigeria",
  socials: {
    instagram: "https://instagram.com/epicentertainment",
    tiktok: "https://tiktok.com/@epicentertainment",
    x: "https://x.com/epicentertainment",
    youtube: "https://youtube.com/@epicentertainment",
  },
  bank: {
    name: "Epic Entertainment Ltd",
    bank: "Access Bank",
    account: "0123456789",
  },
};

export function formatNaira(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function formatEventDate(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  });
}
