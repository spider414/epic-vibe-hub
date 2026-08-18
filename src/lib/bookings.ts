export const EVENT_TYPES = [
  "Pool Party",
  "Beach Party",
  "Apartment Party",
  "Hangout",
  "Club / Night Event",
  "Themed Party",
  "Birthday",
  "Wedding / Traditional",
  "Corporate / Brand Event",
  "Concert / Show",
  "Music Video",
  "Other",
] as const;

export const BOOKING_SERVICES = [
  "Event planning",
  "Event hosting",
  "DJ",
  "Dancers",
  "Photography",
  "Videography",
  "Decoration",
  "Sound",
  "Lighting",
  "Security",
  "Promotion",
  "Ticketing",
  "Full event management",
  "Other",
] as const;

export const CONTACT_METHODS = [
  { value: "phone", label: "Phone call" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
] as const;

export const DURATIONS = [
  "Up to 3 hours",
  "3 – 6 hours",
  "6 – 12 hours",
  "Full day",
  "Multiple days",
  "Not sure yet",
] as const;

export const BUDGET_RANGES = [
  "Under ₦250,000",
  "₦250,000 – ₦750,000",
  "₦750,000 – ₦2,000,000",
  "₦2,000,000 – ₦5,000,000",
  "₦5,000,000+",
  "Not sure yet",
] as const;

export const BOOKING_STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "quoted", label: "Quoted" },
  { value: "deposit_paid", label: "Deposit Paid" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export function bookingStatusLabel(value: string) {
  return (
    BOOKING_STATUSES.find((s) => s.value === value)?.label ??
    value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export type BookingAttachment = { name: string; path: string; size: number; type: string };

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_UPLOAD_FILES = 6;
