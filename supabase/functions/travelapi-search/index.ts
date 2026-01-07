// Redeploy trigger - 2026-01-07 - FIXED V3 for hotels_static table
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

// Initialize Supabase client
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
// CORRECT: hotels_static table schema
// ============================================
interface HotelsStaticRow {
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
// Enrich hotels from hotels_static table
// ============================================
async function enrichWithStaticData(
  hotels: any[], 
  supabase: any
): Promise<any[]> {
  if (!hotels || hotels.length === 0) return hotels;
  if (!supabase) return hotels;

  const numericHids: number[] = [];
  
  hotels.forEach(h => {
    if (h.hid) {
      const numId = typeof h.hid === 'number' ? h.hid : parseInt(String(h.hid), 10);
      if (!isNaN(numId)) numericHids.push(numId);
    }
  });

  console.log(`📊 Enrichment lookup: ${numericHids.length} hotel hids`);
  console.log(`📊 Sample hids: ${numericHids.slice(0, 5).join(', ')}`);

  if (numericHids.length === 0) {
    console.log('⚠️ No valid hid values found in API response');
    return hotels;
  }

  try {
    console.log(`🔍 Querying hotels_static.hid with ${numericHids.length} IDs...`);
    
    const { data: staticData, error } = await supabase
      .from('hotels_static')
      .select(`
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
      .in('hid', numericHids);

    if (error) {
      console.error('❌ Database query error:', error.message);
      return hotels;
    }

    const staticArray = staticData as HotelsStaticRow[] | null;
    
    if (!staticArray || staticArray.length === 0) {
      console.log('⚠️ No static data found in hotels_static');
      console.log('⚠️ Sample hids searched:', numericHids.slice(0, 5));
      return hotels;
    }

    console.log(`✅ Found ${staticArray.length}/${numericHids.length} hotels in database`);
    
    if (staticArray.length > 0) {
      const sample = staticArray[0];
      console.log(`📊 Sample: hid=${sample.hid}, name="${sample.name}", city="${sample.region_name}", country="${sample.country_code}"`);
    }

    const staticMap = new Map<number, HotelsStaticRow>();
    staticArray.forEach(s => {
      if (s.hid) staticMap.set(s.hid, s);
    });

    return hotels.map(hotel => {
      if (!hotel.hid) return hotel;
      
      const hotelHid = typeof hotel.hid === 'number' ? hotel.hid : parseInt(String(hotel.hid), 10);
      const staticInfo = staticMap.get(hotelHid);

      if (staticInfo) {
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
  } catch (error) {
    console.error('❌ Error enriching with static data:', error);
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
  maxRetries: number
): Promise<{ response: Response | null; attempts: number; lastStatus: number }> {
  let lastStatus = 0;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries} - ${url}`);
      
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
      
      console.warn(`⚠️ Attempt ${attempt} returned ${response.status}`);
      
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
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const requestStart = Date.now();

  try {
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

    if (!requestBody.destination && !regionId) {
      return new Response(
        JSON.stringify({ error: 'destination or regionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const warmupPromise = warmupServer();
    let warmup = { ok: false, status: 0 };

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

    if (!renderResponse) {
      console.error('💥 All retries failed');
      try { warmup = await warmupPromise; } catch { /* ignore */ }

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
    console.log(`📨 Response preview: ${responseText.substring(0, 300)}`);

    if (responseText.includes('Could not find region') || responseText.includes('Destination not found')) {
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

    if (renderResponse.status >= 500) {
      try { warmup = await warmupPromise; } catch { /* ignore */ }

      return new Response(
        JSON.stringify({
          error: "Backend service error. Please try again.",
          upstream_status: renderResponse.status,
          attempts,
          duration_ms: duration,
          hotels: [],
          totalHotels: 0,
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      const responseData = JSON.parse(responseText);
      
      if (responseData.hotels && Array.isArray(responseData.hotels) && supabase) {
        console.log(`🏨 Enriching ${responseData.hotels.length} hotels from hotels_static...`);
        responseData.hotels = await enrichWithStaticData(responseData.hotels, supabase);
        
        const enrichedCount = responseData.hotels.filter((h: any) => h.static_data).length;
        console.log(`✅ Enriched ${enrichedCount}/${responseData.hotels.length} hotels with static data`);
      }

      return new Response(JSON.stringify(responseData), {
        status: renderResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch {
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
