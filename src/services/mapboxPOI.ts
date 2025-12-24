import { POIData } from "@/types/booking";

/**
 * Hybrid approach (Option C):
 * - Use Mapbox Search Box "category" endpoint for clean, reliable category results (primary)
 * - Use Tilequery only as a fallback when Search Box yields sparse results
 *
 * Notes:
 * - Move token to env: NEXT_PUBLIC_MAPBOX_TOKEN
 * - Distances are computed using haversine (Search Box doesn't always return distance)
 */

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

if (!MAPBOX_TOKEN) {
  // eslint-disable-next-line no-console
  console.warn(
    "⚠️ Missing NEXT_PUBLIC_MAPBOX_TOKEN. Mapbox Nearby will not work until it is set."
  );
}

interface TilequeryFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    name?: string;
    name_en?: string;
    maki?: string;
    class?: string;
    type?: string;
    category_en?: string;
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
    distance?: number; // not guaranteed
    maki?: string;
    poi_category?: string[];
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
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ---------- Generic utilities ----------

function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

function dedupeByName(items: { name: string }[]): { name: string }[] {
  const seen = new Set<string>();
  const out: { name: string }[] = [];
  for (const item of items) {
    const key = normalizeName(item.name);
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function dedupeNearbyItems(items: NearbyItem[]): NearbyItem[] {
  const seen = new Set<string>();
  const out: NearbyItem[] = [];
  for (const item of items) {
    const key = normalizeName(item.name);
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function takeTop<T>(items: T[], n: number): T[] {
  return items.slice(0, n);
}

// ---------- Mapbox Search Box (Primary) ----------

async function fetchSearchBoxCategory(
  category: string,
  latitude: number,
  longitude: number,
  options?: {
    limit?: number;
    maxMeters?: number;
  }
): Promise<(NearbyItem & { meters: number })[]> {
  if (!MAPBOX_TOKEN) return [];

  const limit = options?.limit ?? 8;
  const maxMeters = options?.maxMeters;

  const url =
    `https://api.mapbox.com/search/searchbox/v1/category/${encodeURIComponent(category)}` +
    `?proximity=${longitude},${latitude}` +
    `&limit=${limit}` +
    `&access_token=${MAPBOX_TOKEN}`;

  const res = await fetch(url);

  if (!res.ok) {
    // eslint-disable-next-line no-console
    console.warn(`⚠️ SearchBox category "${category}" failed:`, res.status);
    return [];
  }

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
// Only used when SearchBox returns sparse results, to avoid noisy "guessing" categorization.

async function fetchTilequeryFallbackPOI(
  latitude: number,
  longitude: number,
  radiusMeters: number,
  limit = 30
): Promise<(NearbyItem & { meters: number })[]> {
  if (!MAPBOX_TOKEN) return [];

  const url =
    `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${longitude},${latitude}.json` +
    `?radius=${radiusMeters}` +
    `&limit=${limit}` +
    `&layers=poi_label` +
    `&access_token=${MAPBOX_TOKEN}`;

  const res = await fetch(url);

  if (!res.ok) {
    // eslint-disable-next-line no-console
    console.warn("⚠️ Tilequery fallback failed:", res.status);
    return [];
  }

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

// ---------- Radii strategy ----------

const RADII = {
  nearby: 3000, // 3 km for essentials + food
  attractions: 12000, // 12 km for attractions
  transit: 8000, // 8 km for transit
  airports: 60000, // 60 km for airports
  fallbackTilequery: 5000, // 5 km fallback
};

const LIMITS = {
  nearby: 10,
  attractions: 10,
  transit: 10,
  airports: 8,
};

const OUTPUT_LIMIT_PER_BUCKET = 5;

// ---------- Public API ----------

export async function fetchMapboxPOI(latitude: number, longitude: number): Promise<POIData | null> {
  try {
    // eslint-disable-next-line no-console
    console.log(`📍 Fetching POI (Hybrid) for coordinates: ${latitude}, ${longitude}`);

    // PRIMARY: Search Box category queries (reliable)
    const [
      airportsRaw,
      transitRaw,
      attractionsRaw,
      nearbyRaw,
    ] = await Promise.all([
      // Airports
      fetchSearchBoxCategory("airport", latitude, longitude, {
        limit: LIMITS.airports,
        maxMeters: RADII.airports,
      }),

      // Transit (try multiple categories; some cities respond better to one than another)
      Promise.all([
        fetchSearchBoxCategory("subway_station", latitude, longitude, {
          limit: Math.ceil(LIMITS.transit / 2),
          maxMeters: RADII.transit,
        }),
        fetchSearchBoxCategory("metro_station", latitude, longitude, {
          limit: Math.ceil(LIMITS.transit / 2),
          maxMeters: RADII.transit,
        }),
        fetchSearchBoxCategory("train_station", latitude, longitude, {
          limit: Math.ceil(LIMITS.transit / 2),
          maxMeters: RADII.transit,
        }),
      ]).then((arr) => arr.flat()),

      // Attractions
      Promise.all([
        fetchSearchBoxCategory("tourist_attraction", latitude, longitude, {
          limit: Math.ceil(LIMITS.attractions / 2),
          maxMeters: RADII.attractions,
        }),
        fetchSearchBoxCategory("museum", latitude, longitude, {
          limit: Math.ceil(LIMITS.attractions / 2),
          maxMeters: RADII.attractions,
        }),
        fetchSearchBoxCategory("park", latitude, longitude, {
          limit: Math.ceil(LIMITS.attractions / 2),
          maxMeters: RADII.attractions,
        }),
      ]).then((arr) => arr.flat()),

      // Nearby essentials + food
      Promise.all([
        fetchSearchBoxCategory("restaurant", latitude, longitude, {
          limit: Math.ceil(LIMITS.nearby / 2),
          maxMeters: RADII.nearby,
        }),
        fetchSearchBoxCategory("cafe", latitude, longitude, {
          limit: Math.ceil(LIMITS.nearby / 2),
          maxMeters: RADII.nearby,
        }),
        fetchSearchBoxCategory("pharmacy", latitude, longitude, {
          limit: Math.ceil(LIMITS.nearby / 3),
          maxMeters: RADII.nearby,
        }),
        fetchSearchBoxCategory("supermarket", latitude, longitude, {
          limit: Math.ceil(LIMITS.nearby / 3),
          maxMeters: RADII.nearby,
        }),
        fetchSearchBoxCategory("hospital", latitude, longitude, {
          limit: 4,
          maxMeters: RADII.attractions, // hospitals may be farther; use attraction radius
        }),
      ]).then((arr) => arr.flat()),
    ]);

    // Deduplicate while preserving distance ordering
    const airports = dedupeNearbyItems(airportsRaw).slice(0, OUTPUT_LIMIT_PER_BUCKET);
    const subways = dedupeNearbyItems(transitRaw).slice(0, OUTPUT_LIMIT_PER_BUCKET);
    const placesOfInterest = dedupeNearbyItems(attractionsRaw).slice(0, OUTPUT_LIMIT_PER_BUCKET);
    let nearby = dedupeNearbyItems(nearbyRaw).slice(0, OUTPUT_LIMIT_PER_BUCKET);

    // FALLBACK: If we got almost nothing for Nearby/POI, use Tilequery labels as last resort.
    // (We avoid categorizing tilequery results into "subways/attractions" because it's noisy.)
    const needsFallback = nearby.length < 2 && placesOfInterest.length < 2;

    if (needsFallback) {
      const fallback = await fetchTilequeryFallbackPOI(
        latitude,
        longitude,
        RADII.fallbackTilequery,
        30
      );
      const fallbackItems = dedupeNearbyItems(fallback).slice(0, OUTPUT_LIMIT_PER_BUCKET);

      // Only fill empty slots; do not overwrite if Search Box already returned good results
      if (nearby.length < OUTPUT_LIMIT_PER_BUCKET) {
        const merged = dedupeNearbyItems([...nearby, ...fallbackItems]);
        nearby = takeTop(merged, OUTPUT_LIMIT_PER_BUCKET);
      }
    }

    const categorized: POIData = {
      nearby: nearby.map(({ name, distance }) => ({ name, distance })),
      placesOfInterest: placesOfInterest.map(({ name, distance }) => ({ name, distance })),
      airports: airports.map(({ name, distance }) => ({ name, distance })),
      subways: subways.map(({ name, distance }) => ({ name, distance })),
    };

    // eslint-disable-next-line no-console
    console.log("✅ Mapbox POI categorized (Hybrid):", {
      nearby: categorized.nearby.length,
      placesOfInterest: categorized.placesOfInterest.length,
      airports: categorized.airports.length,
      subways: categorized.subways.length,
    });

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
