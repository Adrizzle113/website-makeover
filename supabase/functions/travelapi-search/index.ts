import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RENDER_API_URL = "https://travelapi-bg6t.onrender.com";
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY_MS = 3000;

// Helper to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Exponential backoff: 3s, 6s, 12s, 24s (total ~45s wait time to cover cold starts)
const getRetryDelay = (attempt: number) => INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);

// Helper to make request with retries for transient errors (502, 503, 504)
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = MAX_RETRIES): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const retryDelay = getRetryDelay(attempt);
      console.log(`📤 Attempt ${attempt}/${maxRetries} to ${url}`);
      const response = await fetch(url, options);
      
      // If it's a transient error (502, 503, 504), retry with exponential backoff
      if ([502, 503, 504].includes(response.status) && attempt < maxRetries) {
        console.log(`⚠️ Got ${response.status}, server may be waking up. Retrying in ${retryDelay}ms...`);
        await delay(retryDelay);
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`❌ Fetch attempt ${attempt} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        const retryDelay = getRetryDelay(attempt);
        console.log(`⏳ Retrying in ${retryDelay}ms...`);
        await delay(retryDelay);
      }
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

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

    // Forward to Render API with retry logic for cold starts
    console.log('📤 Forwarding to Render:', `${RENDER_API_URL}/api/ratehawk/search`);
    
    let renderResponse = await fetchWithRetry(`${RENDER_API_URL}/api/ratehawk/search`, {
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
      
      const retryResponse = await fetchWithRetry(`${RENDER_API_URL}/api/ratehawk/search`, {
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
      
      // For 502/503/504 after all retries, give a clearer message
      if ([502, 503, 504].includes(renderResponse.status)) {
        return new Response(
          JSON.stringify({ 
            error: 'The hotel search service is temporarily unavailable. Please try again in a moment.',
            status: renderResponse.status,
            hotels: [],
            totalHotels: 0
          }),
          {
            status: 503,
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
