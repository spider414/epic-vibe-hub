export const DANCE_EVENT_TYPES = [
  "Party / Social Event",
  "Wedding / Traditional",
  "Birthday",
  "Club / Night Event",
  "Music Video",
  "Concert / Show",
  "Corporate / Brand Event",
  "Dance Class",
  "Private Training",
  "Other",
] as const;

export const DANCE_STYLES = [
  "Afrobeats",
  "Amapiano",
  "Hip-Hop",
  "Afro-fusion",
  "Contemporary",
  "Traditional / Cultural",
  "Bridal / Wedding routine",
  "Mixed / Surprise me",
] as const;

export const DANCE_DURATIONS = [
  "One performance set (5 – 10 mins)",
  "Two sets",
  "Up to 1 hour",
  "1 – 3 hours",
  "Full event",
  "Recurring / weekly",
] as const;

export const DANCE_BUDGETS = [
  "Under ₦150,000",
  "₦150,000 – ₦400,000",
  "₦400,000 – ₦1,000,000",
  "₦1,000,000+",
  "Not sure yet",
] as const;

export const DANCE_BOOKING_STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "quoted", label: "Quoted" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export function danceStatusLabel(value: string) {
  return (
    DANCE_BOOKING_STATUSES.find((s) => s.value === value)?.label ??
    value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export const DANCE_SERVICES = [
  {
    title: "Event Performances",
    text: "High-energy afrobeats and amapiano sets for pool, beach, apartment and hangout parties.",
  },
  {
    title: "Wedding Performances",
    text: "Bridal train routines, groom squad sets, first-dance choreography and traditional numbers.",
  },
  {
    title: "Music Video Dancers",
    text: "Camera-ready dancers, styling and routines built around your record and treatment.",
  },
  {
    title: "Club Performances",
    text: "Hype crews and stage sets that lift the room for club nights, raves and after-parties.",
  },
  {
    title: "Choreography",
    text: "Custom routines created and taught for artists, brands, couples and corporate teams.",
  },
  {
    title: "Dance Classes",
    text: "Weekly group classes across afrobeats, amapiano and hip-hop, beginner to advanced.",
  },
  {
    title: "Private Training",
    text: "One-on-one coaching to sharpen technique, stage presence and performance confidence.",
  },
  {
    title: "Custom Performances",
    text: "Surprise dances, brand activations, themed shows and anything else you can dream up.",
  },
] as const;
