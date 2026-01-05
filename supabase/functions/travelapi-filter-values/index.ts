import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface FilterValueItem {
  value: string;
  desc: string;
}

interface RateHawkFilterValuesResponse {
  data: {
    countries: FilterValueItem[];
    languages: FilterValueItem[];
    serp_filters: FilterValueItem[];
    hotel_kinds: FilterValueItem[];
  };
  status: string;
}

// Simple in-memory cache with 24h TTL
let cachedData: {
  data: {
    countries: FilterValueItem[];
    languages: FilterValueItem[];
    serpFilters: FilterValueItem[];
    hotelKinds: FilterValueItem[];
    starRatings: number[];
  };
  expiresAt: number;
} | null = null;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Health check endpoint
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ ok: true, name: "travelapi-filter-values" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log("📋 Filter values request received");

    // Check cache first
    if (cachedData && cachedData.expiresAt > Date.now()) {
      console.log("✅ Returning cached filter values");
      return new Response(
        JSON.stringify({
          success: true,
          data: cachedData.data,
          cached: true,
          expiresAt: new Date(cachedData.expiresAt).toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch from RateHawk API
    const apiKeyId = Deno.env.get("RATEHAWK_API_KEY_ID");
    const apiKey = Deno.env.get("RATEHAWK_API_KEY");

    if (!apiKeyId || !apiKey) {
      console.error("❌ Missing RateHawk API credentials");
      // Return default values if no credentials
      const defaultData = {
        countries: [
          { value: "US", desc: "United States" },
          { value: "GB", desc: "United Kingdom" },
          { value: "DE", desc: "Germany" },
          { value: "FR", desc: "France" },
          { value: "ES", desc: "Spain" },
          { value: "IT", desc: "Italy" },
          { value: "AU", desc: "Australia" },
          { value: "CA", desc: "Canada" },
          { value: "AE", desc: "United Arab Emirates" },
          { value: "SA", desc: "Saudi Arabia" },
        ],
        languages: [{ value: "en", desc: "English" }],
        serpFilters: [
          { value: "has_wifi", desc: "Wi-Fi" },
          { value: "has_internet", desc: "Internet" },
          { value: "has_parking", desc: "Parking" },
          { value: "has_pool", desc: "Pool" },
          { value: "has_fitness", desc: "Fitness" },
          { value: "has_spa", desc: "Spa" },
          { value: "has_meal_breakfast", desc: "Breakfast" },
          { value: "is_pet_friendly", desc: "Pet Friendly" },
          { value: "has_airport_transfer", desc: "Airport Transfer" },
        ],
        hotelKinds: [
          { value: "Hotel", desc: "Hotel" },
          { value: "Apart-hotel", desc: "Apart-Hotel" },
          { value: "Guesthouse", desc: "Guesthouse" },
          { value: "Hostel", desc: "Hostel" },
          { value: "Resort", desc: "Resort" },
          { value: "Villa", desc: "Villa" },
          { value: "Apartment", desc: "Apartment" },
          { value: "Motel", desc: "Motel" },
          { value: "B&B", desc: "Bed & Breakfast" },
        ],
        starRatings: [1, 2, 3, 4, 5],
      };

      return new Response(
        JSON.stringify({
          success: true,
          data: defaultData,
          cached: false,
          fallback: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = btoa(`${apiKeyId}:${apiKey}`);
    
    console.log("🔍 Fetching filter values from RateHawk API");
    const response = await fetch(
      "https://api.worldota.net/api/content/v1/filter_values",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${authHeader}`,
        },
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      console.error(`❌ RateHawk API error: ${response.status}`);
      throw new Error(`API error: ${response.status}`);
    }

    const result: RateHawkFilterValuesResponse = await response.json();
    console.log("✅ RateHawk filter values received");
    console.log(`   Countries: ${result.data.countries?.length || 0}`);
    console.log(`   Languages: ${result.data.languages?.length || 0}`);
    console.log(`   SERP Filters: ${result.data.serp_filters?.length || 0}`);
    console.log(`   Hotel Kinds: ${result.data.hotel_kinds?.length || 0}`);

    // Transform and cache the data
    const transformedData = {
      countries: result.data.countries || [],
      languages: result.data.languages || [],
      serpFilters: result.data.serp_filters || [],
      hotelKinds: result.data.hotel_kinds || [],
      starRatings: [1, 2, 3, 4, 5],
    };

    // Cache for 24 hours
    cachedData = {
      data: transformedData,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: transformedData,
        cached: false,
        expiresAt: new Date(cachedData.expiresAt).toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error fetching filter values:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
