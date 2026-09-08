import type { GeoPoint } from "@/lib/maps/geocode";

export type RouteResult = {
  distanceMeters: number;
  durationSeconds: number;
};

const URBAN_AVG_KMH = 30;

export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) *
      Math.cos(toRad(b.lat)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * Retorna distância/tempo entre pontos em sequência.
 * Com ORS_API_KEY usa rota real (driving-car); sem chave usa
 * distância em linha reta + velocidade média urbana (fallback offline).
 */
export async function routeBetween(
  points: GeoPoint[],
): Promise<RouteResult> {
  if (points.length < 2) {
    return { distanceMeters: 0, durationSeconds: 0 };
  }

  const orsKey = process.env.ORS_API_KEY;
  if (orsKey) {
    try {
      return await routeWithOrs(points, orsKey);
    } catch {
      // cai para o fallback
    }
  }

  return routeFallback(points);
}

function routeFallback(points: GeoPoint[]): RouteResult {
  let distanceMeters = 0;
  for (let i = 1; i < points.length; i++) {
    const d = haversineMeters(points[i - 1]!, points[i]!);
    distanceMeters += d;
    if (d > 200) {
      const correctionFactor = 1.3;
      distanceMeters += (correctionFactor - 1) * d; // circunferência de ruas ~ +30%
    }
  }
  const durationSeconds = Math.round(
    (distanceMeters / 1000 / URBAN_AVG_KMH) * 3600,
  );
  return { distanceMeters: Math.round(distanceMeters), durationSeconds };
}

async function routeWithOrs(
  points: GeoPoint[],
  apiKey: string,
): Promise<RouteResult> {
  const body = {
    coordinates: points.map((p) => [p.lng, p.lat]),
  };

  const res = await fetch(
    "https://api.openrouteservice.org/v2/directions/driving-car",
    {
      method: "POST",
      cache: "no-store",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) throw new Error(`ORS directions ${res.status}`);

  const json = (await res.json()) as {
    routes?: Array<{ summary?: { distance?: number; duration?: number } }>;
  };
  const summary = json.routes?.[0]?.summary;
  if (!summary) throw new Error("ORS no route");
  return {
    distanceMeters: Math.round(summary.distance ?? 0),
    durationSeconds: Math.round(summary.duration ?? 0),
  };
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${m.toString().padStart(2, "0")}`;
}