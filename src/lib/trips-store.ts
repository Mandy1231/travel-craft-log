import { useQuery, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  userId?: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  visibility: Visibility;
  coverEmoji?: string;
  days: Day[];
  createdAt: number;
}

let _qc: QueryClient | null = null;
export function bindQueryClient(qc: QueryClient) {
  _qc = qc;
}
function invalidateAll() {
  _qc?.invalidateQueries({ queryKey: ["trips"] });
}

function mapAttraction(row: any): Attraction {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    openingHours: row.opening_hours ?? undefined,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
  };
}

function mapDay(row: any): Day {
  return {
    id: row.id,
    title: row.title ?? undefined,
    attractions: ((row.attractions ?? []) as any[])
      .slice()
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map(mapAttraction),
  };
}

function mapTrip(row: any): Trip {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? undefined,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    visibility: row.visibility,
    coverEmoji: row.cover_emoji ?? "✈️",
    days: ((row.days ?? []) as any[])
      .slice()
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map(mapDay),
    createdAt: row.created_at ? new Date(row.created_at).getTime() : 0,
  };
}

async function fetchTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from("trips")
    .select("*, days(*, attractions(*))")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapTrip);
}

async function fetchTrip(id: string): Promise<Trip | null> {
  const { data, error } = await supabase
    .from("trips")
    .select("*, days(*, attractions(*))")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTrip(data) : null;
}

export function useTrips() {
  const { data } = useQuery({ queryKey: ["trips"], queryFn: fetchTrips });
  return data ?? [];
}

export function useTrip(id: string | undefined): Trip | undefined {
  const { data } = useQuery({
    queryKey: ["trips", id],
    queryFn: () => (id ? fetchTrip(id) : Promise.resolve(null)),
    enabled: !!id,
  });
  return data ?? undefined;
}

function deriveVisibility(startDate?: string, current?: Visibility): Visibility {
  if (current === "public") return "public";
  if (!startDate) return "draft";
  return current ?? "private";
}

async function getUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("未登录");
  return data.user.id;
}

export const tripsApi = {
  async create(partial: Partial<Trip>) {
    const userId = await getUserId();
    const visibility = deriveVisibility(partial.startDate, partial.visibility);
    const { data: trip, error } = await supabase
      .from("trips")
      .insert({
        user_id: userId,
        title: partial.title || "未命名行程",
        description: partial.description ?? null,
        start_date: partial.startDate || null,
        end_date: partial.endDate || null,
        visibility,
        cover_emoji: partial.coverEmoji || "✈️",
      })
      .select()
      .single();
    if (error) throw error;
    await supabase.from("days").insert({ trip_id: trip.id, position: 0 });
    invalidateAll();
  },

  async update(id: string, patch: Partial<Trip>) {
    let nextVisibility = patch.visibility;
    if ("startDate" in patch && !("visibility" in patch)) {
      const { data } = await supabase
        .from("trips")
        .select("visibility")
        .eq("id", id)
        .single();
      nextVisibility = deriveVisibility(patch.startDate, data?.visibility as Visibility);
    }
    const body: Record<string, unknown> = {};
    if ("title" in patch) body.title = patch.title;
    if ("description" in patch) body.description = patch.description ?? null;
    if ("startDate" in patch) body.start_date = patch.startDate || null;
    if ("endDate" in patch) body.end_date = patch.endDate || null;
    if ("coverEmoji" in patch) body.cover_emoji = patch.coverEmoji;
    if (nextVisibility) body.visibility = nextVisibility;
    const { error } = await supabase.from("trips").update(body).eq("id", id);
    if (error) throw error;
    invalidateAll();
  },

  async remove(id: string) {
    await supabase.from("trips").delete().eq("id", id);
    invalidateAll();
  },

  async duplicate(id: string) {
    const src = await fetchTrip(id);
    if (!src) return;
    const userId = await getUserId();
    const { data: trip, error } = await supabase
      .from("trips")
      .insert({
        user_id: userId,
        title: src.title + " (副本)",
        description: src.description ?? null,
        start_date: src.startDate || null,
        end_date: src.endDate || null,
        visibility: "private",
        cover_emoji: src.coverEmoji,
      })
      .select()
      .single();
    if (error) throw error;
    for (let i = 0; i < src.days.length; i++) {
      const d = src.days[i];
      const { data: newDay, error: dErr } = await supabase
        .from("days")
        .insert({ trip_id: trip.id, title: d.title ?? null, position: i })
        .select()
        .single();
      if (dErr || !newDay) continue;
      if (d.attractions.length) {
        await supabase.from("attractions").insert(
          d.attractions.map((a, idx) => ({
            day_id: newDay.id,
            name: a.name,
            description: a.description ?? null,
            opening_hours: a.openingHours ?? null,
            lat: a.lat ?? null,
            lng: a.lng ?? null,
            position: idx,
          })),
        );
      }
    }
    invalidateAll();
  },

  async addDay(tripId: string) {
    const { data: existing } = await supabase
      .from("days")
      .select("position")
      .eq("trip_id", tripId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const pos = (existing?.position ?? -1) + 1;
    await supabase.from("days").insert({ trip_id: tripId, position: pos });
    invalidateAll();
  },

  async updateDay(_tripId: string, dayId: string, patch: Partial<Day>) {
    const body: Record<string, unknown> = {};
    if ("title" in patch) body.title = patch.title || null;
    await supabase.from("days").update(body).eq("id", dayId);
    invalidateAll();
  },

  async removeDay(_tripId: string, dayId: string) {
    await supabase.from("days").delete().eq("id", dayId);
    invalidateAll();
  },

  async reorderAttractions(_tripId: string, _dayId: string, orderedIds: string[]) {
    await Promise.all(
      orderedIds.map((id, idx) =>
        supabase.from("attractions").update({ position: idx }).eq("id", id),
      ),
    );
    invalidateAll();
  },

  async addAttraction(_tripId: string, dayId: string, a: Omit<Attraction, "id">) {
    const { data: existing } = await supabase
      .from("attractions")
      .select("position")
      .eq("day_id", dayId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const pos = (existing?.position ?? -1) + 1;
    await supabase.from("attractions").insert({
      day_id: dayId,
      name: a.name,
      description: a.description ?? null,
      opening_hours: a.openingHours ?? null,
      lat: a.lat ?? null,
      lng: a.lng ?? null,
      position: pos,
    });
    invalidateAll();
  },

  async updateAttraction(
    _tripId: string,
    _dayId: string,
    id: string,
    patch: Partial<Attraction>,
  ) {
    const body: Record<string, unknown> = {};
    if ("name" in patch) body.name = patch.name;
    if ("description" in patch) body.description = patch.description ?? null;
    if ("openingHours" in patch) body.opening_hours = patch.openingHours ?? null;
    if ("lat" in patch) body.lat = patch.lat ?? null;
    if ("lng" in patch) body.lng = patch.lng ?? null;
    await supabase.from("attractions").update(body).eq("id", id);
    invalidateAll();
  },

  async removeAttraction(_tripId: string, _dayId: string, id: string) {
    await supabase.from("attractions").delete().eq("id", id);
    invalidateAll();
  },
};
