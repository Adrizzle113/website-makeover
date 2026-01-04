import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RENDER_API_URL = "https://travelapi-bg6t.onrender.com";
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 2000;
const REQUEST_TIMEOUT_MS = 25000;
const WARMUP_TIMEOUT_MS = 8000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing required env vars:', { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!supabaseKey 
    });
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY - enrichment disabled');
  }
  
  console.log('✅ Supabase client initialized with service role key');
  return createClient(supabaseUrl, supabaseKey);
}

interface StaticHotelData {
  hotel_id: string | number;
  name: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  star_rating: number | null;
  images: any[] | string | null;
  latitude: number | null;
  longitude: number | null;
  amenities: any[] | null;
  description: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
}

interface CacheData {
  hotel_ids: string[] | null;
  total_hotels: number;
  rates_index: Record<string, any>;
  expires_at: string;
}

// Enrich hotels with static data from hotel_dump_data (3.2M hotels)
async function enrichWithStaticData(
  hotels: any[], 
  supabase: any
): Promise<any[]> {
  if (!hotels || hotels.length === 0) return hotels;

  // Extract ALL possible IDs - prefer hid (numeric) which is the primary key in hotel_dump_data
  const numericIds: number[] = [];
  const stringIds: string[] = [];
  
  hotels.forEach(h => {
    // hid is the numeric hotel ID from RateHawk - primary lookup key
    if (h.hid) {
      const numId = typeof h.hid === 'number' ? h.hid : parseInt(String(h.hid), 10);
      if (!isNaN(numId)) numericIds.push(numId);
    }
    // Fallback to hotel_id or id
    if (h.hotel_id) stringIds.push(String(h.hotel_id));
    if (h.id && h.id !== h.hotel_id) stringIds.push(String(h.id));
  });

  console.log(`📊 Enrichment lookup: ${numericIds.length} numeric IDs, ${stringIds.length} string IDs`);
  console.log(`📊 Sample IDs - numeric: ${numericIds.slice(0, 3)}, string: ${stringIds.slice(0, 3)}`);

  if (numericIds.length === 0 && stringIds.length === 0) {
    console.log('⚠️ No valid hotel IDs to look up');
    return hotels;
  }

  try {
    let staticArray: StaticHotelData[] = [];

    // Try numeric IDs first (most likely to match hotel_dump_data)
    if (numericIds.length > 0) {
      const { data: numericData, error: numericError } = await supabase
        .from('hotel_dump_data')
        .select(`
          hotel_id,
          name,
          address,
          city,
          country,
          star_rating,
          images,
          latitude,
          longitude,
          amenities,
          description,
          check_in_time,
          check_out_time
        `)
        .in('hotel_id', numericIds);

      if (numericError) {
        console.error('❌ Numeric ID query error:', numericError.message);
      } else if (numericData && numericData.length > 0) {
        staticArray = numericData as StaticHotelData[];
        console.log(`✅ Found ${staticArray.length} hotels via numeric hid`);
      }
    }

    // If no results from numeric, try string IDs as fallback
    if (staticArray.length === 0 && stringIds.length > 0) {
      try {
        const { data: stringData, error: stringError } = await supabase
          .from('hotel_dump_data')
          .select(`
            hotel_id,
            name,
            address,
            city,
            country,
            star_rating,
            images,
            latitude,
            longitude,
            amenities,
            description,
            check_in_time,
            check_out_time
          `)
          .in('hotel_id', stringIds);

        if (!stringError && stringData && stringData.length > 0) {
          staticArray = stringData as StaticHotelData[];
          console.log(`✅ Found ${staticArray.length} hotels via string IDs`);
        }
      } catch (e) {
        console.log('⚠️ String ID query failed (type mismatch likely)');
      }
    }

    if (staticArray.length === 0) {
      console.log('⚠️ No static data found in hotel_dump_data');
      return hotels;
    }

    console.log(`✅ Total static data found: ${staticArray.length}/${hotels.length} hotels`);
    if (staticArray.length > 0) {
      const sample = staticArray[0];
      console.log(`📊 Sample static data: hotel_id=${sample.hotel_id}, name=${sample.name}, hasImages=${!!sample.images}`);
    }

    // Create lookup map - normalize keys to strings for matching
    const staticMap = new Map<string, StaticHotelData>();
    staticArray.forEach(s => {
      staticMap.set(String(s.hotel_id), s);
    });

    // Merge static data into hotels
    return hotels.map(hotel => {
      // Try multiple keys to find match
      const candidateKeys = [
        hotel.hid ? String(hotel.hid) : null,
        hotel.hotel_id ? String(hotel.hotel_id) : null,
        hotel.id ? String(hotel.id) : null,
      ].filter(Boolean) as string[];

      let staticInfo: StaticHotelData | undefined;
      for (const key of candidateKeys) {
        staticInfo = staticMap.get(key);
        if (staticInfo) break;
      }

      if (staticInfo) {
        // Parse images - handle string JSON or array
        let rawImages = staticInfo.images;
        if (typeof rawImages === 'string') {
          try {
            rawImages = JSON.parse(rawImages);
          } catch {
            rawImages = [];
          }
        }

        // Transform images - replace {size} template with 640x400 for cards
        let images: string[] = [];
        if (Array.isArray(rawImages)) {
          images = rawImages.slice(0, 5).map((img: any) => {
            let url = '';
            if (typeof img === 'string') {
              url = img;
            } else if (img.tmpl) {
              url = img.tmpl;
            } else if (img.url) {
              url = img.url;
            }
            // Replace size template
            url = url.replace('{size}', '640x400');
            // Force HTTPS
            if (url.startsWith('http://')) {
              url = url.replace('http://', 'https://');
            }
            return url;
          }).filter(Boolean);
        }

        return {
          ...hotel,
          static_data: {
            name: staticInfo.name,
            address: staticInfo.address,
            city: staticInfo.city,
            country: staticInfo.country,
            star_rating: staticInfo.star_rating,
            images,
            coordinates: {
              lat: staticInfo.latitude,
              lon: staticInfo.longitude,
            },
            amenities: staticInfo.amenities,
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestStart = Date.now();
  const supabase = getSupabaseClient();

  try {
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

    // Check cache first (for fallback)
    let cachedResult = null;
    if (regionId) {
      cachedResult = await getCachedSearch(regionId, supabase);
    }

    // Warmup server
    const warmup = await warmupServer();

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

      // If we have cached results, return them
      if (cachedResult && cachedResult.hotels.length > 0) {
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
      if (cachedResult && cachedResult.hotels.length > 0) {
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
      
      // Enrich hotels with static data
      if (responseData.hotels && Array.isArray(responseData.hotels)) {
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
