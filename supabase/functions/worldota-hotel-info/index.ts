import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HotelInfoRequest {
  hid: number | string;
  language?: string;
}

interface DescriptionStruct {
  title?: string;
  paragraphs?: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { hid, language = "en" }: HotelInfoRequest = await req.json();

    // Validate hid
    const numericHid = typeof hid === "string" ? parseInt(hid, 10) : hid;
    if (!numericHid || isNaN(numericHid)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid hotel ID (hid)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📚 Fetching hotel info for hid: ${numericHid}, language: ${language}`);

    // Initialize Supabase client for caching
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const hotelIdStr = String(numericHid);
    const { data: cachedData } = await supabase
      .from("hotel_static_cache")
      .select("raw_data, description, expires_at")
      .eq("hotel_id", hotelIdStr)
      .eq("language", language)
      .maybeSingle();

    if (cachedData && cachedData.expires_at) {
      const expiresAt = new Date(cachedData.expires_at);
      if (expiresAt > new Date()) {
        console.log("✅ Returning cached hotel info");
        return new Response(
          JSON.stringify({
            success: true,
            cached: true,
            hotel: {
              hid: numericHid,
              description: cachedData.description,
              raw_data: cachedData.raw_data,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch from WorldOTA API
    const keyId = Deno.env.get("WORLDOTA_KEY_ID");
    const apiKey = Deno.env.get("WORLDOTA_API_KEY");

    if (!keyId || !apiKey) {
      console.error("❌ Missing WorldOTA credentials");
      return new Response(
        JSON.stringify({ success: false, error: "WorldOTA credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = "Basic " + btoa(`${keyId}:${apiKey}`);

    console.log("🌐 Calling WorldOTA /hotel/info/ API...");

    const worldotaResponse = await fetch(
      "https://api.worldota.net/api/b2b/v3/hotel/info/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          id: numericHid,
          language: language,
        }),
      }
    );

    if (!worldotaResponse.ok) {
      const errorText = await worldotaResponse.text();
      console.error(`❌ WorldOTA API error: ${worldotaResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `WorldOTA API error: ${worldotaResponse.status}` 
        }),
        { status: worldotaResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const worldotaData = await worldotaResponse.json();
    console.log("📥 WorldOTA response received");

    // Extract description from description_struct
    let description: string | null = null;
    const descriptionStruct: DescriptionStruct[] = worldotaData.data?.description_struct;

    if (descriptionStruct && Array.isArray(descriptionStruct)) {
      // Combine all paragraphs from all sections
      const allParagraphs: string[] = [];
      
      for (const section of descriptionStruct) {
        if (section.paragraphs && Array.isArray(section.paragraphs)) {
          allParagraphs.push(...section.paragraphs);
        }
      }
      
      if (allParagraphs.length > 0) {
        description = allParagraphs.join("\n\n");
        console.log(`✅ Extracted description: ${description.length} chars from ${allParagraphs.length} paragraphs`);
      }
    }

    // Fallback to plain description field
    if (!description && worldotaData.data?.description) {
      description = worldotaData.data.description;
      console.log(`✅ Using plain description: ${description?.length ?? 0} chars`);
    }

    // Cache the result (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: upsertError } = await supabase
      .from("hotel_static_cache")
      .upsert(
        {
          hotel_id: hotelIdStr,
          language: language,
          description: description,
          raw_data: worldotaData.data,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
        },
        { onConflict: "hotel_id,language" }
      );

    if (upsertError) {
      console.warn("⚠️ Failed to cache hotel info:", upsertError.message);
    } else {
      console.log("💾 Cached hotel info successfully");
    }

    return new Response(
      JSON.stringify({
        success: true,
        cached: false,
        hotel: {
          hid: numericHid,
          description: description,
          description_struct: descriptionStruct,
          name: worldotaData.data?.name,
          address: worldotaData.data?.address,
          amenities: worldotaData.data?.amenity_groups,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("💥 Error in worldota-hotel-info:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
