import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RENDER_API_URL = "https://travelapi-bg6t.onrender.com";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const REQUEST_TIMEOUT_MS = 45000; // 45 seconds
const WARMUP_TIMEOUT_MS = 10000; // 10 seconds
const SESSIONS_TIMEOUT_MS = 8000; // 8 seconds

// Helper to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Warmup function - pings health endpoint to wake up Render
async function warmupServer(): Promise<{ ok: boolean; status: number }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WARMUP_TIMEOUT_MS);

  try {
    console.log('🔥 Warming up Render server...');
    const response = await fetch(`${RENDER_API_URL}/api/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const isHealthy = response.ok;
    console.log(`${isHealthy ? '✅' : '❌'} Health check: ${response.status}`);
    return { ok: isHealthy, status: response.status };
  } catch (error) {
    clearTimeout(timeoutId);
    const message = error instanceof Error ? error.message : String(error);
    console.warn('⚠️ Warmup failed:', message);
    return { ok: false, status: 0 };
  }
}

type SessionsApiResponse = {
  activeSessions?: number;
  sessions?: Array<{
    userId: string;
    email?: string;
    loginTime?: string;
    lastUsed?: string;
    cookieCount?: number;
    sessionAge?: string;
  }>;
  timestamp?: string;
};

async function fetchSessions(): Promise<SessionsApiResponse | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SESSIONS_TIMEOUT_MS);

  try {
    const res = await fetch(`${RENDER_API_URL}/api/sessions`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`⚠️ Sessions endpoint returned ${res.status}`);
      return null;
    }

    const json = (await res.json()) as SessionsApiResponse;
    return json;
  } catch (error) {
    clearTimeout(timeoutId);
    const message = error instanceof Error ? error.message : String(error);
    console.warn("⚠️ Sessions fetch failed:", message);
    return null;
  }
}

// Retry with linear backoff (simpler, faster feedback)
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number
): Promise<{ response: Response | null; attempts: number; lastStatus: number }> {
  let lastStatus = 0;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries}: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      lastStatus = response.status;
      
      // Success or client error (4xx) - don't retry
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return { response, attempts: attempt, lastStatus };
      }

      // Server error
      if (attempt < maxRetries) {
        console.log(`⚠️ Server error ${response.status}, will retry...`);
        const waitTime = RETRY_DELAY_MS * attempt;
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await delay(waitTime);
        continue;
      }

      // Final attempt: return the response so we can surface upstream details
      console.log(`💥 Server error ${response.status} on final attempt`);
      return { response, attempts: attempt, lastStatus };
      
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ Attempt ${attempt} failed:`, message);
      
      if (attempt < maxRetries) {
        const waitTime = RETRY_DELAY_MS * attempt;
        await delay(waitTime);
      }
    }
  }
  
  return { response: null, attempts: maxRetries, lastStatus };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestStart = Date.now();

  try {
    // Parse request body
    const bodyText = await req.text();
    console.log(`📥 Request body length: ${bodyText.length} chars`);

    if (!bodyText || bodyText.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Empty request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let requestBody;
    try {
      requestBody = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('❌ JSON parse error');
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📋 Payload keys:', Object.keys(requestBody));
    console.log('📍 destination:', requestBody.destination);
    console.log('🆔 regionId:', requestBody.regionId ?? requestBody.region_id);

    // Guest-mode diagnostics: confirm backend has an active session we can use.
    const originalUserId = String(requestBody.userId ?? "");
    if (originalUserId === "guest_shared_session" || originalUserId.startsWith("anon_")) {
      const sessions = await fetchSessions();
      const activeSessions = (sessions?.sessions || []).filter(
        (s) => !!s.userId && (s.cookieCount == null || s.cookieCount > 0)
      );

      const hasExact = activeSessions.some((s) => s.userId === originalUserId);

      if (hasExact) {
        console.log(`✅ Guest session is active for userId: ${originalUserId}`);
      } else if (activeSessions.length > 0) {
        const fallbackUserId = activeSessions[0].userId;
        requestBody.userId = fallbackUserId;
        console.log(
          `🔁 Guest mode fallback: using active session userId "${fallbackUserId}" instead of "${originalUserId}"`
        );
      } else {
        console.warn('🚫 No active sessions available on backend for guest search');
        return new Response(
          JSON.stringify({
            error: 'Backend has no active RateHawk session yet.',
            details:
              'Guest searches require at least one active session on the backend. Seed a session in the Render backend and try again.',
            hotels: [],
            totalHotels: 0,
          }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate - destination is required
    if (!requestBody.destination && !requestBody.regionId && !requestBody.region_id) {
      return new Response(
        JSON.stringify({ error: 'destination or regionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Warmup server first
    const warmup = await warmupServer();

    // Call Render API with retry
    const { response: renderResponse, attempts, lastStatus } = await fetchWithRetry(
      `${RENDER_API_URL}/api/ratehawk/search`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      },
      MAX_RETRIES
    );

    const duration = Date.now() - requestStart;

    // All retries failed
    if (!renderResponse) {
      console.error('💥 All retries failed');
      return new Response(
        JSON.stringify({
          error: 'Service temporarily unavailable. Please try again in 30 seconds.',
          details: warmup.ok 
            ? 'Backend is online but search endpoint is not responding'
            : 'Backend server is waking up',
          wasWarm: warmup.ok,
          warmupStatus: warmup.status,
          attempts,
          lastStatus,
          duration_ms: duration,
          hotels: [],
          totalHotels: 0,
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const responseText = await renderResponse.text();
    console.log(`📨 Render response: ${renderResponse.status} (${duration}ms)`);
    console.log(`📨 Response preview: ${responseText.substring(0, 200)}`);

    // Handle "Destination not found" as client error (even if upstream mistakenly returns 5xx)
    if (responseText.includes('Destination not found')) {
      const destination = String((requestBody as any).destination ?? "");
      return new Response(
        JSON.stringify({
          error: `"${destination}" is not available for search. Try a major city nearby.`,
          hotels: [],
          totalHotels: 0,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle server errors after retries succeeded but got error
    if (renderResponse.status >= 500) {
      // Try to surface upstream error details to the client for debugging
      let upstreamDetails: string | null = null;

      try {
        const maybeJson = JSON.parse(responseText);
        if (maybeJson && typeof maybeJson === "object") {
          upstreamDetails =
            (maybeJson as any).error ||
            (maybeJson as any).message ||
            (maybeJson as any).details ||
            null;
        }
      } catch {
        // not JSON
      }

      const upstreamPreview = (upstreamDetails || responseText || "").toString().slice(0, 1500);

      return new Response(
        JSON.stringify({
          error: "Backend service error. Please try again.",
          details: upstreamPreview || "Upstream returned a 5xx without a body",
          upstream_status: renderResponse.status,
          attempts,
          lastStatus: renderResponse.status,
          duration_ms: duration,
          wasWarm: warmup.ok,
          warmupStatus: warmup.status,
          hotels: [],
          totalHotels: 0,
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return response (success or other client error)
    return new Response(responseText, {
      status: renderResponse.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const duration = Date.now() - requestStart;
    console.error('💥 Edge function error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({
        error: 'Internal error',
        message,
        duration_ms: duration,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
