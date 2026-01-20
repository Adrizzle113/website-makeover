// WorldOTA Order Info Edge Function
// Fetches complete order details from WorldOTA API

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderInfoRequest {
  order_id: string;
  language?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { order_id, language = "en" }: OrderInfoRequest = await req.json();

    if (!order_id) {
      return new Response(
        JSON.stringify({ status: "error", error: { message: "order_id is required" } }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[worldota-order-info] Fetching order info for: ${order_id}`);

    // Get WorldOTA credentials
    const keyId = Deno.env.get("WORLDOTA_KEY_ID");
    const apiKey = Deno.env.get("WORLDOTA_API_KEY");

    if (!keyId || !apiKey) {
      console.error("[worldota-order-info] Missing WorldOTA credentials");
      return new Response(
        JSON.stringify({ status: "error", error: { message: "WorldOTA credentials not configured" } }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Basic Auth header
    const authHeader = `Basic ${btoa(`${keyId}:${apiKey}`)}`;

    // Call WorldOTA order/info endpoint
    const response = await fetch("https://api.worldota.net/api/b2b/v3/hotel/order/info/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        order_id: order_id,
        language: language,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[worldota-order-info] API error: ${response.status}`, data);
      
      // If 401, try with swapped credentials (some accounts have reversed key/secret)
      if (response.status === 401) {
        console.log("[worldota-order-info] Retrying with swapped credentials...");
        const swappedAuthHeader = `Basic ${btoa(`${apiKey}:${keyId}`)}`;
        
        const retryResponse = await fetch("https://api.worldota.net/api/b2b/v3/hotel/order/info/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": swappedAuthHeader,
          },
          body: JSON.stringify({
            order_id: order_id,
            language: language,
          }),
        });

        const retryData = await retryResponse.json();
        
        if (retryResponse.ok) {
          console.log(`[worldota-order-info] Success with swapped credentials for order: ${order_id}`);
          return new Response(
            JSON.stringify(retryData),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ status: "error", error: { message: "Authentication failed", details: retryData } }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ status: "error", error: { message: "Failed to fetch order info", details: data } }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[worldota-order-info] Successfully fetched order info for: ${order_id}`);
    
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[worldota-order-info] Error:", error);
    return new Response(
      JSON.stringify({ 
        status: "error", 
        error: { message: error instanceof Error ? error.message : "Unknown error" } 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
