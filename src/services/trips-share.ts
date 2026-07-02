import { toast } from "sonner";
import type { Trip } from "@/lib/trips-store";

export function buildTripShareUrl(trip: Trip) {
  return `${window.location.origin}/s/${trip.id}`;
}

export function copyTripShareLink(
  trip: Trip,
  messages: { success: string; error: string },
) {
  return navigator.clipboard.writeText(buildTripShareUrl(trip)).then(
    () => toast.success(messages.success),
    () => toast.error(messages.error),
  );
}

export function formatTripRange(t: Trip) {
  if (!t.startDate) return null;
  const fmt = (s: string) => s.replaceAll("-", "/");
  return `${fmt(t.startDate)}${t.endDate ? ` — ${fmt(t.endDate)}` : ""}`;
}

export function tripDayCount(t: Trip) {
  if (t.startDate && t.endDate) {
    const d =
      Math.round(
        (new Date(t.endDate).getTime() - new Date(t.startDate).getTime()) / 86400000,
      ) + 1;
    return Math.max(d, t.days.length);
  }
  return t.days.length;
}
