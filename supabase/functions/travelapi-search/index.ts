import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RENDER_API_URL = "https://travelapi-bg6t.onrender.com";

// Supabase client for querying static data
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Enrich hotels with static data from hotel_dump_data table
async function enrichWithStaticData(hotels: any[]): Promise<any[]> {
  if (!hotels || hotels.length === 0) return hotels;

  // Extract hotel IDs
  const hotelIds = hotels.map(h => h.hotel_id || h.id).filter(Boolean);
  console.log(`🔍 Enriching ${hotelIds.length} hotels with static data`);

  try {
    // Query hotel_dump_data for static info (images, address, rating)
    const { data: staticData, error } = await supabase
      .from('hotel_dump_data')
      .select('hotel_id, name, address, city, country, star_rating, images, latitude, longitude, amenities')
      .in('hotel_id', hotelIds);

    if (error) {
      console.error('❌ Static data query failed:', error.message);
      return hotels;
    }

    if (!staticData || staticData.length === 0) {
      console.log('⚠️ No static data found for these hotels');
      return hotels;
    }

    console.log(`✅ Found static data for ${staticData.length}/${hotelIds.length} hotels`);

    // Create lookup map
    const staticMap = new Map(staticData.map(s => [s.hotel_id, s]));

    // Merge static data into hotels
    return hotels.map(hotel => {
      const hotelId = hotel.hotel_id || hotel.id;
      const staticInfo = staticMap.get(hotelId);

      if (!staticInfo) return hotel;

      // Process images - convert template URLs to usable URLs
      let images: any[] = [];
      if (staticInfo.images && Array.isArray(staticInfo.images)) {
        images = staticInfo.images.slice(0, 10).map((img: any) => {
          if (typeof img === 'string') {
            return { url: img.replace('{size}', '640x400'), alt: staticInfo.name || hotelId };
          }
          if (img.tmpl) {
            return { url: img.tmpl.replace('{size}', '640x400'), alt: staticInfo.name || hotelId };
          }
          return img;
        });
      }

      // Merge static data
      return {
        ...hotel,
        static_data: {
          name: staticInfo.name,
          address: staticInfo.address,
          city: staticInfo.city,
          country: staticInfo.country,
          star_rating: staticInfo.star_rating,
          images,
          mainImage: images[0]?.url || null,
          latitude: staticInfo.latitude,
          longitude: staticInfo.longitude,
          amenities: staticInfo.amenities || [],
        },
      };
    });
  } catch (err) {
    console.error('❌ Static enrichment error:', err);
    return hotels;
  }
}
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 3000;
const REQUEST_TIMEOUT_MS = 90000; // 90 seconds - Render backend can take 60+ seconds on cold start
const WARMUP_TIMEOUT_MS = 15000; // 15 seconds for warmup
// Helper to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Warmup function - pings health endpoint to wake up Render
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

// Retry with linear backoff (simpler, faster feedback)
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
      
      // Success or client error (4xx) - don't retry
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return { response, attempts: attempt, lastStatus };
      }

      // Server error
      if (attempt < maxRetries) {
        console.log(`⚠️ Server error ${response.status}, will retry...`);
        const waitTime = RETRY_DELAY_MS * attempt;
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await delay(waitTime);
        continue;
      }

      // Final attempt: return the response so we can surface upstream details
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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestStart = Date.now();

  try {
    // Parse request body
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
    console.log('🆔 regionId:', requestBody.regionId ?? requestBody.region_id);
    console.log('👤 userId:', requestBody.userId);

    // Validate - destination is required
    if (!requestBody.destination && !requestBody.regionId && !requestBody.region_id) {
      return new Response(
        JSON.stringify({ error: 'destination or regionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Warmup server first
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

    // All retries failed
    if (!renderResponse) {
      console.error('💥 All retries failed');
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

    // Handle "Destination not found" as client error (even if upstream mistakenly returns 5xx)
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

    // Handle server errors after retries succeeded but got error
    if (renderResponse.status >= 500) {
      // Try to surface upstream error details to the client for debugging
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

    // Parse and enrich response with static data
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      // Not JSON, return as-is
      return new Response(responseText, {
        status: renderResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Enrich hotels with static data
    if (responseData.hotels && Array.isArray(responseData.hotels)) {
      responseData.hotels = await enrichWithStaticData(responseData.hotels);
      console.log(`✅ Enriched response with static data`);
    }

    // Return enriched response
    return new Response(JSON.stringify(responseData), {
      status: renderResponse.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

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
