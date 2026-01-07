// Redeploy trigger - 2026-01-07 - FIXED: Query hotels_static by hid
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const RENDER_API_URL = "https://travelapi-bg6t.onrender.com";
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 2000;
const REQUEST_TIMEOUT_MS = 20000;
const WARMUP_TIMEOUT_MS = 5000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getSupabaseClient(): ReturnType<typeof createClient> | null {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      console.warn("⚠️ Missing Supabase env vars");
      return null;
    }
    return createClient(supabaseUrl, supabaseKey);
  } catch (e) {
    console.warn("⚠️ Failed to init Supabase client:", e);
    return null;
  }
}

// ============================================
// CORRECT: hotels_static table schema
// ============================================
interface HotelsStaticRow {
  id: number;
  hid: number; // RateHawk numeric hotel ID - THE KEY!
  name: string | null;
  address: string | null;
  region_id: number | null;
  region_name: string | null; // This is the CITY
  region_type: string | null;
  country_code: string | null; // This is the COUNTRY
  latitude: number | null;
  longitude: number | null;
  star_rating: number | null;
  check_in_time: string | null;
  check_out_time: string | null;
  amenities: string[] | null;
  description: string | null;
}

// ============================================
// FIXED: Query hotels_static by hid (numeric)
// ============================================
async function enrichWithStaticData(hotels: any[], supabase: any): Promise<any[]> {
  if (!hotels || hotels.length === 0) return hotels;
  if (!supabase) return hotels;

  // Extract numeric hid from API response
  const numericHids: number[] = [];

  hotels.forEach((h) => {
    // API returns hid as numeric ID
    if (h.hid) {
      const numId = typeof h.hid === "number" ? h.hid : parseInt(String(h.hid), 10);
      if (!isNaN(numId)) numericHids.push(numId);
    }
  });

  console.log(`📊 Enrichment: ${numericHids.length} hotels have hid`);
  console.log(`📊 Sample hids: ${numericHids.slice(0, 5).join(", ")}`);

  if (numericHids.length === 0) {
    console.log("⚠️ No valid hid values found in API response");
    return hotels;
  }

  try {
    // ============================================
    // CORRECT: Query hotels_static by hid
    // ============================================
    console.log(`🔍 Querying hotels_static.hid with ${numericHids.length} IDs...`);

    const { data: staticData, error } = await supabase
      .from("hotels_static") // CORRECT TABLE!
      .select(
        `
        hid,
        name,
        address,
        region_name,
        country_code,
        star_rating,
        latitude,
        longitude,
        amenities,
        description,
        check_in_time,
        check_out_time
      `,
      )
      .in("hid", numericHids); // CORRECT KEY!

    if (error) {
      console.error("❌ Database query error:", error.message);
      return hotels;
    }

    const staticArray = staticData as HotelsStaticRow[] | null;

    if (!staticArray || staticArray.length === 0) {
      console.log("⚠️ No matching hotels found in hotels_static");
      console.log("⚠️ Sample hids searched:", numericHids.slice(0, 5));
      return hotels;
    }

    console.log(`✅ Found ${staticArray.length}/${numericHids.length} hotels in hotels_static`);

    // Log sample for debugging
    if (staticArray.length > 0) {
      const sample = staticArray[0];
      console.log(
        `📊 Sample: hid=${sample.hid}, name="${sample.name}", city="${sample.region_name}", country="${sample.country_code}"`,
      );
    }

    // Create lookup map by hid
    const staticMap = new Map<number, HotelsStaticRow>();
    staticArray.forEach((s) => {
      if (s.hid) staticMap.set(s.hid, s);
    });

    // Merge static data into hotels
    let enrichedCount = 0;
    const enrichedHotels = hotels.map((hotel) => {
      if (!hotel.hid) return hotel;

      const hotelHid = typeof hotel.hid === "number" ? hotel.hid : parseInt(String(hotel.hid), 10);
      const staticInfo = staticMap.get(hotelHid);

      if (staticInfo) {
        enrichedCount++;
        return {
          ...hotel,
          static_data: {
            name: staticInfo.name,
            address: staticInfo.address,
            city: staticInfo.region_name, // region_name → city
            country: staticInfo.country_code, // country_code → country
            star_rating: staticInfo.star_rating,
            images: [], // No images in this table
            coordinates: {
              lat: staticInfo.latitude,
              lon: staticInfo.longitude,
            },
            amenities: staticInfo.amenities || [],
            description: staticInfo.description,
            check_in_time: staticInfo.check_in_time,
            check_out_time: staticInfo.check_out_time,
          },
        };
      }

      return hotel;
    });

    console.log(`✅ Enriched ${enrichedCount}/${hotels.length} hotels with static_data`);
    return enrichedHotels;
  } catch (error) {
    console.error("❌ Error enriching with static data:", error);
    return hotels;
  }
}

