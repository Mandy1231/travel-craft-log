/**
 * Pure date-formatting helpers. No domain knowledge, no side effects.
 */

export function formatDateRange(startISO?: string | null, endISO?: string | null) {
  if (!startISO) return null;
  const fmt = (s: string) => s.replaceAll("-", "/");
  return `${fmt(startISO)}${endISO ? ` — ${fmt(endISO)}` : ""}`;
}

export function daysBetweenInclusive(startISO: string, endISO: string) {
  return (
    Math.round(
      (new Date(endISO).getTime() - new Date(startISO).getTime()) / 86400000,
    ) + 1
  );
}
