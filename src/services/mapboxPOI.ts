import { POIData } from "@/types/booking";

const MAPBOX_TOKEN = "pk.eyJ1IjoiYm91Z2llYmFja3BhY2tlciIsImEiOiJjbWphZWgyZG4wNHN4M2RweWVjdzVpY3kyIn0.otTqyXhQRvR8qYCHhD8wqg";

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
      distance: number;
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
    distance?: number;
    maki?: string;
    poi_category?: string[];
  };
}

interface SearchResponse {
  type: "FeatureCollection";
  features: SearchFeature[];
}

// Categories for classification
const TRANSIT_TYPES = ["subway", "rail", "metro", "train", "station", "transit"];

// What's Nearby - Notable places within walking distance (shops, clubs, landmarks - NOT dining)
const NEARBY_TYPES = [
  // Shops & Stores
  "shop", "store", "boutique", "mall", "department_store", "clothing", "jewelry",
  // Clubs & Venues
  "club", "theatre", "theater", "gallery", "art", "entertainment",
  // Landmarks & Notable Places
  "monument", "gate", "plaza", "building", "landmark", "attraction", "hotel",
  // Small Parks
  "garden"
];

// Places of Interest - Famous attractions at various distances
const LANDMARK_TYPES = [
  "museum", "attraction", "landmark", "historic", "stadium", "zoo", "aquarium",
  "park", "bridge", "memorial", "square", "center", "tower", "liberty"
];

// Exclude these from results (military, private facilities)
const EXCLUDED_KEYWORDS = [
  "military", "army", "navy", "air force", "afb", "base", "private", "restricted",
  "national guard", "coast guard", "marines", "air national"
];

// Priority ranking for POIs (lower number = more important, shown first)
const POI_PRIORITY: Record<string, number> = {
  // Priority 1 - World-famous landmarks
  "museum": 1, "stadium": 1, "bridge": 1, "liberty": 1, "square": 1,
  // Priority 2 - Major attractions
  "zoo": 2, "aquarium": 2, "memorial": 2, "tower": 2, "center": 2,
  // Priority 3 - Parks
  "park": 3,
  // Priority 4 - Other attractions
  "attraction": 4, "landmark": 4, "historic": 4,
};

function getPOIPriority(feature: TilequeryFeature): number {
  const props = feature.properties;
  const maki = props.maki?.toLowerCase() || "";
  const type = props.type?.toLowerCase() || "";
  const category = props.category_en?.toLowerCase() || "";
  
  let bestPriority = 10; // Default lowest priority
  
  for (const [key, priority] of Object.entries(POI_PRIORITY)) {
    if (maki.includes(key) || type.includes(key) || category.includes(key)) {
      bestPriority = Math.min(bestPriority, priority);
    }
  }
  
  return bestPriority;
}

function isExcluded(name: string): boolean {
  const lowerName = name.toLowerCase();
  return EXCLUDED_KEYWORDS.some(keyword => lowerName.includes(keyword));
}

