import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

/** Dashboard areas a team member can be given. */
export const ASSIGNABLE_ROLES = [
  "admin",
  "events",
  "tickets",
  "bookings",
  "dance",
  "content",
  "audience",
] as const satisfies readonly AppRole[];

export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export const ROLE_LABELS: Record<AssignableRole, string> = {
  admin: "General admin",
  events: "Events manager",
  tickets: "Tickets manager",
  bookings: "Bookings manager",
  dance: "Dance team manager",
  content: "Content manager",
  audience: "Audience manager",
};

export const ROLE_DESCRIPTIONS: Record<AssignableRole, string> = {
  admin: "Full access to every section, plus team management",
  events: "Create, edit and publish events",
  tickets: "Ticket types, pricing, orders and check-ins",
  bookings: "Event hosting requests and quotes",
  dance: "Creative Dance Team bookings and dancers",
  content: "Gallery, testimonials, packages and homepage",
  audience: "Enquiries and mailing list",
};

/** Dashboard tabs, in order, and which role unlocks each. */
export const SECTIONS = [
  { key: "events", role: "events" },
  { key: "tickets", role: "tickets" },
  { key: "bookings", role: "bookings" },
  { key: "dance", role: "dance" },
  { key: "enquiries", role: "audience" },
  { key: "content", role: "content" },
  { key: "audience", role: "audience" },
  { key: "homepage", role: "content" },
  { key: "team", role: "admin" },
  { key: "access", role: "admin" },
] as const;

export type SectionKey = (typeof SECTIONS)[number]["key"];

export function canAccess(roles: AppRole[], section: SectionKey) {
  if (roles.includes("admin")) return true;
  const match = SECTIONS.find((s) => s.key === section);
  return match ? roles.includes(match.role) : false;
}