async function warmupServer(): Promise<{ ok: boolean; status: number }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WARMUP_TIMEOUT_MS);
    const response = await fetch(`${RENDER_API_URL}/api/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return { ok: response.ok, status: response.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number,
): Promise<{ response: Response | null; attempts: number; lastStatus: number }> {
  let lastStatus = 0;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      lastStatus = response.status;

      if (response.ok || response.status < 500) {
        return { response, attempts: attempt, lastStatus };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ Attempt ${attempt} failed:`, message);

      if (attempt < maxRetries) {
        await delay(RETRY_DELAY_MS * attempt);
      }
    }
  }

  return { response: null, attempts: maxRetries, lastStatus };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const requestStart = Date.now();

  try {
    const supabase = getSupabaseClient();
    const bodyText = await req.text();

    if (!bodyText || bodyText.length === 0) {
      return new Response(JSON.stringify({ error: "Empty request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let requestBody;
    try {
      requestBody = JSON.parse(bodyText);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("📍 destination:", requestBody.destination);
    const regionId = requestBody.regionId ?? requestBody.region_id;
    console.log("🆔 regionId:", regionId);

    if (!requestBody.destination && !regionId) {
      return new Response(JSON.stringify({ error: "destination or regionId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const warmupPromise = warmupServer();
    let warmup = { ok: false, status: 0 };

    const {
      response: renderResponse,
      attempts,
      lastStatus,
    } = await fetchWithRetry(
      `${RENDER_API_URL}/api/ratehawk/search`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      },
      MAX_RETRIES,
    );

    const duration = Date.now() - requestStart;

    if (!renderResponse) {
      try {
        warmup = await warmupPromise;
      } catch {
        /* ignore */
      }
      return new Response(
        JSON.stringify({
          error: "Service temporarily unavailable",
          hotels: [],
          totalHotels: 0,
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const responseText = await renderResponse.text();
    console.log(`📨 Render response: ${renderResponse.status} (${duration}ms)`);

    if (responseText.includes("Could not find region") || responseText.includes("Destination not found")) {
      return new Response(
        JSON.stringify({
          error: "Destination not available",
          hotels: [],
          totalHotels: 0,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (renderResponse.status >= 500) {
      return new Response(
        JSON.stringify({
          error: "Backend service error",
          hotels: [],
          totalHotels: 0,
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    try {
      const responseData = JSON.parse(responseText);

      // ============================================
      // ENRICHMENT: Query hotels_static by hid
      // ============================================
      if (responseData.hotels && Array.isArray(responseData.hotels) && supabase) {
        console.log(`🏨 Enriching ${responseData.hotels.length} hotels from hotels_static...`);
        responseData.hotels = await enrichWithStaticData(responseData.hotels, supabase);
      }

      return new Response(JSON.stringify(responseData), {
        status: renderResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      return new Response(responseText, {
        status: renderResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("💥 Edge function error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
