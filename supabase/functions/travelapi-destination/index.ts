import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RENDER_API_URL = "https://travelapi-bg6t.onrender.com";
const REQUEST_TIMEOUT_MS = 10000; // 10 seconds

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    // Return empty array for empty/short queries
    if (!query || query.trim().length < 2) {
      return new Response(JSON.stringify({ regions: [], hotels: [] }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("📍 Destination search for:", query);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${RENDER_API_URL}/api/destination`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      console.log(`📨 Render response: ${response.status}`);

      // For 5xx errors, return empty array (graceful degradation)
      if (response.status >= 500) {
        console.warn(`⚠️ Upstream error ${response.status}, returning empty results`);
        return new Response(JSON.stringify({ regions: [], hotels: [], upstream_status: response.status }), {
          status: 200, // Return 200 so autocomplete doesn't break
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // For success or client errors, pass through the response
      const data = responseText ? JSON.parse(responseText) : { regions: [], hotels: [] };
      console.log("✅ Destination results:", data?.regions?.length || 0, "regions,", data?.hotels?.length || 0, "hotels");

      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      const message = fetchError instanceof Error ? fetchError.message : String(fetchError);
      console.error("❌ Fetch error:", message);
      
      // For abort/timeout errors, return clean empty result without error field
      // This prevents the frontend from showing abort errors to users
      if (message.includes('aborted') || message.includes('Aborted') || message.includes('timeout')) {
        return new Response(JSON.stringify({ regions: [], hotels: [] }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // For other errors, include error message for debugging
      return new Response(JSON.stringify({ regions: [], hotels: [], error: message }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error("💥 Destination proxy error:", error);
    
    // Graceful degradation for any error
    return new Response(JSON.stringify({ regions: [], hotels: [] }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
