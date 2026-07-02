import { useMemo, useState } from "react";
import type { Trip } from "@/lib/trips-store";

export function useTripSearch(trips: Trip[]) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return trips;
    return trips.filter((t) => {
      const hay = [
        t.title,
        t.description ?? "",
        ...t.days.flatMap((d) => d.attractions.map((a) => a.name)),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [trips, q]);

  return { q, setQ, filtered };
}
