import { useEffect, useState, useCallback } from "react";

export interface Attraction {
  id: string;
  name: string;
  description?: string;
  openingHours?: string;
  lat?: number;
  lng?: number;
}

export interface Day {
  id: string;
  title?: string;
  attractions: Attraction[];
}

export type Visibility = "private" | "public" | "draft";

export interface Trip {
  id: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  visibility: Visibility;
  isDraft?: boolean; // legacy
  isPublic?: boolean; // legacy
  coverEmoji?: string;
  days: Day[];
  createdAt: number;
}

const KEY = "lovable.trips.v2";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function migrate(t: any): Trip {
  let visibility: Visibility = t.visibility;
  if (!visibility) {
    if (t.isDraft) visibility = "draft";
    else if (t.isPublic) visibility = "public";
    else visibility = "private";
  }
  return {
    ...t,
    visibility,
    days: (t.days ?? []).map((d: any) => ({
      id: d.id ?? uid(),
      title: d.title,
      attractions: d.attractions ?? [],
    })),
  };
}

function read(): Trip[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      // try migrating from v1
      const old = localStorage.getItem("lovable.trips.v1");
      if (old) {
        const migrated = (JSON.parse(old) as any[]).map(migrate);
        localStorage.setItem(KEY, JSON.stringify(migrated));
        return migrated;
      }
      return seed();
    }
    return (JSON.parse(raw) as any[]).map(migrate);
  } catch {
    return [];
  }
}

function write(trips: Trip[]) {
  localStorage.setItem(KEY, JSON.stringify(trips));
  window.dispatchEvent(new CustomEvent("trips:changed"));
}

