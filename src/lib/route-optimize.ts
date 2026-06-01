import type { Attraction } from "@/lib/trips-store";

export function haversineKm(a: [number, number], b: [number, number]) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function routeDistance(pts: [number, number][]) {
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += haversineKm(pts[i - 1], pts[i]);
  return d;
}

/** Nearest-neighbor seeded with each start, refined with 2-opt. Keeps first fixed. */
function nearestNeighbor(pts: [number, number][], startIdx: number): number[] {
  const n = pts.length;
  const visited = new Array(n).fill(false);
  const order = [startIdx];
  visited[startIdx] = true;
  let cur = startIdx;
  for (let k = 1; k < n; k++) {
    let best = -1;
    let bestD = Infinity;
    for (let j = 0; j < n; j++) {
      if (visited[j]) continue;
      const d = haversineKm(pts[cur], pts[j]);
      if (d < bestD) {
        bestD = d;
        best = j;
      }
    }
    visited[best] = true;
    order.push(best);
    cur = best;
  }
  return order;
}

function twoOpt(order: number[], pts: [number, number][]): number[] {
  let best = order.slice();
  let bestD = routeDistance(best.map((i) => pts[i]));
  let improved = true;
  let guard = 0;
  while (improved && guard++ < 50) {
    improved = false;
    for (let i = 1; i < best.length - 2; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const next = best.slice();
        // reverse segment [i..j]
        const seg = next.slice(i, j + 1).reverse();
        next.splice(i, seg.length, ...seg);
        const d = routeDistance(next.map((k) => pts[k]));
        if (d + 1e-9 < bestD) {
          best = next;
          bestD = d;
          improved = true;
        }
      }
    }
  }
  return best;
}

export interface OptimizeResult {
  orderedIds: string[];
  beforeKm: number;
  afterKm: number;
  optimizedCount: number;
}

/**
 * Returns a new ordering of attraction ids that minimizes total walking
 * distance. Attractions without coordinates keep their relative order at the
 * tail.
 */
export function optimizeDayOrder(attractions: Attraction[]): OptimizeResult | null {
  const pinned = attractions.filter(
    (a): a is Attraction & { lat: number; lng: number } =>
      typeof a.lat === "number" && typeof a.lng === "number",
  );
  const unpinned = attractions.filter(
    (a) => typeof a.lat !== "number" || typeof a.lng !== "number",
  );
  if (pinned.length < 2) return null;

  const pts: [number, number][] = pinned.map((a) => [a.lat, a.lng]);
  const before = routeDistance(pts);

  // Try every starting point; keep the cheapest tour after 2-opt.
  let bestOrder: number[] = pinned.map((_, i) => i);
  let bestD = before;
  for (let s = 0; s < pinned.length; s++) {
    const nn = nearestNeighbor(pts, s);
    const refined = twoOpt(nn, pts);
    const d = routeDistance(refined.map((i) => pts[i]));
    if (d < bestD - 1e-9) {
      bestD = d;
      bestOrder = refined;
    }
  }

  const orderedPinned = bestOrder.map((i) => pinned[i]);
  const orderedIds = [...orderedPinned, ...unpinned].map((a) => a.id);

  return {
    orderedIds,
    beforeKm: before,
    afterKm: bestD,
    optimizedCount: pinned.length,
  };
}
