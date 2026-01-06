// Redeploy trigger - 2026-01-06
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const RENDER_API_URL = "https://travelapi-bg6t.onrender.com";
const REQUEST_TIMEOUT_MS = 30000;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestStart = Date.now();

  try {
    const bodyText = await req.text();
    console.log(`📥 Geo Search request: ${bodyText.length} chars`);

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

    const { latitude, longitude, checkin, checkout, guests, radius, residency, currency } = requestBody;

    if (latitude === undefined || longitude === undefined) {
      return new Response(
        JSON.stringify({ error: 'latitude and longitude are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Geo Search: [${latitude}, ${longitude}] | radius: ${radius || 5000}m | ${checkin} - ${checkout}`);

    // Call Render backend Geo search endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${RENDER_API_URL}/api/ratehawk/search/by-geo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude,
          longitude,
          checkin,
          checkout,
          guests,
          radius: radius || 5000,
          residency: residency || 'us',
          currency: currency || 'USD',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const duration = Date.now() - requestStart;

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Backend error: ${response.status} - ${errorText}`);
        
        return new Response(
          JSON.stringify({ 
            error: 'Geo search failed', 
            details: errorText,
            status: response.status,
            duration_ms: duration,
          }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      console.log(`✅ Geo Search complete: ${data.hotels?.length || 0} hotels (${duration}ms)`);

      return new Response(
        JSON.stringify({
          success: true,
          ...data,
          duration_ms: duration,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (fetchError) {
      clearTimeout(timeoutId);
      const message = fetchError instanceof Error ? fetchError.message : String(fetchError);
      console.error(`❌ Fetch error: ${message}`);

      return new Response(
        JSON.stringify({
          error: 'Service temporarily unavailable',
          details: message,
          duration_ms: Date.now() - requestStart,
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Geo Search error: ${message}`);

    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
