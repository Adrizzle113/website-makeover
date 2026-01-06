// Mapbox Geocoding service for destination → coordinates fallback

const MAPBOX_TOKEN = "pk.eyJ1IjoiYm91Z2llYmFja3BhY2tlciIsImEiOiJjbWphZWgyZG4wNHN4M2RweWVjdzVpY3kyIn0.otTqyXhQRvR8qYCHhD8wqg";

interface GeocodeResult {
  lat: number;
  lon: number;
  name: string;
}

/**
 * Geocode a destination string to coordinates using Mapbox
 * Used as fallback when region-based search fails
 */
export async function geocodePlace(query: string): Promise<GeocodeResult | null> {
  try {
    console.log(`🌍 Geocoding destination: "${query}"`);
    
    const encoded = encodeURIComponent(query);
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${MAPBOX_TOKEN}&limit=1&types=place,locality,region`
    );

    if (!response.ok) {
      console.warn(`⚠️ Geocoding failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      console.warn(`⚠️ No geocode results for: "${query}"`);
      return null;
    }

    const feature = data.features[0];
    const [lon, lat] = feature.center;
    
    console.log(`✅ Geocoded "${query}" → lat: ${lat}, lon: ${lon}`);
    
    return {
      lat,
      lon,
      name: feature.place_name || query,
    };
  } catch (error) {
    console.error("❌ Geocoding error:", error);
    return null;
  }
}