function seed(): Trip[] {
  const initial: Trip[] = [
    {
      id: uid(),
      title: "济州岛五天游",
      startDate: "2024-01-15",
      endDate: "2024-01-19",
      visibility: "private",
      coverEmoji: "🏝️",
      createdAt: Date.now() - 3,
      days: [
        {
          id: uid(),
          title: "汉拿山日出",
          attractions: [
            { id: uid(), name: "汉拿山", openingHours: "9:00 开放", description: "济州岛地标火山", lat: 33.3617, lng: 126.5337 },
            { id: uid(), name: "正房瀑布", openingHours: "全天开放", description: "直入大海的瀑布", lat: 33.2447, lng: 126.5719 },
          ],
        },
        {
          id: uid(),
          title: "海岸线漫步",
          attractions: [
            { id: uid(), name: "城山日出峰", openingHours: "日出前开放", description: "日出绝佳观赏点", lat: 33.4581, lng: 126.9425 },
          ],
        },
        { id: uid(), title: "自由日", attractions: [] },
      ],
    },
    {
      id: uid(),
      title: "东京樱花之旅",
      startDate: "2024-03-20",
      endDate: "2024-03-25",
      visibility: "public",
      coverEmoji: "🌸",
      createdAt: Date.now() - 2,
      days: [{ id: uid(), attractions: [
        { id: uid(), name: "上野公园", openingHours: "全天开放", description: "赏樱圣地", lat: 35.7156, lng: 139.7745 },
      ] }],
    },
    {
      id: uid(),
      title: "巴黎浪漫行",
      visibility: "draft",
      coverEmoji: "🗼",
      createdAt: Date.now() - 1,
      days: [{ id: uid(), attractions: [] }],
    },
  ];
  localStorage.setItem(KEY, JSON.stringify(initial));
  return initial;
}

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  useEffect(() => {
    setTrips(read());
    const handler = () => setTrips(read());
    window.addEventListener("trips:changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("trips:changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return trips;
}

export function useTrip(id: string | undefined) {
  const trips = useTrips();
  return trips.find((t) => t.id === id);
}

function deriveVisibility(startDate?: string, current?: Visibility): Visibility {
  if (current === "public") return "public";
  if (!startDate) return "draft";
  return current ?? "private";
}

export const tripsApi = {
  create(partial: Partial<Trip>): Trip {
    const trips = read();
    const trip: Trip = {
      id: uid(),
      title: partial.title || "未命名行程",
      description: partial.description,
      startDate: partial.startDate,
      endDate: partial.endDate,
      visibility: deriveVisibility(partial.startDate, partial.visibility),
      coverEmoji: partial.coverEmoji || "✈️",
      days: [{ id: uid(), attractions: [] }],
      createdAt: Date.now(),
    };
    write([trip, ...trips]);
    return trip;
  },
  update(id: string, patch: Partial<Trip>) {
    write(read().map((t) => {
      if (t.id !== id) return t;
      const merged = { ...t, ...patch };
      // re-derive visibility when date changes
      if ("startDate" in patch && !("visibility" in patch)) {
        merged.visibility = deriveVisibility(merged.startDate, t.visibility);
      }
      return merged;
    }));
  },
  remove(id: string) {
    write(read().filter((t) => t.id !== id));
  },
  duplicate(id: string) {
    const trips = read();
    const src = trips.find((t) => t.id === id);
    if (!src) return;
    const copy: Trip = {
      ...src,
      id: uid(),
      title: src.title + " (副本)",
      visibility: "private",
      createdAt: Date.now(),
      days: src.days.map((d) => ({
        ...d,
        id: uid(),
        attractions: d.attractions.map((a) => ({ ...a, id: uid() })),
      })),
    };
    write([copy, ...trips]);
  },
  addDay(tripId: string) {
    write(
      read().map((t) =>
        t.id === tripId ? { ...t, days: [...t.days, { id: uid(), attractions: [] }] } : t,
      ),
    );
  },
  updateDay(tripId: string, dayId: string, patch: Partial<Day>) {
    write(
      read().map((t) =>
        t.id === tripId
          ? { ...t, days: t.days.map((d) => (d.id === dayId ? { ...d, ...patch } : d)) }
          : t,
      ),
    );
  },
  removeDay(tripId: string, dayId: string) {
    write(
      read().map((t) =>
        t.id === tripId ? { ...t, days: t.days.filter((d) => d.id !== dayId) } : t,
      ),
    );
  },
  reorderAttractions(tripId: string, dayId: string, orderedIds: string[]) {
    write(
      read().map((t) =>
        t.id === tripId
          ? {
              ...t,
              days: t.days.map((d) =>
                d.id === dayId
                  ? {
                      ...d,
                      attractions: orderedIds
                        .map((oid) => d.attractions.find((a) => a.id === oid))
                        .filter(Boolean) as Attraction[],
                    }
                  : d,
              ),
            }
          : t,
      ),
    );
  },
  addAttraction(tripId: string, dayId: string, a: Omit<Attraction, "id">) {
    write(
      read().map((t) =>
        t.id === tripId
          ? {
              ...t,
              days: t.days.map((d) =>
                d.id === dayId ? { ...d, attractions: [...d.attractions, { ...a, id: uid() }] } : d,
              ),
            }
          : t,
      ),
    );
  },
  updateAttraction(tripId: string, dayId: string, attractionId: string, patch: Partial<Attraction>) {
    write(
      read().map((t) =>
        t.id === tripId
          ? {
              ...t,
              days: t.days.map((d) =>
                d.id === dayId
                  ? {
                      ...d,
                      attractions: d.attractions.map((a) =>
                        a.id === attractionId ? { ...a, ...patch } : a,
                      ),
                    }
                  : d,
              ),
            }
          : t,
      ),
    );
  },
  removeAttraction(tripId: string, dayId: string, attractionId: string) {
    write(
      read().map((t) =>
        t.id === tripId
          ? {
              ...t,
              days: t.days.map((d) =>
                d.id === dayId
                  ? { ...d, attractions: d.attractions.filter((a) => a.id !== attractionId) }
                  : d,
              ),
            }
          : t,
      ),
    );
  },
};

export function useTripsApi() {
  return useCallback(() => tripsApi, [])();
}
