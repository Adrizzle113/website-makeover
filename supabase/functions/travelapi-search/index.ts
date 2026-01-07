// Redeploy trigger - 2026-01-07 - FIXED FOR ACTUAL SCHEMA
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const RENDER_API_URL = "https://travelapi-bg6t.onrender.com";
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 2000;
const REQUEST_TIMEOUT_MS = 20000;
const WARMUP_TIMEOUT_MS = 5000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Initialize Supabase client - returns null if env vars missing (graceful degradation)
function getSupabaseClient(): ReturnType<typeof createClient> | null {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ Missing Supabase env vars - enrichment/cache disabled');
      return null;
    }
    
    return createClient(supabaseUrl, supabaseKey);
  } catch (e) {
    console.warn('⚠️ Failed to init Supabase client:', e);
    return null;
  }
}

// ============================================
// FIXED: Interface matches ACTUAL table schema
// ============================================
interface HotelDumpRow {
  id: number;              // bigint row ID
  hid: number;             // bigint - RateHawk hotel ID (primary lookup key)
  name: string | null;
  address: string | null;
  region_id: number | null;
  region_name: string | null;  // This is the CITY
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

interface CacheData {
  hotel_ids: string[] | null;
  total_hotels: number;
  rates_index: Record<string, any>;
  expires_at: string;
}

// ============================================
// FIXED: Enrich hotels using ACTUAL table columns
// ============================================
async function enrichWithStaticData(
  hotels: any[], 
  supabase: any
): Promise<any[]> {
  if (!hotels || hotels.length === 0) return hotels;
  if (!supabase) return hotels;

  // Extract numeric hotel IDs (hid) from API response
  const numericIds: number[] = [];
  
  hotels.forEach(h => {
    // The API returns 'hid' as the numeric hotel ID
    if (h.hid) {
      const numId = typeof h.hid === 'number' ? h.hid : parseInt(String(h.hid), 10);
      if (!isNaN(numId)) numericIds.push(numId);
    }
  });

  console.log(`📊 Enrichment lookup: ${numericIds.length} hotel IDs`);
  console.log(`📊 Sample IDs: ${numericIds.slice(0, 5).join(', ')}`);

  if (numericIds.length === 0) {
    console.log('⚠️ No valid hotel IDs (hid) to look up');
    return hotels;
  }

  try {
    // ============================================
    // FIXED: Query YOUR actual columns
    // ============================================
    console.log(`🔍 Querying hotel_dump_data.hid with ${numericIds.length} IDs...`);
    
    const { data: staticData, error } = await supabase
      .from('hotel_dump_data')
      .select(`
        id,
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
      `)
      .in('hid', numericIds);

    if (error) {
      console.error('❌ Database query error:', error.message);
      return hotels;
    }

    const staticArray = staticData as HotelDumpRow[] | null;
    
    if (!staticArray || staticArray.length === 0) {
      console.log('⚠️ No static data found in hotel_dump_data');
      return hotels;
    }

    console.log(`✅ Found ${staticArray.length}/${numericIds.length} hotels in database`);
    
    // Log sample for debugging
    if (staticArray.length > 0) {
      const sample = staticArray[0];
      console.log(`📊 Sample: hid=${sample.hid}, name="${sample.name}", city="${sample.region_name}", country="${sample.country_code}"`);
    }

    // Create lookup map by hid (numeric hotel ID)
    const staticMap = new Map<number, HotelDumpRow>();
    staticArray.forEach(s => {
      if (s.hid) staticMap.set(s.hid, s);
    });

    // Merge static data into hotels
    return hotels.map(hotel => {
      const hotelHid = typeof hotel.hid === 'number' ? hotel.hid : parseInt(String(hotel.hid), 10);
      const staticInfo = staticMap.get(hotelHid);

      if (staticInfo) {
        // ============================================
        // FIXED: Map YOUR columns to expected format
        // ============================================
        return {
          ...hotel,
          static_data: {
            name: staticInfo.name,
            address: staticInfo.address,
            city: staticInfo.region_name,        // YOUR column → expected name
            country: staticInfo.country_code,    // YOUR column → expected name
            star_rating: staticInfo.star_rating,
            images: [],                          // No images in your table (will need API)
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
  } catch (error) {
    console.error('❌ Error enriching with static data:', error);
    return hotels;
  }
}

// Check search_cache for valid cached results
async function getCachedSearch(
  regionId: number,
  supabase: any
): Promise<{ hotels: any[]; total: number; fromCache: boolean } | null> {
  try {
    console.log(`🔍 Checking cache for region_id: ${regionId}`);

    const { data, error } = await supabase
      .from('search_cache')
      .select('hotel_ids, total_hotels, rates_index, expires_at')
      .eq('region_id', regionId)
      .order('cached_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.log('📭 No cache found');
      return null;
    }

    const cacheData = data as CacheData;

    // Check if cache is expired
    const expiresAt = new Date(cacheData.expires_at);
    const isExpired = expiresAt < new Date();
    
    if (isExpired) {
      console.log('⏰ Cache expired, will try live search');
    }

    const hotelIds = cacheData.hotel_ids || [];
    const ratesIndex = cacheData.rates_index || {};

    console.log(`📦 Cache has ${hotelIds.length} hotels (expired: ${isExpired})`);

    // Reconstruct minimal hotel objects from cache
    const hotels = hotelIds.map((id: string) => {
      const rateInfo = ratesIndex[id] || {};
      return {
        hotel_id: id,
        id: id,
        rates: rateInfo.rates || [],
        price: rateInfo.price,
      };
    });

    return {
      hotels,
      total: cacheData.total_hotels,
      fromCache: true,
    };
  } catch (error) {
    console.error('❌ Cache lookup error:', error);
    return null;
  }
}

async function warmupServer(): Promise<{ ok: boolean; status: number }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WARMUP_TIMEOUT_MS);

  try {
    console.log('🔥 Warming up Render server...');
    const response = await fetch(`${RENDER_API_URL}/api/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const isHealthy = response.ok;
    console.log(`${isHealthy ? '✅' : '❌'} Health check: ${response.status}`);
    return { ok: isHealthy, status: response.status };
  } catch (error) {
    clearTimeout(timeoutId);
    const message = error instanceof Error ? error.message : String(error);
    console.warn('⚠️ Warmup failed:', message);
    return { ok: false, status: 0 };
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number
): Promise<{ response: Response | null; attempts: number; lastStatus: number }> {
  let lastStatus = 0;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries}: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      lastStatus = response.status;
      
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return { response, attempts: attempt, lastStatus };
      }

      if (attempt < maxRetries) {
        console.log(`⚠️ Server error ${response.status}, will retry...`);
        const waitTime = RETRY_DELAY_MS * attempt;
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await delay(waitTime);
        continue;
      }

      console.log(`💥 Server error ${response.status} on final attempt`);
      return { response, attempts: attempt, lastStatus };
      
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ Attempt ${attempt} failed:`, message);
      
      if (attempt < maxRetries) {
        const waitTime = RETRY_DELAY_MS * attempt;
        await delay(waitTime);
      }
    }
  }
  
  return { response: null, attempts: maxRetries, lastStatus };
}

serve(async (req) => {
  // Always handle OPTIONS with CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const requestStart = Date.now();

  try {
    // Initialize supabase inside try block - null means degraded mode (no cache/enrichment)
    const supabase = getSupabaseClient();
    
    const bodyText = await req.text();
    console.log(`📥 Request body length: ${bodyText.length} chars`);

    if (!bodyText || bodyText.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Empty request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let requestBody;
    try {
      requestBody = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('❌ JSON parse error');
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📋 Payload keys:', Object.keys(requestBody));
    console.log('📍 destination:', requestBody.destination);
    const regionId = requestBody.regionId ?? requestBody.region_id;
    console.log('🆔 regionId:', regionId);
    console.log('👤 userId:', requestBody.userId);

    if (!requestBody.destination && !regionId) {
      return new Response(
        JSON.stringify({ error: 'destination or regionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check cache first (for fallback) - only if supabase available
    let cachedResult = null;
    if (regionId && supabase) {
      cachedResult = await getCachedSearch(regionId, supabase);
    }

    // Fire warmup in background (non-blocking) to avoid pushing request over time limit
    const warmupPromise = warmupServer();
    let warmup = { ok: false, status: 0 };

    // Call Render API with retry
    const { response: renderResponse, attempts, lastStatus } = await fetchWithRetry(
      `${RENDER_API_URL}/api/ratehawk/search`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      },
      MAX_RETRIES
    );

    const duration = Date.now() - requestStart;

    // All retries failed - try cache fallback
    if (!renderResponse) {
      console.error('💥 All retries failed');

      // Check warmup result for error message
      try { warmup = await warmupPromise; } catch { /* ignore */ }
      
      // If we have cached results, return them
      if (cachedResult && cachedResult.hotels.length > 0 && supabase) {
        console.log('📦 Returning cached results as fallback');
        
        // Enrich with static data
        const enrichedHotels = await enrichWithStaticData(cachedResult.hotels, supabase);

        return new Response(
          JSON.stringify({
            success: true,
            hotels: enrichedHotels,
            total: cachedResult.total,
            hasMore: false,
            page: 1,
            fromCache: true,
            cacheWarning: 'Results from cache - live search unavailable',
            duration_ms: duration,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          error: 'Service temporarily unavailable. Please try again in 30 seconds.',
          details: warmup.ok 
            ? 'Backend is online but search endpoint is not responding'
            : 'Backend server is waking up',
          wasWarm: warmup.ok,
          warmupStatus: warmup.status,
          attempts,
          lastStatus,
          duration_ms: duration,
          hotels: [],
          totalHotels: 0,
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const responseText = await renderResponse.text();
    console.log(`📨 Render response: ${renderResponse.status} (${duration}ms)`);
    console.log(`📨 Response preview: ${responseText.substring(0, 200)}`);

    // Handle "Destination not found"
    if (responseText.includes('Destination not found')) {
      const destination = String((requestBody as any).destination ?? "");
      return new Response(
        JSON.stringify({
          error: `"${destination}" is not available for search. Try a major city nearby.`,
          hotels: [],
          totalHotels: 0,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle server errors - try cache fallback
    if (renderResponse.status >= 500) {
      // Check warmup result for error message
      try { warmup = await warmupPromise; } catch { /* ignore */ }
      
      if (cachedResult && cachedResult.hotels.length > 0 && supabase) {
        console.log('📦 Server error - returning cached results');
        
        const enrichedHotels = await enrichWithStaticData(cachedResult.hotels, supabase);

        return new Response(
          JSON.stringify({
            success: true,
            hotels: enrichedHotels,
            total: cachedResult.total,
            hasMore: false,
            page: 1,
            fromCache: true,
            cacheWarning: 'Results from cache - live search had errors',
            duration_ms: duration,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let upstreamDetails: string | null = null;
      try {
        const maybeJson = JSON.parse(responseText);
        if (maybeJson && typeof maybeJson === "object") {
          upstreamDetails =
            (maybeJson as any).error ||
            (maybeJson as any).message ||
            (maybeJson as any).details ||
            null;
        }
      } catch {
        // not JSON
      }

      const upstreamPreview = (upstreamDetails || responseText || "").toString().slice(0, 1500);

      return new Response(
        JSON.stringify({
          error: "Backend service error. Please try again.",
          details: upstreamPreview || "Upstream returned a 5xx without a body",
          upstream_status: renderResponse.status,
          attempts,
          lastStatus: renderResponse.status,
          duration_ms: duration,
          wasWarm: warmup.ok,
          warmupStatus: warmup.status,
          hotels: [],
          totalHotels: 0,
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Success - parse and enrich response
    try {
      const responseData = JSON.parse(responseText);
      
      // Enrich hotels with static data (only if supabase available)
      if (responseData.hotels && Array.isArray(responseData.hotels) && supabase) {
        responseData.hotels = await enrichWithStaticData(responseData.hotels, supabase);
        console.log(`✅ Enriched ${responseData.hotels.length} hotels with static data`);
      }

      return new Response(JSON.stringify(responseData), {
        status: renderResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch {
      // If parse fails, return original response
      return new Response(responseText, {
        status: renderResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    const duration = Date.now() - requestStart;
    console.error('💥 Edge function error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({
        error: 'Internal error',
        message,
        duration_ms: duration,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
