import type { Trip } from "@/lib/trips-store";
import { daysBetweenInclusive, formatDateRange } from "@/lib/date";

/**
 * Pure trip-domain helpers. No side effects, no React, no toast.
 */

export function formatTripRange(trip: Trip) {
  return formatDateRange(trip.startDate, trip.endDate);
}

export function tripDayCount(trip: Trip) {
  if (trip.startDate && trip.endDate) {
    return Math.max(daysBetweenInclusive(trip.startDate, trip.endDate), trip.days.length);
  }
  return trip.days.length;
}

export function tripSpotCount(trip: Trip) {
  return trip.days.reduce((sum, d) => sum + d.attractions.length, 0);
}
