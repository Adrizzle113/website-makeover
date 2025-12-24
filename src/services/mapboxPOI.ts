This is the current tsx and its not filtering well. 
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
const ATTRACTION_TYPES = [
  // Cultural/Historical
  "museum", "monument", "attraction", "gallery", "historic", "castle", "theatre", "stadium",
  // Parks & Nature
  "park", "garden", "zoo", "aquarium", "beach", "viewpoint", "nature",
  // Dining
  "restaurant", "cafe", "bar", "bakery", "food", "dining",
  // Shopping
  "shop", "shopping", "mall", "market", "store", "boutique",
  // Entertainment
  "cinema", "nightclub", "entertainment", "casino", "bowling", "arcade", "amusement"
];

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
  const maki = props.maki?.toLowerCase() || "";
  const type = props.type?.toLowerCase() || "";
  const className = props.class?.toLowerCase() || "";
  const category = props.category_en?.toLowerCase() || "";
  const layer = props.tilequery?.layer || "";

  // Check for transit/subway
  if (layer === "transit_stop_label" || TRANSIT_TYPES.some(t => maki.includes(t) || type.includes(t) || className.includes(t))) {
    return "subways";
  }

  // Check for attractions/landmarks
  if (ATTRACTION_TYPES.some(t => maki.includes(t) || type.includes(t) || category.includes(t))) {
    return "placesOfInterest";
  }

  // Everything else is "nearby"
  if (props.name || props.name_en) {
    return "nearby";
  }

  return null;
}

async function fetchAirportsViaSearch(latitude: number, longitude: number): Promise<{ name: string; distance: string }[]> {
  try {
    // Use Mapbox Search API to find airports
    const response = await fetch(
      `https://api.mapbox.com/search/searchbox/v1/category/airport?proximity=${longitude},${latitude}&limit=5&access_token=${MAPBOX_TOKEN}`
    );
    
    if (!response.ok) {
      console.warn("Airport search failed:", response.status);
      return [];
    }
    
    const data = await response.json() as SearchResponse;
    
    return data.features
      .map(feature => {
        const [lon, lat] = feature.geometry.coordinates;
        const distance = calculateDistance(latitude, longitude, lat, lon);
        return {
          name: feature.properties.name_preferred || feature.properties.name,
          distance: formatDistance(distance),
          distanceMeters: distance,
        };
      })
      .filter(airport => airport.distanceMeters <= 60000) // Only airports within 60km
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, 5)
      .map(({ name, distance }) => ({ name, distance }));
  } catch (error) {
    console.error("Error fetching airports:", error);
    return [];
  }
}

export async function fetchMapboxPOI(latitude: number, longitude: number): Promise<POIData | null> {
  try {
    console.log(`📍 Fetching POI from Mapbox for coordinates: ${latitude}, ${longitude}`);

    const nearbyRadius = 5000; // 5km for nearby places
    const limit = 50;

    // Fetch POI, transit via Tilequery, and airports via Search API in parallel
    const [poiResponse, transitResponse, airports] = await Promise.all([
      fetch(
        `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${longitude},${latitude}.json?radius=${nearbyRadius}&limit=${limit}&layers=poi_label&access_token=${MAPBOX_TOKEN}`
      ).then(res => res.json() as Promise<TilequeryResponse>),
      fetch(
        `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${longitude},${latitude}.json?radius=${nearbyRadius}&limit=${limit}&layers=transit_stop_label&access_token=${MAPBOX_TOKEN}`
      ).then(res => res.json() as Promise<TilequeryResponse>),
      fetchAirportsViaSearch(latitude, longitude),
    ]);

    // Combine POI and transit features
    const allFeatures = [...(poiResponse.features || []), ...(transitResponse.features || [])];

    console.log(`📍 Mapbox returned ${allFeatures.length} POI features and ${airports.length} airports`);

    // Categorize and deduplicate
    const categorized: POIData = {
      nearby: [],
      placesOfInterest: [],
      airports: airports,
      subways: [],
    };

    const seenNames = new Set<string>();

    // Sort by distance first
    const sortedFeatures = allFeatures
      .filter(f => f.properties.name || f.properties.name_en)
      .sort((a, b) => (a.properties.tilequery?.distance || 0) - (b.properties.tilequery?.distance || 0));

    for (const feature of sortedFeatures) {
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