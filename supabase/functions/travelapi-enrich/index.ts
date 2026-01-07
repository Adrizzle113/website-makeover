import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const EDGE_FUNCTION_VERSION = "2026-01-07T18:55:30-ENRICH-FN-V1";

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

async function handleEnrich(hotelIds: string[], supabase: any): Promise<Response> {
  console.log(`🔍 travelapi-enrich: request for ${hotelIds.length} hotel IDs`);

  if (!supabase) {
    return new Response(JSON.stringify({ byHotelId: {}, error: "No database connection" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const uniqueIds = Array.from(new Set(hotelIds.map((x) => String(x)).filter(Boolean)));
  const limitedIds = uniqueIds.slice(0, 200);

  if (limitedIds.length === 0) {
    return new Response(JSON.stringify({ byHotelId: {} }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { data: staticData, error } = await supabase
      .from("hotel_dump_data")
      .select(
        "hotel_id, name, address, city, country, star_rating, latitude, longitude, amenities, description, check_in_time, check_out_time",
      )
      .in("hotel_id", limitedIds);

    if (error) {
      console.error("❌ travelapi-enrich query error:", error.message);
      return new Response(JSON.stringify({ byHotelId: {}, error: error.message }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const byHotelId: Record<string, any> = {};
    (staticData || []).forEach((row: any) => {
      byHotelId[row.hotel_id] = {
        name: row.name,
        address: row.address,
        city: row.city,
        country: row.country,
        star_rating: row.star_rating,
        coordinates: { lat: row.latitude, lon: row.longitude },
        amenities: row.amenities || [],
        description: row.description,
        check_in_time: row.check_in_time,
        check_out_time: row.check_out_time,
      };
    });

    console.log(`✅ travelapi-enrich returned ${Object.keys(byHotelId).length}/${limitedIds.length} matches`);

    return new Response(JSON.stringify({ byHotelId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ travelapi-enrich error:", err);
    return new Response(JSON.stringify({ byHotelId: {}, error: String(err) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

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
