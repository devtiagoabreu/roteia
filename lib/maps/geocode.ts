export type GeoPoint = { lat: number; lng: number };

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export async function geocodeAddress(
  address: string,
): Promise<GeoPoint | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;

  const orsKey = process.env.ORS_API_KEY;
  if (orsKey) {
    try {
      const point = await geocodeWithOrs(trimmed, orsKey);
      if (point) return point;
    } catch {
      // cai para o fallback
    }
  }

  return geocodeWithNominatim(trimmed);
}

async function geocodeWithOrs(
  address: string,
  apiKey: string,
): Promise<GeoPoint | null> {
  const url = new URL("https://api.openrouteservice.org/geocode/search");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("text", address);
  url.searchParams.set("size", "1");

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`ORS geocode ${res.status}`);
  const json = (await res.json()) as {
    features?: Array<{ geometry?: { coordinates?: [number, number] } }>;
  };
  const coords = json.features?.[0]?.geometry?.coordinates;
  if (!coords) return null;
  return { lat: coords[1], lng: coords[0] };
}

async function geocodeWithNominatim(
  address: string,
): Promise<GeoPoint | null> {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", address);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent":
        "Roteia/0.1 (roteia app; contato: dev@roteia.app)",
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const json = (await res.json()) as Array<{ lat: string; lon: string }>;
  const hit = json[0];
  if (!hit) return null;
  return { lat: Number(hit.lat), lng: Number(hit.lon) };
}