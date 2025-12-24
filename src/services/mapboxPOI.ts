import { POIData } from "@/types/booking";
import { getMapboxToken } from "@/config/mapbox";

/**
 * Hybrid approach (Option C):
 * - Use Mapbox Search Box "category" endpoint for clean, reliable category results (primary)
 * - Use Tilequery only as a fallback when Search Box yields sparse results
 *
 * Token is resolved from env or localStorage via shared helper.
 */

interface TilequeryFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    name?: string;
    name_en?: string;
    tilequery?: {
      distance: number; // meters
      geometry: string;
      layer: string;
    };
  };
}

interface TilequeryResponse {
  type: "FeatureCollection";
  features: TilequeryFeature[];
}

interface SearchFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    name: string;
    name_preferred?: string;
    full_address?: string;
  };
}

interface SearchResponse {
  type: "FeatureCollection";
  features: SearchFeature[];
}

type NearbyItem = { name: string; distance: string };

// ---------- Distance helpers ----------

function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return "";
  const km = meters / 1000;
  if (km < 1) return `${Math.round(meters)} m`;
  return `${km.toFixed(2)} km`;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ---------- Dedupe ----------

function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

function dedupeNearbyItems(items: (NearbyItem & { meters?: number })[]): (NearbyItem & { meters?: number })[] {
  const seen = new Set<string>();
  const out: (NearbyItem & { meters?: number })[] = [];
  for (const item of items) {
    const key = normalizeName(item.name);
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

// ---------- Mapbox Search Box (Primary) ----------

async function fetchSearchBoxCategory(
  category: string,
  latitude: number,
  longitude: number,
  options?: { limit?: number; maxMeters?: number },
): Promise<(NearbyItem & { meters: number })[]> {
  const token = getMapboxToken();
  if (!token) return [];

  const limit = options?.limit ?? 8;
  const maxMeters = options?.maxMeters;

  const url =
    `https://api.mapbox.com/search/searchbox/v1/category/${encodeURIComponent(category)}` +
    `?proximity=${longitude},${latitude}` +
    `&limit=${limit}` +
    `&access_token=${token}`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const data = (await res.json()) as SearchResponse;

  return (data.features || [])
    .map((feature) => {
      const [lon, lat] = feature.geometry.coordinates;
      const meters = calculateDistance(latitude, longitude, lat, lon);
      const name = feature.properties.name_preferred || feature.properties.name;
      return { name, meters, distance: formatDistance(meters) };
    })
    .filter((x) => (typeof maxMeters === "number" ? x.meters <= maxMeters : true))
    .sort((a, b) => a.meters - b.meters);
}

// ---------- Tilequery Fallback (Secondary) ----------

async function fetchTilequeryFallbackPOI(
  latitude: number,
  longitude: number,
  radiusMeters: number,
  limit = 30,
): Promise<(NearbyItem & { meters: number })[]> {
  const token = getMapboxToken();
  if (!token) return [];

  const url =
    `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${longitude},${latitude}.json` +
    `?radius=${radiusMeters}` +
    `&limit=${limit}` +
    `&layers=poi_label` +
    `&access_token=${token}`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const data = (await res.json()) as TilequeryResponse;

  return (data.features || [])
    .filter((f) => Boolean(f.properties?.name || f.properties?.name_en))
    .map((f) => {
      const name = f.properties.name_en || f.properties.name || "";
      const meters = f.properties.tilequery?.distance ?? 0;
      return { name, meters, distance: formatDistance(meters) };
    })
    .filter((x) => x.meters > 0)
    .sort((a, b) => a.meters - b.meters);
}

// ---------- Radii / Limits ----------

const RADII = {
  nearby: 3000, // essentials + food
  attractions: 12000,
  transit: 8000,
  airports: 60000,
  fallbackTilequery: 5000,
};

const OUTPUT_LIMIT_PER_BUCKET = 5;

// ---------- Public API ----------

export async function fetchMapboxPOI(latitude: number, longitude: number): Promise<POIData | null> {
  try {
    const [airportsRaw, transitRaw, attractionsRaw, nearbyRaw] = await Promise.all([
      fetchSearchBoxCategory("airport", latitude, longitude, { limit: 8, maxMeters: RADII.airports }),

      Promise.all([
        fetchSearchBoxCategory("subway_station", latitude, longitude, { limit: 6, maxMeters: RADII.transit }),
        fetchSearchBoxCategory("metro_station", latitude, longitude, { limit: 6, maxMeters: RADII.transit }),
        fetchSearchBoxCategory("train_station", latitude, longitude, { limit: 6, maxMeters: RADII.transit }),
      ]).then((arr) => arr.flat()),

      Promise.all([
        fetchSearchBoxCategory("tourist_attraction", latitude, longitude, { limit: 8, maxMeters: RADII.attractions }),
        fetchSearchBoxCategory("museum", latitude, longitude, { limit: 8, maxMeters: RADII.attractions }),
        fetchSearchBoxCategory("park", latitude, longitude, { limit: 8, maxMeters: RADII.attractions }),
      ]).then((arr) => arr.flat()),

      Promise.all([
        fetchSearchBoxCategory("restaurant", latitude, longitude, { limit: 8, maxMeters: RADII.nearby }),
        fetchSearchBoxCategory("cafe", latitude, longitude, { limit: 8, maxMeters: RADII.nearby }),
        fetchSearchBoxCategory("pharmacy", latitude, longitude, { limit: 6, maxMeters: RADII.nearby }),
        fetchSearchBoxCategory("supermarket", latitude, longitude, { limit: 6, maxMeters: RADII.nearby }),
        fetchSearchBoxCategory("hospital", latitude, longitude, { limit: 4, maxMeters: RADII.attractions }),
      ]).then((arr) => arr.flat()),
    ]);

    const airports = dedupeNearbyItems(airportsRaw).slice(0, OUTPUT_LIMIT_PER_BUCKET);
    const subways = dedupeNearbyItems(transitRaw).slice(0, OUTPUT_LIMIT_PER_BUCKET);
    const placesOfInterest = dedupeNearbyItems(attractionsRaw).slice(0, OUTPUT_LIMIT_PER_BUCKET);
    let nearby = dedupeNearbyItems(nearbyRaw).slice(0, OUTPUT_LIMIT_PER_BUCKET);

    // Fallback only if Search Box is sparse
    const needsFallback = nearby.length < 2 && placesOfInterest.length < 2;
    if (needsFallback) {
      const fallback = await fetchTilequeryFallbackPOI(latitude, longitude, RADII.fallbackTilequery, 30);
      const merged = dedupeNearbyItems([...nearby, ...fallback]).slice(0, OUTPUT_LIMIT_PER_BUCKET);
      nearby = merged;
    }

    const categorized: POIData = {
      nearby: nearby.map(({ name, distance }) => ({ name, distance })),
      placesOfInterest: placesOfInterest.map(({ name, distance }) => ({ name, distance })),
      airports: airports.map(({ name, distance }) => ({ name, distance })),
      subways: subways.map(({ name, distance }) => ({ name, distance })),
    };

    const total =
      categorized.nearby.length +
      categorized.placesOfInterest.length +
      categorized.airports.length +
      categorized.subways.length;

    return total > 0 ? categorized : null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("❌ Error fetching Mapbox POI (Hybrid):", error);
    return null;
  }
}
