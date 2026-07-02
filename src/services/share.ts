import { toast } from "sonner";
import type { Trip } from "@/lib/trips-store";

/**
 * Share-related side effects (clipboard, URL building).
 */

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
