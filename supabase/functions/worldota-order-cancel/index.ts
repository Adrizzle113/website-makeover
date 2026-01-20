// WorldOTA Order Cancel Edge Function
// Cancels a booking via WorldOTA API and updates Supabase

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CancelRequest {
  order_id: string;
  reason?: string;
  language?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { order_id, reason, language = "en" }: CancelRequest = await req.json();

    if (!order_id) {
      return new Response(
        JSON.stringify({ status: "error", error: { message: "order_id is required" } }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[worldota-order-cancel] Cancelling order: ${order_id}`);

    // Get WorldOTA credentials
    const keyId = Deno.env.get("WORLDOTA_KEY_ID");
    const apiKey = Deno.env.get("WORLDOTA_API_KEY");

    if (!keyId || !apiKey) {
      console.error("[worldota-order-cancel] Missing WorldOTA credentials");
      return new Response(
        JSON.stringify({ status: "error", error: { message: "WorldOTA credentials not configured" } }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Basic Auth header
    const authHeader = `Basic ${btoa(`${keyId}:${apiKey}`)}`;

    // Build request body
    const requestBody: Record<string, unknown> = {
      order_id: order_id,
      language: language,
    };
    
    if (reason) {
      requestBody.reason = reason;
    }

    // Call WorldOTA order/cancel endpoint
    const response = await fetch("https://api.worldota.net/api/b2b/v3/hotel/order/cancel/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[worldota-order-cancel] API error: ${response.status}`, data);
      
      // If 401, try with swapped credentials
      if (response.status === 401) {
        console.log("[worldota-order-cancel] Retrying with swapped credentials...");
        const swappedAuthHeader = `Basic ${btoa(`${apiKey}:${keyId}`)}`;
        
        const retryResponse = await fetch("https://api.worldota.net/api/b2b/v3/hotel/order/cancel/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": swappedAuthHeader,
          },
          body: JSON.stringify(requestBody),
        });

        const retryData = await retryResponse.json();
        
        if (retryResponse.ok) {
          console.log(`[worldota-order-cancel] Success with swapped credentials for order: ${order_id}`);
          // Update Supabase after successful cancellation
          await updateSupabaseBookingStatus(order_id, retryData);
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
        JSON.stringify({ status: "error", error: { message: "Failed to cancel order", details: data } }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[worldota-order-cancel] Successfully cancelled order: ${order_id}`);
    
    // Update Supabase after successful cancellation
    await updateSupabaseBookingStatus(order_id, data);

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[worldota-order-cancel] Error:", error);
    return new Response(
      JSON.stringify({ 
        status: "error", 
        error: { message: error instanceof Error ? error.message : "Unknown error" } 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Update the booking status in Supabase after cancellation
 */
async function updateSupabaseBookingStatus(orderId: string, cancelResponse: unknown): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn("[worldota-order-cancel] Supabase credentials not available, skipping database update");
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from("user_bookings")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        raw_api_response: cancelResponse as Record<string, unknown>,
      })
      .eq("order_id", orderId);

    if (error) {
      console.warn(`[worldota-order-cancel] Failed to update Supabase: ${error.message}`);
    } else {
      console.log(`[worldota-order-cancel] Updated Supabase booking status for: ${orderId}`);
    }
  } catch (err) {
    console.warn("[worldota-order-cancel] Error updating Supabase:", err);
  }
}
