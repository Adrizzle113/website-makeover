// WorldOTA Hotel Info Edge Function - Fetches hotel descriptions with 7-day caching
// Deployed: 2026-01-09 - Triggered redeployment to Supabase
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface HotelInfoRequest {
  hid: number | string;
  language?: string;
}

interface DescriptionStruct {
  title?: string;
  paragraphs?: string[];
}

interface WorldOTAImage {
  tmpl?: string;
  source?: string;
  url?: string;
}

interface NormalizedImage {
  url: string;
  alt: string;
}

Deno.serve(async (req) => {
  console.log(`📥 Request: ${req.method} from origin: ${req.headers.get("origin")}`);
  
  // Handle CORS preflight - must return 200 with all headers
  if (req.method === "OPTIONS") {
    console.log("✅ Handling OPTIONS preflight");
    return new Response("ok", { status: 200, headers: corsHeaders });
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
        
        // Extract images from cached raw_data
        const cachedRawImages = cachedData.raw_data?.images || [];
        const cachedImages: NormalizedImage[] = cachedRawImages
          .map((img: WorldOTAImage, index: number) => {
            let imageUrl = img.tmpl || img.source || img.url || "";
            if (imageUrl.includes("{size}")) {
              imageUrl = imageUrl.replace("{size}", "1024x768");
            }
            if (!imageUrl) return null;
            return { url: imageUrl, alt: `Hotel image ${index + 1}` };
          })
          .filter((img: NormalizedImage | null): img is NormalizedImage => img !== null);

        // Extract deposits from cached metapolicy_struct
        const cachedMetapolicy = cachedData.raw_data?.metapolicy_struct;
        const cachedDeposits: string[] = [];
        if (cachedMetapolicy?.deposit) {
          for (const dep of cachedMetapolicy.deposit) {
            const parts: string[] = [];
            if (dep.deposit_amount) parts.push(String(dep.deposit_amount));
            if (dep.currency) parts.push(dep.currency);
            if (dep.payment_type) parts.push(`in ${dep.payment_type}`);
            if (dep.availability) parts.push(`per ${dep.availability}`);
            if (dep.price_unit) parts.push(`for ${dep.price_unit.replace(/_/g, ' ')}`);
            if (parts.length > 0) {
              cachedDeposits.push(parts.join(' '));
            }
          }
        }

        // Extract cached check-in/check-out times
        const cachedCheckInTime = cachedMetapolicy?.check_in_check_out?.check_in_time || cachedData.raw_data?.check_in_time;
        const cachedCheckOutTime = cachedMetapolicy?.check_in_check_out?.check_out_time || cachedData.raw_data?.check_out_time;

        return new Response(
          JSON.stringify({
            success: true,
            cached: true,
            hotel: {
              hid: numericHid,
              description: cachedData.description,
              images: cachedImages,
              raw_data: cachedData.raw_data,
              phone: cachedData.raw_data?.phone,
              // Deposit and policy data from cache
              deposits: cachedDeposits,
              check_in_time: cachedCheckInTime,
              check_out_time: cachedCheckOutTime,
              metapolicy: cachedMetapolicy,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch from WorldOTA API
    const rawKeyId = Deno.env.get("WORLDOTA_KEY_ID");
    const rawApiKey = Deno.env.get("WORLDOTA_API_KEY");

    const keyId = rawKeyId?.trim();
    const apiKey = rawApiKey?.trim();

    if (!keyId || !apiKey) {
      console.error("❌ Missing WorldOTA credentials");
      return new Response(
        JSON.stringify({ success: false, error: "WorldOTA credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Avoid logging secrets; log only safe diagnostics
    const keyIdLooksNumeric = /^\d+$/.test(keyId);
    if (!keyIdLooksNumeric) {
      console.warn("⚠️ WORLDOTA_KEY_ID does not look numeric (check you didn't paste the API key into the ID field)");
    }

    const makeAuthHeader = (left: string, right: string) => "Basic " + btoa(`${left}:${right}`);

    console.log("🌐 Calling WorldOTA /hotel/info/ API...");

    const callWorldOta = async (authorization: string) => {
      return fetch("https://api.worldota.net/api/b2b/v3/hotel/info/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authorization,
        },
        body: JSON.stringify({
          hid: numericHid,
          language: language,
        }),
      });
    };

    // Primary auth format: keyId:apiKey
    let worldotaResponse = await callWorldOta(makeAuthHeader(keyId, apiKey));

    // If credentials were pasted swapped, retry once with apiKey:keyId
    if (worldotaResponse.status === 401) {
      console.warn("⚠️ WorldOTA returned 401. Retrying once with swapped credentials order (diagnostic only)...");
      worldotaResponse = await callWorldOta(makeAuthHeader(apiKey, keyId));
    }

    if (!worldotaResponse.ok) {
      const errorText = await worldotaResponse.text();
      console.error(`❌ WorldOTA API error: ${worldotaResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `WorldOTA API error: ${worldotaResponse.status}`,
          detail: errorText,
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

    // Extract and normalize images
    const rawImages: WorldOTAImage[] = worldotaData.data?.images || [];
    const normalizedImages: NormalizedImage[] = rawImages
      .map((img: WorldOTAImage, index: number) => {
        // Handle different image URL formats from WorldOTA
        let imageUrl = img.tmpl || img.source || img.url || "";
        
        // Replace {size} placeholder with high-res size
        if (imageUrl.includes("{size}")) {
          imageUrl = imageUrl.replace("{size}", "1024x768");
        }
        
        if (!imageUrl) return null;
        
        return {
          url: imageUrl,
          alt: `Hotel image ${index + 1}`,
        };
      })
      .filter((img): img is NormalizedImage => img !== null);

    console.log(`📸 Extracted ${normalizedImages.length} images from WorldOTA response`);

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

    // Extract metapolicy_struct for deposits and policies
    const metapolicy = worldotaData.data?.metapolicy_struct;
    const deposits: string[] = [];
    
    // Parse deposit info from metapolicy_struct
    if (metapolicy?.deposit) {
      for (const dep of metapolicy.deposit) {
        // Format: "amount currency per availability_type for price_unit"
        // Example: "123 EUR in cash per room for the entire stay"
        const parts: string[] = [];
        if (dep.deposit_amount) parts.push(String(dep.deposit_amount));
        if (dep.currency) parts.push(dep.currency);
        if (dep.payment_type) parts.push(`in ${dep.payment_type}`);
        if (dep.availability) parts.push(`per ${dep.availability}`);
        if (dep.price_unit) parts.push(`for ${dep.price_unit.replace(/_/g, ' ')}`);
        
        if (parts.length > 0) {
          deposits.push(parts.join(' '));
        }
      }
    }

    // Extract check-in/check-out times
    const checkInTime = metapolicy?.check_in_check_out?.check_in_time || worldotaData.data?.check_in_time;
    const checkOutTime = metapolicy?.check_in_check_out?.check_out_time || worldotaData.data?.check_out_time;

    return new Response(
      JSON.stringify({
        success: true,
        cached: false,
        hotel: {
          hid: numericHid,
          description: description,
          description_struct: descriptionStruct,
          images: normalizedImages,
          name: worldotaData.data?.name,
          address: worldotaData.data?.address,
          amenities: worldotaData.data?.amenity_groups,
          phone: worldotaData.data?.phone,
          // Deposit and policy data
          deposits: deposits,
          check_in_time: checkInTime,
          check_out_time: checkOutTime,
          metapolicy: metapolicy,
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
