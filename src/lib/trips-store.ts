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
  attractions: Attraction[];
}

export interface Trip {
  id: string;
  title: string;
  startDate?: string;
  endDate?: string;
  isDraft?: boolean;
  isPublic?: boolean;
  coverEmoji?: string;
  days: Day[];
  createdAt: number;
}

const KEY = "lovable.trips.v1";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function read(): Trip[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed();
    return JSON.parse(raw) as Trip[];
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
      coverEmoji: "🏝️",
      createdAt: Date.now() - 3,
      days: [
        {
          id: uid(),
          attractions: [
            { id: uid(), name: "汉拿山", openingHours: "9:00 开放", description: "济州岛地标火山" },
            { id: uid(), name: "海水浴场", openingHours: "全天开放", description: "细沙白滩" },
          ],
        },
        { id: uid(), attractions: [] },
      ],
    },
    {
      id: uid(),
      title: "东京樱花之旅",
      startDate: "2024-03-20",
      endDate: "2024-03-25",
      coverEmoji: "🌸",
      createdAt: Date.now() - 2,
      days: [{ id: uid(), attractions: [] }],
    },
    {
      id: uid(),
      title: "巴黎浪漫行",
      isDraft: true,
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

export const tripsApi = {
  create(partial: Partial<Trip>): Trip {
    const trips = read();
    const trip: Trip = {
      id: uid(),
      title: partial.title || "未命名行程",
      startDate: partial.startDate,
      endDate: partial.endDate,
      isDraft: !partial.startDate,
      coverEmoji: partial.coverEmoji || "✈️",
      days: [{ id: uid(), attractions: [] }],
      createdAt: Date.now(),
    };
    write([trip, ...trips]);
    return trip;
  },
  update(id: string, patch: Partial<Trip>) {
    write(read().map((t) => (t.id === id ? { ...t, ...patch } : t)));
  },
  remove(id: string) {
    write(read().filter((t) => t.id !== id));
  },
  addDay(tripId: string) {
    write(
      read().map((t) =>
        t.id === tripId ? { ...t, days: [...t.days, { id: uid(), attractions: [] }] } : t,
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