function formatDistance(meters: number): string {
  const km = meters / 1000;
  return `${km.toFixed(2)} km`;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function categorizeFeature(feature: TilequeryFeature): "nearby" | "placesOfInterest" | "subways" | null {
  const props = feature.properties;
  const name = (props.name || props.name_en || "").toLowerCase();
  const maki = props.maki?.toLowerCase() || "";
  const type = props.type?.toLowerCase() || "";
  const className = props.class?.toLowerCase() || "";
  const category = props.category_en?.toLowerCase() || "";
  const layer = props.tilequery?.layer || "";

  // Filter out military/private facilities
  if (isExcluded(name)) {
    return null;
  }

  // Check for transit/subway
  if (layer === "transit_stop_label" || TRANSIT_TYPES.some(t => maki.includes(t) || type.includes(t) || className.includes(t))) {
    return "subways";
  }

  // What's Nearby - Restaurants, bars, cafes ONLY
  if (NEARBY_TYPES.some(t => maki.includes(t) || type.includes(t) || category.includes(t))) {
    return "nearby";
  }

  // Places of Interest - Major landmarks ONLY
  if (LANDMARK_TYPES.some(t => maki.includes(t) || type.includes(t) || category.includes(t))) {
    return "placesOfInterest";
  }

  return null;
}

async function fetchAirportsViaSearch(latitude: number, longitude: number): Promise<{ name: string; distance: string }[]> {
  try {
    // Use Mapbox Search API to find airports within 50km
    const response = await fetch(
      `https://api.mapbox.com/search/searchbox/v1/category/airport?proximity=${longitude},${latitude}&limit=25&access_token=${MAPBOX_TOKEN}`
    );
    
    if (!response.ok) {
      console.warn("Airport search failed:", response.status);
      return [];
    }
    
    const data = await response.json() as SearchResponse;
    
    const allAirports = data.features
      .map(feature => {
        const [lon, lat] = feature.geometry.coordinates;
        const distance = calculateDistance(latitude, longitude, lat, lon);
        const name = feature.properties.name_preferred || feature.properties.name;
        const isMilitary = isExcluded(name);
        return {
          name,
          distance: formatDistance(distance),
          distanceMeters: distance,
          isMilitary,
        };
      })
      // Filter: exclude military bases only (no distance filter)
      .filter(airport => !airport.isMilitary);

    // Sort by distance (closest first)
    const sorted = allAirports.sort((a, b) => a.distanceMeters - b.distanceMeters);

    return sorted.slice(0, 8).map(({ name, distance }) => ({ name, distance }));
  } catch (error) {
    console.error("Error fetching airports:", error);
    return [];
  }
}

export async function fetchMapboxPOI(latitude: number, longitude: number): Promise<POIData | null> {
  try {
    console.log(`📍 Fetching POI from Mapbox for coordinates: ${latitude}, ${longitude}`);

    const nearbyRadius = 800; // 800m for nearby places (walking distance ~0.5 miles)
    const landmarkRadius = 15000; // 15km for places of interest (~10 miles)
    const limit = 50;

    // Fetch nearby POI, landmarks, transit, and airports in parallel
    const [nearbyResponse, landmarkResponse, transitResponse, airports] = await Promise.all([
      fetch(
        `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${longitude},${latitude}.json?radius=${nearbyRadius}&limit=${limit}&layers=poi_label&access_token=${MAPBOX_TOKEN}`
      ).then(res => res.json() as Promise<TilequeryResponse>),
      fetch(
        `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${longitude},${latitude}.json?radius=${landmarkRadius}&limit=${limit}&layers=poi_label&access_token=${MAPBOX_TOKEN}`
      ).then(res => res.json() as Promise<TilequeryResponse>),
      fetch(
        `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${longitude},${latitude}.json?radius=${nearbyRadius}&limit=${limit}&layers=transit_stop_label&access_token=${MAPBOX_TOKEN}`
      ).then(res => res.json() as Promise<TilequeryResponse>),
      fetchAirportsViaSearch(latitude, longitude),
    ]);

    // Combine all features
    const allFeatures = [
      ...(nearbyResponse.features || []), 
      ...(landmarkResponse.features || []),
      ...(transitResponse.features || [])
    ];

    console.log(`📍 Mapbox returned ${allFeatures.length} POI features and ${airports.length} airports`);

    // Categorize and deduplicate
    const categorized: POIData = {
      nearby: [],
      placesOfInterest: [],
      airports: airports,
      subways: [],
    };

    const seenNames = new Set<string>();

    // Sort by priority first, then distance
    const sortedFeatures = allFeatures
      .filter(f => f.properties.name || f.properties.name_en)
      .map(f => ({ feature: f, priority: getPOIPriority(f) }))
      .sort((a, b) => {
        // First sort by priority (lower = more important)
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        // Then by distance as tiebreaker
        return (a.feature.properties.tilequery?.distance || 0) - 
               (b.feature.properties.tilequery?.distance || 0);
      });

    for (const { feature } of sortedFeatures) {
      const name = feature.properties.name_en || feature.properties.name || "";
      const distance = feature.properties.tilequery?.distance || 0;
      
      // Skip duplicates
      const normalizedName = name.toLowerCase().trim();
      if (seenNames.has(normalizedName)) continue;
      
      const category = categorizeFeature(feature);
      if (!category) continue;

      seenNames.add(normalizedName);

      const item = {
        name,
        distance: formatDistance(distance),
      };

      // Limit items per category (10 for nearby/places, 8 for airports, 5 for subways)
      const limits: Record<string, number> = { nearby: 10, placesOfInterest: 10, airports: 8, subways: 5 };
      if (categorized[category].length < limits[category]) {
        categorized[category].push(item);
      }
    }

    console.log("✅ Mapbox POI categorized:", {
      nearby: categorized.nearby.length,
      placesOfInterest: categorized.placesOfInterest.length,
      airports: categorized.airports.length,
      subways: categorized.subways.length,
    });

    // Return null if no POI found
    const totalPOI = categorized.nearby.length + categorized.placesOfInterest.length + 
                     categorized.airports.length + categorized.subways.length;
    
    if (totalPOI === 0) {
      console.log("⚠️ No POI found from Mapbox");
      return null;
    }

    return categorized;
  } catch (error) {
    console.error("❌ Error fetching Mapbox POI:", error);
    return null;
  }
}
