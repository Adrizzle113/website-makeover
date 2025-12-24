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

// What's Nearby - Dining/casual establishments (walking distance)
const NEARBY_TYPES = [
  "restaurant", "cafe", "bar", "bakery", "food", "dining", "pub", "bistro", "coffee"
];

// Places of Interest - Major landmarks only (driving distance)
const LANDMARK_TYPES = [
  "museum", "monument", "attraction", "gallery", "historic", "castle", 
  "theatre", "theater", "stadium", "zoo", "aquarium", "park", "garden", "viewpoint",
  "landmark", "memorial", "palace", "cathedral", "church", "temple", "library"
];

// Exclude these from results (military, private facilities)
const EXCLUDED_KEYWORDS = [
  "military", "army", "navy", "air force", "afb", "base", "private", "restricted",
  "national guard", "coast guard", "marines", "air national"
];

// Priority ranking for POIs (lower number = more important, shown first)
const POI_PRIORITY: Record<string, number> = {
  // Priority 1 - World-class landmarks
  "museum": 1, "stadium": 1, "monument": 1, "theatre": 1, "theater": 1, "palace": 1,
  // Priority 2 - Major attractions
  "zoo": 2, "aquarium": 2, "castle": 2, "memorial": 2, "cathedral": 2,
  // Priority 3 - Parks & gardens
  "park": 3, "garden": 3, "viewpoint": 3,
  // Priority 4 - Other attractions
  "gallery": 4, "attraction": 4, "landmark": 4, "library": 4,
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
    // Use Mapbox Search API to find airports
    const response = await fetch(
      `https://api.mapbox.com/search/searchbox/v1/category/airport?proximity=${longitude},${latitude}&limit=15&access_token=${MAPBOX_TOKEN}`
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
        const isMajor = /international|intl/i.test(name);
        const isMilitary = isExcluded(name);
        return {
          name,
          distance: formatDistance(distance),
          distanceMeters: distance,
          isMajor,
          isMilitary,
        };
      })
      // Filter: 30-80km range, no military bases
      .filter(airport => 
        airport.distanceMeters >= 30000 && 
        airport.distanceMeters <= 80000 && 
        !airport.isMilitary
      );

    // Sort: major airports first, then by distance
    const sorted = allAirports.sort((a, b) => {
      if (a.isMajor !== b.isMajor) return a.isMajor ? -1 : 1;
      return a.distanceMeters - b.distanceMeters;
    });

    return sorted.slice(0, 5).map(({ name, distance }) => ({ name, distance }));
  } catch (error) {
    console.error("Error fetching airports:", error);
    return [];
  }
}

export async function fetchMapboxPOI(latitude: number, longitude: number): Promise<POIData | null> {
  try {
    console.log(`📍 Fetching POI from Mapbox for coordinates: ${latitude}, ${longitude}`);

    const nearbyRadius = 2000; // 2km for restaurants/bars (walking distance)
    const landmarkRadius = 50000; // 50km for places of interest (driving distance)
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

      // Limit items per category
      if (categorized[category].length < 5) {
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
