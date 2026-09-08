export type GeoPoint = { lat: number; lng: number };

export type AddressSuggestion = {
  label: string;
  lat: number;
  lng: number;
};

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_MIN_INTERVAL_MS = 1100;

let lastNominatimAt = 0;

async function throttledNominatim(url: URL): Promise<Response> {
  const wait = lastNominatimAt + NOMINATIM_MIN_INTERVAL_MS - Date.now();
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastNominatimAt = Date.now();
  return fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent":
        "Roteia/0.1 (roteia app; contato: dev@roteia.app)",
      Accept: "application/json",
    },
  });
}

export async function autocompleteAddress(
  query: string,
): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 4) return [];

  const orsKey = process.env.ORS_API_KEY;
  if (orsKey) {
    try {
      const results = await autocompleteWithOrs(trimmed, orsKey);
      if (results.length > 0) return results;
    } catch {
      // cai para o fallback
    }
  }

  return autocompleteWithNominatim(trimmed);
}

async function autocompleteWithOrs(
  query: string,
  apiKey: string,
): Promise<AddressSuggestion[]> {
  const url = new URL(
    "https://api.openrouteservice.org/geocode/autocomplete",
  );
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("text", query);
  url.searchParams.set("size", "6");

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`ORS autocomplete ${res.status}`);
  const json = (await res.json()) as {
    features?: Array<{
      geometry?: { coordinates?: [number, number] };
      properties?: { label?: string };
    }>;
  };
  return (json.features ?? [])
    .filter(
      (f) => f?.geometry?.coordinates && f?.properties?.label,
    )
    .map((f) => ({
      label: f.properties!.label!,
      lat: f.geometry!.coordinates![1],
      lng: f.geometry!.coordinates![0],
    }))
    .slice(0, 6);
}

async function autocompleteWithNominatim(
  query: string,
): Promise<AddressSuggestion[]> {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "6");
  url.searchParams.set("addressdetails", "0");

  const res = await throttledNominatim(url);
  if (!res.ok) throw new Error(`Nominatim autocomplete ${res.status}`);
  const json = (await res.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>;
  return json
    .map((hit) => ({
      label: hit.display_name,
      lat: Number(hit.lat),
      lng: Number(hit.lon),
    }))
    .slice(0, 6);
}

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

  const res = await throttledNominatim(url);
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const json = (await res.json()) as Array<{ lat: string; lon: string }>;
  const hit = json[0];
  if (!hit) return null;
  return { lat: Number(hit.lat), lng: Number(hit.lon) };
}