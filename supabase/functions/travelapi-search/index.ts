// Redeploy trigger - 2026-01-07T18:15:00 - FIX HID TYPE SAFETY + CACHE BYPASS
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
const REQUEST_TIMEOUT_MS = 12000;  // Reduced from 20000
const WARMUP_TIMEOUT_MS = 3000;    // Reduced from 5000

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================
// Request deduplication - prevent duplicate concurrent requests
// ============================================
const inFlightRequests = new Map<string, Promise<Response>>();

function getRequestKey(body: any): string {
  return `${body.regionId || body.region_id}-${body.checkin}-${body.checkout}-${body.guests?.length || 0}`;
}

// ============================================
// Response cache - 5 minute TTL
// ============================================
const responseCache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedResponse(key: string): any | null {
  const cached = responseCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    console.log(`✅ Cache hit for: ${key}`);
    return cached.data;
  }
  return null;
}

function setCachedResponse(key: string, data: any): void {
  responseCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  // Clean old entries if cache gets too big
  if (responseCache.size > 100) {
    const now = Date.now();
    for (const [k, v] of responseCache) {
      if (v.expiresAt < now) responseCache.delete(k);
    }
  }
}

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
  hid: number;
  name: string | null;
  address: string | null;
  region_id: number | null;
  region_name: string | null;
  region_type: string | null;
  country_code: string | null;
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
// Skip enrichment for large result sets
// ============================================
async function enrichWithStaticData(hotels: any[], supabase: any): Promise<any[]> {
  console.log(`🔍 enrichWithStaticData called with ${hotels?.length || 0} hotels`);
  
  // Skip enrichment for large result sets to avoid resource exhaustion
  if (!hotels || hotels.length === 0) {
    console.log("⚠️ No hotels to enrich");
    return hotels;
  }
  if (!supabase) {
    console.log("⚠️ No Supabase client - skipping enrichment");
    return hotels;
  }
  if (hotels.length > 200) {
    console.log(`⚠️ Skipping enrichment: ${hotels.length} hotels exceeds limit of 200`);
    return hotels;
  }

  // Extract numeric hid from API response
  const numericHids: number[] = [];

  hotels.forEach((h) => {
    if (h.hid) {
      const numId = typeof h.hid === "number" ? h.hid : parseInt(String(h.hid), 10);
      if (!isNaN(numId)) numericHids.push(numId);
    }
  });

  console.log(`📊 Enrichment: ${numericHids.length} hotels have hid`);
  if (numericHids.length > 0) {
    console.log(`📊 Sample hids: [${numericHids.slice(0, 5).join(', ')}]`);
  }

  if (numericHids.length === 0) {
    console.log("⚠️ No valid hid values found in API response");
    return hotels;
  }

  try {
    console.log(`🔍 Querying hotels_static.hid with ${numericHids.length} IDs...`);

    const { data: staticData, error } = await supabase
      .from("hotels_static")
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
      .in("hid", numericHids);

    if (error) {
      console.error("❌ Database query error:", error.message);
      return hotels;
    }

    const staticArray = staticData as HotelsStaticRow[] | null;

    console.log(`🗄️ Database returned ${staticArray?.length || 0} matching rows`);

    if (!staticArray || staticArray.length === 0) {
      console.log("⚠️ No matching hotels found in hotels_static - hids may not exist in database");
      return hotels;
    }

    console.log(`✅ Found ${staticArray.length}/${numericHids.length} hotels in hotels_static`);
    if (staticArray.length > 0) {
      console.log(`✅ Sample match: hid=${staticArray[0].hid}, region=${staticArray[0].region_name}, country=${staticArray[0].country_code}`);
    }

    // Create lookup map by hid - USE STRING KEYS to prevent type mismatch
    const staticMap = new Map<string, HotelsStaticRow>();
    staticArray.forEach((s) => {
      if (s.hid !== null && s.hid !== undefined) {
        staticMap.set(String(s.hid), s);  // Convert to string key
      }
    });

    // Merge static data into hotels
    let enrichedCount = 0;
    const enrichedHotels = hotels.map((hotel) => {
      if (!hotel.hid) return hotel;

      const hotelHidKey = String(hotel.hid);  // Convert to string for lookup
      const staticInfo = staticMap.get(hotelHidKey);

      if (staticInfo) {
        enrichedCount++;
        return {
          ...hotel,
          static_data: {
            name: staticInfo.name,
            address: staticInfo.address,
            city: staticInfo.region_name,
            country: staticInfo.country_code,
            star_rating: staticInfo.star_rating,
            images: [],
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

// ============================================
// Main handler - processes search requests
// ============================================
async function handleSearchRequest(req: Request, requestBody: any, requestKey: string, bypassCache: boolean = false, debugMode: boolean = false): Promise<Response> {
  const requestStart = Date.now();
  const supabase = getSupabaseClient();

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
      await warmupPromise;
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

    // Enrichment: Query hotels_static by hid
    if (responseData.hotels && Array.isArray(responseData.hotels) && supabase) {
      console.log(`🏨 Enriching ${responseData.hotels.length} hotels from hotels_static...`);
      responseData.hotels = await enrichWithStaticData(responseData.hotels, supabase);
      
      // Fallback: If enrichment didn't add static_data, use destination as city
      const destination = requestBody.destination || "";
      const destinationCity = destination.split(',')[0]?.trim() || "";
      responseData.hotels = responseData.hotels.map((hotel: any) => {
        if (!hotel.static_data && destinationCity) {
          return {
            ...hotel,
            static_data: {
              city: destinationCity,
              country: "",
              star_rating: hotel.rating || 0,
            },
          };
        }
        return hotel;
      });
    }

    // Cache successful response (unless bypassed)
    if (!bypassCache) {
      setCachedResponse(requestKey, responseData);
    }

    // Add debug info if requested
    if (debugMode) {
      const hotelsWithHid = responseData.hotels?.filter((h: any) => h.hid)?.length || 0;
      const enrichedCount = responseData.hotels?.filter((h: any) => h.static_data)?.length || 0;
      responseData._debug = {
        cache: { bypassed: bypassCache },
        enrichment: {
          totalHotels: responseData.hotels?.length || 0,
          hotelsWithHid,
          enrichedCount,
          sampleHids: responseData.hotels?.slice(0, 3).map((h: any) => ({ hid: h.hid, type: typeof h.hid })) || [],
        },
      };
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
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
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

    const requestKey = getRequestKey(requestBody);
    const bypassCache = requestBody.noCache === true;
    const debugMode = requestBody.debug === true;

    // Check cache first - return immediately if hit (unless bypassed)
    if (!bypassCache) {
      const cachedData = getCachedResponse(requestKey);
      if (cachedData) {
        return new Response(JSON.stringify(cachedData), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      console.log("🔓 Cache bypassed (noCache=true)");
    }

    // Check for in-flight duplicate request - share the promise
    const existingRequest = inFlightRequests.get(requestKey);
    if (existingRequest) {
      console.log(`🔄 Deduplicating request: ${requestKey}`);
      return existingRequest;
    }

    // Create and track request promise
    const requestPromise = handleSearchRequest(req, requestBody, requestKey, bypassCache, debugMode);
    inFlightRequests.set(requestKey, requestPromise);

    try {
      return await requestPromise;
    } finally {
      inFlightRequests.delete(requestKey);
    }
  } catch (error) {
    console.error("💥 Edge function error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
