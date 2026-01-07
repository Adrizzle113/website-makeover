import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const EDGE_FUNCTION_VERSION = "2026-01-07T20:30:00-ENRICH-FN-V4-CORRECT-TABLE";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

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

/**
 * Handle enrichment request - queries hotels_static table by numeric hid
 * Accepts hotel IDs (which are hid values) and returns static hotel data
 */
async function handleEnrich(hotelIds: (string | number)[], supabase: any): Promise<Response> {
  console.log(`🔍 travelapi-enrich: request for ${hotelIds.length} hotel IDs`);

  if (!supabase) {
    return new Response(JSON.stringify({ byHotelId: {}, byHid: {}, error: "No database connection" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Convert to numbers (hid is numeric in hotels_static table)
  const uniqueHids = Array.from(new Set(
    hotelIds.map((x) => {
      const num = typeof x === 'number' ? x : parseInt(String(x), 10);
      return isNaN(num) ? null : num;
    }).filter((n): n is number => n !== null)
  ));
  const limitedHids = uniqueHids.slice(0, 200);

  if (limitedHids.length === 0) {
    return new Response(JSON.stringify({ byHotelId: {}, byHid: {} }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Query hotels_static table with correct column names
    const { data: staticData, error } = await supabase
      .from("hotels_static")
      .select("hid, name, address, region_name, country_code, star_rating, latitude, longitude, amenities, description, check_in_time, check_out_time")
      .in("hid", limitedHids);

    if (error) {
      console.error("❌ travelapi-enrich query error:", error.message);
      return new Response(JSON.stringify({ byHotelId: {}, byHid: {}, error: error.message }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build lookup maps - byHid (numeric) and byHotelId (string) for compatibility
    const byHid: Record<number, any> = {};
    const byHotelId: Record<string, any> = {};
    
    (staticData || []).forEach((row: any) => {
      const hotelData = {
        name: row.name,
        address: row.address,
        city: row.region_name,       // Correct mapping: region_name -> city
        country: row.country_code,   // Correct mapping: country_code -> country
        star_rating: row.star_rating,
        coordinates: { lat: row.latitude, lon: row.longitude },
        amenities: row.amenities || [],
        description: row.description,
        check_in_time: row.check_in_time,
        check_out_time: row.check_out_time,
      };
      
      byHid[row.hid] = hotelData;
      byHotelId[String(row.hid)] = hotelData; // String key for backward compatibility
    });

    console.log(`✅ travelapi-enrich returned ${Object.keys(byHid).length}/${limitedHids.length} matches from hotels_static`);

    return new Response(JSON.stringify({ byHotelId, byHid }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ travelapi-enrich error:", err);
    return new Response(JSON.stringify({ byHotelId: {}, byHid: {}, error: String(err) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

serve(async (req) => {
  // CORS preflight MUST be handled FIRST, before any other code
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  console.log(`🚀 travelapi-enrich handler invoked, version: ${EDGE_FUNCTION_VERSION}`);
  console.log(`📥 Request method: ${req.method}, URL: ${req.url}`);

  try {
    const bodyText = await req.text();
    if (!bodyText) {
      return new Response(JSON.stringify({ error: "Empty request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let payload: any;
    try {
      payload = JSON.parse(bodyText);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // unwrap { body: {...} }
    if (payload?.body && typeof payload.body === "object" && !Array.isArray(payload.body)) {
      payload = payload.body;
    }

    const traceId = payload?.traceId ?? "none";
    const mode = String(payload?.mode ?? "").trim().toLowerCase();
    console.log("📦 travelapi-enrich payload", { mode, traceId, keys: Object.keys(payload || {}) });

    if (mode === "ping") {
      return new Response(JSON.stringify({ ok: true, version: EDGE_FUNCTION_VERSION, now: new Date().toISOString() }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hotelIds = payload?.hotelIds ?? payload?.hotel_ids;
    const safeHotelIds = Array.isArray(hotelIds) ? hotelIds.map((id: any) => String(id)) : [];

    const supabase = getSupabaseClient();
    return await handleEnrich(safeHotelIds, supabase);
  } catch (error) {
    console.error("💥 travelapi-enrich fatal:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
