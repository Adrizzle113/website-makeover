// Redeploy trigger - 2026-01-06 - V4 Match by NAME when hid unavailable
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

function getSupabaseClient(): ReturnType<typeof createClient> | null {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ Missing Supabase env vars');
      return null;
    }
    return createClient(supabaseUrl, supabaseKey);
  } catch (e) {
    console.warn('⚠️ Failed to init Supabase client:', e);
    return null;
  }
}

interface HotelsStaticRow {
  hid: number;
  name: string | null;
  address: string | null;
  region_name: string | null;
  country_code: string | null;
  star_rating: number | null;
  latitude: number | null;
  longitude: number | null;
  amenities: string[] | null;
  description: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
}

// Convert slug like "royal_palm_tower" to "Royal Palm Tower" for name matching
function slugToName(slug: string): string {
  return slug
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

// Normalize name for comparison (lowercase, remove special chars)
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function enrichWithStaticData(
  hotels: any[], 
  supabase: any
): Promise<any[]> {
  if (!hotels || hotels.length === 0) return hotels;
  if (!supabase) return hotels;

  // Extract hotel names from API response for matching
  const hotelNames: string[] = [];
  const hotelNameMap = new Map<string, string>(); // normalized -> original
  
  hotels.forEach(h => {
    // Get name from slug (id field) or name field
    const slug = h.id || '';
    const nameFromSlug = slugToName(slug);
    const directName = h.name || nameFromSlug;
    
    if (directName) {
      const normalized = normalizeName(directName);
      hotelNames.push(directName);
      hotelNameMap.set(normalized, directName);
    }
  });

  console.log(`📊 Enrichment lookup: ${hotelNames.length} hotels by name`);
  console.log(`📊 Sample names: ${hotelNames.slice(0, 3).join(', ')}`);

  if (hotelNames.length === 0) {
    console.log('⚠️ No hotel names to look up');
    return hotels;
  }

  try {
    // Query ALL hotels from the region to do client-side matching
    // (Supabase doesn't support OR with multiple ILIKE efficiently)
    const regionName = hotels[0]?.location || hotels[0]?.region?.name;
    
    let query = supabase
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
      .limit(1000);
    
    // If we know the region, filter by it for better performance
    if (regionName && regionName !== 'Unknown') {
      query = query.ilike('region_name', `%${regionName}%`);
    }
    
    const { data: staticData, error } = await query;

    if (error) {
      console.error('❌ Database query error:', error.message);
      return hotels;
    }

    const staticArray = staticData as HotelsStaticRow[] | null;
    
    if (!staticArray || staticArray.length === 0) {
      console.log('⚠️ No static data found in hotels_static');
      return hotels;
    }

    console.log(`📊 Loaded ${staticArray.length} hotels from database for matching`);

    // Create lookup map by normalized name
    const staticByName = new Map<string, HotelsStaticRow>();
    staticArray.forEach(s => {
      if (s.name) {
        const normalized = normalizeName(s.name);
        staticByName.set(normalized, s);
      }
    });

    console.log(`📊 Created name lookup map with ${staticByName.size} entries`);

    let matchCount = 0;

    // Merge static data into hotels
    const enrichedHotels = hotels.map(hotel => {
      // Get the hotel name to match
      const slug = hotel.id || '';
      const nameFromSlug = slugToName(slug);
      const hotelName = hotel.name || nameFromSlug;
      
      if (!hotelName) return hotel;
      
      const normalizedName = normalizeName(hotelName);
      
      // Try exact match first
      let staticInfo = staticByName.get(normalizedName);
      
      // If no exact match, try partial matching
      if (!staticInfo) {
        // Try to find a close match
        for (const [dbNormalized, dbData] of staticByName.entries()) {
          // Check if one contains the other (handles slight variations)
          if (dbNormalized.includes(normalizedName) || normalizedName.includes(dbNormalized)) {
            staticInfo = dbData;
            break;
          }
          // Check word overlap (at least 2 matching words)
          const hotelWords = normalizedName.split(' ').filter(w => w.length > 2);
          const dbWords = dbNormalized.split(' ').filter(w => w.length > 2);
          const matchingWords = hotelWords.filter(w => dbWords.includes(w));
          if (matchingWords.length >= 2) {
            staticInfo = dbData;
            break;
          }
        }
      }

      if (staticInfo) {
        matchCount++;
        return {
          ...hotel,
          hid: staticInfo.hid, // Add hid from database!
          static_data: {
            name: staticInfo.name,
            address: staticInfo.address,
            city: staticInfo.region_name,
            country: staticInfo.country_code,
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

    console.log(`✅ Matched ${matchCount}/${hotels.length} hotels by name`);
    
    if (matchCount > 0) {
      const sample = enrichedHotels.find(h => h.static_data);
      if (sample) {
        console.log(`📊 Sample match: "${sample.name}" → city="${sample.static_data.city}", country="${sample.static_data.country}"`);
      }
    }

    return enrichedHotels;
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const requestStart = Date.now();

  try {
    const supabase = getSupabaseClient();
    const bodyText = await req.text();

    if (!bodyText || bodyText.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Empty request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let requestBody;
    try {
      requestBody = JSON.parse(bodyText);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
      try { warmup = await warmupPromise; } catch { /* ignore */ }
      return new Response(
        JSON.stringify({
          error: 'Service temporarily unavailable',
          hotels: [],
          totalHotels: 0,
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const responseText = await renderResponse.text();
    console.log(`📨 Render response: ${renderResponse.status} (${duration}ms)`);

    if (responseText.includes('Could not find region') || responseText.includes('Destination not found')) {
      return new Response(
        JSON.stringify({
          error: 'Destination not available',
          hotels: [],
          totalHotels: 0,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (renderResponse.status >= 500) {
      return new Response(
        JSON.stringify({
          error: 'Backend service error',
          hotels: [],
          totalHotels: 0,
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const responseData = JSON.parse(responseText);
      
      // Enrich hotels with static data by NAME matching
      if (responseData.hotels && Array.isArray(responseData.hotels) && supabase) {
        console.log(`🏨 Enriching ${responseData.hotels.length} hotels by name...`);
        responseData.hotels = await enrichWithStaticData(responseData.hotels, supabase);
        
        const enrichedCount = responseData.hotels.filter((h: any) => h.static_data).length;
        console.log(`✅ Enriched ${enrichedCount}/${responseData.hotels.length} hotels`);
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
    console.error('💥 Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
