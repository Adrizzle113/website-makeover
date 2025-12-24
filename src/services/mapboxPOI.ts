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

// Categories for classification
const AIRPORT_TYPES = ["airport", "aerodrome", "heliport"];
const TRANSIT_TYPES = ["subway", "rail", "metro", "train", "station", "transit"];
const ATTRACTION_TYPES = ["museum", "monument", "attraction", "gallery", "historic", "castle", "theatre", "stadium"];

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

function categorizeFeature(feature: TilequeryFeature): "nearby" | "placesOfInterest" | "airports" | "subways" | null {
  const props = feature.properties;
  const maki = props.maki?.toLowerCase() || "";
  const type = props.type?.toLowerCase() || "";
  const className = props.class?.toLowerCase() || "";
  const category = props.category_en?.toLowerCase() || "";
  const layer = props.tilequery?.layer || "";

  // Check for airports
  if (layer === "airport_label" || AIRPORT_TYPES.some(t => maki.includes(t) || type.includes(t) || category.includes(t))) {
    return "airports";
  }

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

export async function fetchMapboxPOI(latitude: number, longitude: number): Promise<POIData | null> {
  try {
    console.log(`📍 Fetching POI from Mapbox for coordinates: ${latitude}, ${longitude}`);

    // Fetch from multiple layers in parallel
    const layers = ["poi_label", "airport_label", "transit_stop_label"];
    const radius = 5000; // 5km radius
    const limit = 50;

    const requests = layers.map(layer =>
      fetch(
        `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${longitude},${latitude}.json?radius=${radius}&limit=${limit}&layers=${layer}&access_token=${MAPBOX_TOKEN}`
      ).then(res => res.json() as Promise<TilequeryResponse>)
    );

    const responses = await Promise.all(requests);
    
    // Combine all features
    const allFeatures = responses.flatMap(r => r.features || []);

    console.log(`📍 Mapbox returned ${allFeatures.length} POI features`);

    // Categorize and deduplicate
    const categorized: POIData = {
      nearby: [],
      placesOfInterest: [],
      airports: [],
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
