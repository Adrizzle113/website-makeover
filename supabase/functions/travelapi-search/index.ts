import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RENDER_API_URL = "https://travelapi-bg6t.onrender.com";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const bodyText = await req.text();
    console.log(`📥 Raw body length: ${bodyText.length} chars`);

    if (!bodyText || bodyText.length === 0) {
      console.error('❌ Empty request body');
      return new Response(
        JSON.stringify({ error: 'Empty request body' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let requestBody;
    try {
      requestBody = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('📋 Request keys:', Object.keys(requestBody));
    console.log('📍 Destination:', requestBody.destination);
    console.log('🆔 RegionId:', requestBody.regionId);
    console.log('📅 Dates:', requestBody.checkin, '->', requestBody.checkout);

    // Validation - destination is required
    if (!requestBody.destination) {
      console.error('❌ Missing destination in payload');
      return new Response(
        JSON.stringify({ error: 'destination is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Forward to Render API
    console.log('📤 Forwarding to Render:', `${RENDER_API_URL}/api/ratehawk/search`);
    
    let renderResponse = await fetch(`${RENDER_API_URL}/api/ratehawk/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    let responseText = await renderResponse.text();
    console.log(`📨 Render response status: ${renderResponse.status}`);
    console.log(`📨 Render response preview: ${responseText.substring(0, 300)}`);

    // If "Destination not found" error and we have a regionId, try with just the regionId
    if (!renderResponse.ok && responseText.includes('Destination not found') && requestBody.regionId) {
      console.log('🔄 Retrying with regionId-only search...');
      
      // Create a modified payload using regionId as the primary lookup
      const retryBody = {
        ...requestBody,
        destination: `region_${requestBody.regionId}`, // Signal to use regionId
        useRegionId: true,
      };
      
      console.log('📤 Retry payload:', JSON.stringify(retryBody));
      
      const retryResponse = await fetch(`${RENDER_API_URL}/api/ratehawk/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(retryBody),
      });
      
      const retryText = await retryResponse.text();
      console.log(`📨 Retry response status: ${retryResponse.status}`);
      console.log(`📨 Retry response preview: ${retryText.substring(0, 300)}`);
      
      // If retry succeeded, use that response
      if (retryResponse.ok) {
        renderResponse = retryResponse;
        responseText = retryText;
      }
    }

    if (!renderResponse.ok) {
      console.error(`❌ Render API error: ${renderResponse.status}`);
      
      // Provide a more helpful error message for "Destination not found"
      if (responseText.includes('Destination not found')) {
        const destination = requestBody.destination;
        return new Response(
          JSON.stringify({ 
            error: `"${destination}" is not available for search. Try a major city nearby (e.g., Los Angeles, New York).`,
            originalError: responseText,
            hotels: [],
            totalHotels: 0
          }),
          {
            status: 400, // Change to 400 - it's a client-side issue
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      return new Response(
        responseText || JSON.stringify({ error: `Render API error: ${renderResponse.status}` }),
        {
          status: renderResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Return successful response
    return new Response(responseText, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Edge function error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
