import { API_BASE_URL } from "@/config/api";
import { getOrCreateUserId } from "@/lib/getOrCreateUserId";
import { geocodePlace } from "@/services/mapboxGeocode";
import { supabase } from "@/integrations/supabase/client";

// Build stamp for debugging deployed code version
const RATEHAWK_API_BUILD = "2026-01-07T002-DIRECT-SEARCH";
console.log(`🔧 RateHawkApiService build: ${RATEHAWK_API_BUILD}`);
import type {
  SearchParams,
  Hotel,
  HotelDetails,
  Destination,
  SearchFilters,
  RoomRate,
  RateHawkRate,
  POISearchParams,
  GeoSearchParams,
  IdsSearchParams,
} from "@/types/booking";

export interface SearchResponse {
  hotels: Hotel[];
  totalResults: number;
  hasMore: boolean;
  nextPage: number;
  currentPage: number;
}

interface SessionCheckResponse {
  isLoggedIn: boolean;
  ratehawkData?: {
    email: string;
    sessionExpiry: string;
  };
}

interface SessionsApiResponse {
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
}

// API filter format for backend
interface ApiSearchFilters {
  minPrice?: number;
  maxPrice?: number;
  starRatings?: number[];
  freeCancellation?: boolean;
  refundableOnly?: boolean;
  mealPlans?: string[];
  amenities?: string[];
  paymentTypes?: string[];
  rateType?: string;
  roomTypes?: string[];
  bedTypes?: string[];
  residency?: string;
  hotelKinds?: string[];
  // Snake_case versions for backend compatibility
  price_min?: number;
  price_max?: number;
  stars?: number[];
  serp_filters?: string[];
  hotel_kinds?: string[];
}

// Circuit breaker: skip edge function for enrichment if it failed recently
let enrichmentCircuitOpen = false;
let enrichmentCircuitOpenedAt = 0;
const CIRCUIT_BREAKER_DURATION_MS = 60_000; // 1 minute

function isEnrichmentCircuitOpen(): boolean {
  if (!enrichmentCircuitOpen) return false;
  if (Date.now() - enrichmentCircuitOpenedAt > CIRCUIT_BREAKER_DURATION_MS) {
    enrichmentCircuitOpen = false;
    console.log("🔄 Enrichment circuit breaker closed (timeout expired)");
    return false;
  }
  return true;
}

function openEnrichmentCircuit(): void {
  enrichmentCircuitOpen = true;
  enrichmentCircuitOpenedAt = Date.now();
  console.warn("⚡ Enrichment circuit breaker OPENED for 60s");
}

class RateHawkApiService {
  private getCurrentUserId(): string {
    return getOrCreateUserId();
  }

  // Safely format a date value (handles both Date objects and ISO strings from localStorage)
  private formatDate(date: Date | string): string {
    if (typeof date === "string") {
      return date.split("T")[0];
    }
    return date.toISOString().split("T")[0];
  }

  private async fetchWithError<T>(url: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      // Handle rate limiting BEFORE parsing JSON
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitSeconds = retryAfter ? parseInt(retryAfter, 10) : 60;
        throw new Error(`Service is busy. Please wait ${waitSeconds} seconds and try again.`);
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error("RateHawk API Error:", error);
      throw error;
    }
  }

  async checkSession(userId: string): Promise<SessionCheckResponse> {
    // Backend returns all active sessions; we treat "session exists" as logged-in.
    const url = `${API_BASE_URL}/api/sessions`;

    try {
      const response = await this.fetchWithError<SessionsApiResponse>(url);

      const userSession = response.sessions?.find((s) => s.userId === userId || (!!s.email && s.email === userId));

      return {
        isLoggedIn: !!userSession && (userSession.cookieCount == null || userSession.cookieCount > 0),
      };
    } catch (error) {
      console.error("Session check failed:", error);
      return { isLoggedIn: false };
    }
  }

  // Convert frontend filters to API format
  private transformFiltersForApi(filters?: SearchFilters): ApiSearchFilters | undefined {
    if (!filters) return undefined;

    const apiFilters: ApiSearchFilters = {};

    // Price range - send both formats for backend compatibility
    if (filters.priceMin !== undefined) {
      apiFilters.minPrice = filters.priceMin;
      apiFilters.price_min = filters.priceMin;
    }
    if (filters.priceMax !== undefined) {
      apiFilters.maxPrice = filters.priceMax;
      apiFilters.price_max = filters.priceMax;
    }

    // Star ratings - send both formats
    if (filters.starRatings && filters.starRatings.length > 0) {
      apiFilters.starRatings = filters.starRatings;
      apiFilters.stars = filters.starRatings;
    }

    // Cancellation
    if (filters.freeCancellationOnly) apiFilters.freeCancellation = true;
    if (filters.refundableOnly) apiFilters.refundableOnly = true;

    // Meal plans
    if (filters.mealPlans && filters.mealPlans.length > 0) apiFilters.mealPlans = filters.mealPlans;

    // Amenities - send both formats
    if (filters.amenities && filters.amenities.length > 0) {
      apiFilters.amenities = filters.amenities;
      apiFilters.serp_filters = filters.amenities;
    }

    // Payment types
    if (filters.paymentTypes && filters.paymentTypes.length > 0) apiFilters.paymentTypes = filters.paymentTypes;

    // Rate type
    if (filters.rateType) apiFilters.rateType = filters.rateType;

    // Room types
    if (filters.roomTypes && filters.roomTypes.length > 0) apiFilters.roomTypes = filters.roomTypes;

    // Bed types
    if (filters.bedTypes && filters.bedTypes.length > 0) apiFilters.bedTypes = filters.bedTypes;

    // Hotel kinds - send both formats
    if (filters.hotelKinds && filters.hotelKinds.length > 0) {
      apiFilters.hotelKinds = filters.hotelKinds;
      apiFilters.hotel_kinds = filters.hotelKinds;
    }

    // Residency
    if (filters.residency && filters.residency !== "US") apiFilters.residency = filters.residency.toLowerCase();

    // Return undefined if no filters are active
    return Object.keys(apiFilters).length > 0 ? apiFilters : undefined;
  }

  /**
   * Enrich hotels with static data by querying hotels_static table directly
   * This is needed because searches go to external Render server which doesn't have Supabase access
   */
  private async enrichFromSupabase(hotels: any[]): Promise<any[]> {
    if (!hotels || hotels.length === 0) return hotels;

    // Extract numeric hids from hotels
    const hids = hotels
      .map(h => h.hid)
      .filter(hid => hid !== undefined && hid !== null)
      .map(hid => typeof hid === 'number' ? hid : parseInt(String(hid), 10))
      .filter(hid => !isNaN(hid));

    if (hids.length === 0) {
      console.log('⚠️ No valid hids found for enrichment');
      return hotels;
    }

    let enrichedHotels = [...hotels];

    try {
      console.log(`🔍 Enriching ${hids.length} hotels from hotels_static...`);
      
      // Query hotels_static table directly (max 100 to avoid query limits)
      const { data: staticData, error } = await (supabase as any)
        .from('hotels_static')
        .select('hid, name, address, region_name, country_code, star_rating, latitude, longitude, amenities, description')
        .in('hid', hids.slice(0, 100));

      if (error) {
        console.warn('⚠️ Enrichment query failed:', error.message);
      } else if (staticData && staticData.length > 0) {
        console.log(`✅ Enrichment: ${staticData.length}/${hids.length} hotels matched in hotels_static`);

        // Create lookup map by hid
        const staticMap = new Map((staticData as any[]).map((s: any) => [s.hid, s]));

        // Merge static data into hotels
        enrichedHotels = enrichedHotels.map(hotel => {
          const hid = typeof hotel.hid === 'number' ? hotel.hid : parseInt(String(hotel.hid), 10);
          const staticInfo = staticMap.get(hid) as any;
          
          if (staticInfo) {
            return {
              ...hotel,
              static_data: {
                name: staticInfo.name,
                address: staticInfo.address,
                city: staticInfo.region_name,
                country: staticInfo.country_code,
                star_rating: staticInfo.star_rating,
                coordinates: staticInfo.latitude && staticInfo.longitude 
                  ? { lat: staticInfo.latitude, lon: staticInfo.longitude } 
                  : undefined,
                amenities: staticInfo.amenities || [],
                description: staticInfo.description,
              },
            };
          }
          return hotel;
        });
      } else {
        console.log('⚠️ No matches found in hotels_static');
      }
    } catch (err) {
      console.error('❌ Enrichment error:', err);
    }

    // Step 2: WorldOTA API fallback for unenriched hotels
    enrichedHotels = await this.enrichFromWorldOTA(enrichedHotels);

    return enrichedHotels;
  }

  /**
   * Fetch hotel info from WorldOTA API for hotels not found in hotels_static
   * Rate limit: 30 requests per 60 seconds - using sequential fetching with delays
   */
  private async enrichFromWorldOTA(hotels: any[]): Promise<any[]> {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Find hotels still missing city data
    const unenrichedHotels = hotels.filter(
      h => !h.static_data?.city && h.hid
    );

    if (unenrichedHotels.length === 0) {
      return hotels;
    }

    // Limit to 10 hotels to stay well under 30/min rate limit
    const hotelsToFetch = unenrichedHotels.slice(0, 10);
    console.log(`🔍 Fetching ${hotelsToFetch.length} hotels from WorldOTA API (throttled)...`);

    const results: Array<{hid: number, data: any}> = [];
    
    // Sequential fetching with 2-second delay between requests
    for (const hotel of hotelsToFetch) {
      try {
        const hid = typeof hotel.hid === 'number' 
          ? hotel.hid 
          : parseInt(String(hotel.hid), 10);
        
        const response = await fetch(
          `https://travelapi-bg6t.onrender.com/api/ratehawk/hotel/static-info/${hid}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            results.push({ hid, data: data.hotel });
            console.log(`✅ Enriched: ${data.hotel.name}`);
          }
        } else if (response.status === 429) {
          console.warn('⚠️ Rate limit hit, stopping WorldOTA enrichment');
          break; // Stop fetching if rate limited
        }
        
        // Wait 2 seconds between requests (30 req/min = 2 sec spacing)
        if (hotelsToFetch.indexOf(hotel) < hotelsToFetch.length - 1) {
          await delay(2000);
        }
        
      } catch (err) {
        console.warn(`⚠️ Failed to fetch hotel ${hotel.hid}:`, err);
      }
    }

    if (results.length === 0) {
      console.log('⚠️ No hotels enriched from WorldOTA API');
      return hotels;
    }

    const apiMap = new Map(results.map(r => [r.hid, r.data]));
    console.log(`✅ API enrichment: ${apiMap.size}/${hotelsToFetch.length} hotels enriched`);

    // Merge API data into hotels
    return hotels.map(hotel => {
      const hid = typeof hotel.hid === 'number' 
        ? hotel.hid 
        : parseInt(String(hotel.hid), 10);

      if (!hotel.static_data?.city && apiMap.has(hid)) {
        const apiData = apiMap.get(hid);
        return {
          ...hotel,
          static_data: {
            ...hotel.static_data,
            city: apiData.city,
            country: apiData.country,
            star_rating: apiData.star_rating || hotel.rating,
            address: apiData.address,
            coordinates: apiData.latitude && apiData.longitude
              ? { lat: apiData.latitude, lon: apiData.longitude }
              : undefined,
            images: apiData.images || hotel.static_data?.images,
          },
        };
      }
      return hotel;
    });
  }

  /**
   * PUBLIC: Enrich a batch of hotels with static data (called from display layer)
   * This enables lazy enrichment - only enrich hotels that are about to be displayed
   */
  async enrichHotelBatch(hotels: Hotel[]): Promise<Hotel[]> {
    if (!hotels || hotels.length === 0) return hotels;
    
    console.log(`🔍 Enriching batch of ${hotels.length} hotels...`);
    
    // Convert Hotel[] to any[] for enrichment
    const hotelData = hotels.map(h => ({
      ...h,
      hid: (h as any).hid || (h as any).hotel_id,
    }));
    
    const enrichedData = await this.enrichFromSupabase(hotelData);
    
    // Apply destination fallback if we have destination info
    const destination = (hotels[0] as any)?.static_data?.city || '';
    const finalData = this.applyDestinationFallback({ hotels: enrichedData }, destination);
    
    // Transform back to Hotel type
    return finalData.hotels.map((h: any) => this.transformHotelData(h));
  }

  /**
   * Enrich hotels with static data and apply destination fallback
   */
  private async enrichHotelsWithStaticData(data: any, destination?: string): Promise<any> {
    if (!data?.hotels?.length) return data;

    // Enrich hotels directly from Supabase hotels_static table
    data.hotels = await this.enrichFromSupabase(data.hotels);

    // Apply destination fallback for any hotels that didn't get enriched
    return this.applyDestinationFallback(data, destination);
  }

  /**
   * Apply destination as fallback city for hotels without static_data
   */
  private applyDestinationFallback(data: any, destination?: string): any {
    if (!data?.hotels || !destination) return data;
    
    const destinationCity = destination.split(',')[0]?.trim() || "";
    if (!destinationCity) return data;

    data.hotels = data.hotels.map((hotel: any) => {
      if (!hotel.static_data && destinationCity) {
        return {
          ...hotel,
          static_data: {
            city: destinationCity,
            country: "",
            star_rating: hotel.rating || 0,
          },
        };
      }
      return hotel;
    });

    return data;
  }

  // Auto-lookup region_id from destination string
  private async lookupRegionId(destination: string): Promise<number | null> {
    try {
      console.log(`🔍 Auto-looking up region_id for: "${destination}"`);
      
      const response = await fetch(`${API_BASE_URL}/api/destination`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: destination }),
      });

      if (!response.ok) {
        console.error("❌ Destination lookup failed:", response.status);
        return this.resolveFromFallback(destination);
      }

      const data = await response.json();

      // Support NEW format: { status: "ok", data: { destinations: [...] } }
      const newFormatRegion = data?.data?.destinations?.[0];
      if (newFormatRegion?.region_id) {
        const regionId = newFormatRegion.region_id;
        console.log(`✅ Found region_id (new format): ${regionId} for "${destination}"`);
        return regionId;
      }

      // Support LEGACY format: { regions: [...] }
      const legacyRegion = data?.regions?.[0];
      if (legacyRegion?.id) {
        const regionId = parseInt(legacyRegion.id, 10);
        console.log(`✅ Found region_id (legacy format): ${regionId} for "${destination}"`);
        return regionId;
      }

      console.warn(`⚠️ No region_id from API for "${destination}", trying local fallback`);
      return this.resolveFromFallback(destination);
    } catch (error) {
      console.error("❌ Error looking up region_id:", error);
      return this.resolveFromFallback(destination);
    }
  }

  async searchHotels(params: SearchParams, page: number = 1, filters?: SearchFilters): Promise<SearchResponse> {
    console.log(`🧪 searchHotels() build=${RATEHAWK_API_BUILD} start`);
    const userId = this.getCurrentUserId();

    // VALIDATION: Fail early with helpful errors
    const rawDestination = params.destination?.trim();
    if (!rawDestination) {
      throw new Error("Please select a destination");
    }

    if (!params.checkIn || !params.checkOut) {
      throw new Error("Please select check-in and check-out dates");
    }

    if (new Date(this.formatDate(params.checkIn)) >= new Date(this.formatDate(params.checkOut))) {
      throw new Error("Check-out must be after check-in");
    }

    // Get regionId if available
    const hasValidRegionId = params.destinationId && /^\d+$/.test(params.destinationId);
    const regionId = hasValidRegionId ? parseInt(params.destinationId!, 10) : null;
    
    // Prepare destination variants
    const fullDestination = rawDestination;
    const simplifiedDestination = rawDestination.includes(",") 
      ? rawDestination.split(",")[0].trim() 
      : rawDestination;

    // Format guests as array of room objects (required by backend)
    const guestsPerRoom = Math.max(1, Math.floor(params.guests / params.rooms));
    const guests = Array.from({ length: params.rooms }, (_, index) => {
      const baseAdults = guestsPerRoom;
      const extraAdult = index < params.guests % params.rooms ? 1 : 0;
      return {
        adults: baseAdults + extraAdult,
        children: params.childrenAges || [],
      };
    });

    // Base request body (shared across attempts)
    const residency = filters?.residency?.toLowerCase() || "us";
    
    // Check for debug mode via URL param
    const urlParams = new URLSearchParams(window.location.search);
    const debugMode = urlParams.get('debug') === '1';
    
    const baseBody: Record<string, unknown> = {
      userId,
      checkin: this.formatDate(params.checkIn),
      checkout: this.formatDate(params.checkOut),
      guests,
      page,
      // Reduced to avoid WORKER_LIMIT errors
      limit: 30,
      currency: "USD",
      residency,
      // Debug flags - bypass cache and get enrichment diagnostics
      noCache: debugMode,
      debug: debugMode,
    };

    if (regionId) {
      // Send ALL possible field names for maximum backend compatibility
      baseBody.regionId = regionId;
      baseBody.region_id = regionId;
      baseBody.destId = regionId;        // Backend may expect this
      baseBody.destinationId = regionId; // Alternative name
    }

    // Add filters if provided
    const apiFilters = this.transformFiltersForApi(filters);
    if (apiFilters) {
      baseBody.filters = apiFilters;
    }

    // Define search attempts - try different request shapes
    type SearchAttempt = { label: string; body: Record<string, unknown> };
    const attempts: SearchAttempt[] = [];

    if (regionId) {
      // Always include destination for edge function fallback enrichment
      // Attempt 1: regionId + full destination (best chance for enrichment fallback)
      attempts.push({
        label: "regionId + full destination",
        body: { ...baseBody, destination: fullDestination },
      });
      // Attempt 2: regionId + simplified destination
      if (simplifiedDestination !== fullDestination) {
        attempts.push({
          label: "regionId + simplified destination",
          body: { ...baseBody, destination: simplifiedDestination },
        });
      }
      // Attempt 3: regionId only (no destination) - last resort
      attempts.push({
        label: "regionId only (no destination)",
        body: { ...baseBody },
      });
    } else {
      // No regionId - try to auto-lookup first
      console.log(`⚠️ No valid region_id, auto-looking up for: "${fullDestination}"`);
      const lookedUpRegionId = await this.lookupRegionId(fullDestination);

      if (lookedUpRegionId) {
        baseBody.regionId = lookedUpRegionId;
        baseBody.region_id = lookedUpRegionId;
        attempts.push({
          label: "auto-lookup regionId + full destination",
          body: { ...baseBody, destination: fullDestination },
        });
      }

      // Fallback: destination string only
      attempts.push({
        label: "destination only (simplified)",
        body: { ...baseBody, destination: simplifiedDestination },
      });
    }

    // Execute search attempts - CALL RENDER DIRECTLY to avoid WORKER_LIMIT
    let lastError: Error | null = null;
    let isRegionNotFoundError = false;

    for (let i = 0; i < attempts.length; i++) {
      const attempt = attempts[i];
      console.log(`🧪 Region search attempt ${i + 1}/${attempts.length}: ${attempt.label}`);
      console.log("🔍 Search Request (DIRECT TO RENDER):", {
        destination: attempt.body.destination,
        regionId: attempt.body.regionId,
        page,
        limit: (attempt.body as any).limit,
        residency,
        hasFilters: !!apiFilters,
      });

      try {
        // STEP 1: Call Render API directly (avoids edge function WORKER_LIMIT)
        const directData = await this.fetchWithError<any>(`${API_BASE_URL}/api/ratehawk/search`, {
          method: "POST",
          body: JSON.stringify(attempt.body),
        });

        // Check for API-level errors
        if (directData?.error) {
          const errorMessage = directData.error;
          console.error(`❌ Attempt ${i + 1} failed:`, errorMessage);
          lastError = new Error(errorMessage);
          
          const lowerError = errorMessage.toLowerCase();
          isRegionNotFoundError = lowerError.includes("could not find region");
          
          if (isRegionNotFoundError && i < attempts.length - 1) {
            console.log(`🔄 Recoverable error, trying next attempt...`);
            continue;
          }
          
          if (!isRegionNotFoundError) throw lastError;
          continue;
        }

        console.log(`✅ Direct search succeeded:`, {
          hotels: directData.hotels?.length || 0,
          total: directData.total,
        });

        // Return raw hotels WITHOUT enrichment - enrichment happens in display layer
        // Just parse the response and apply destination fallback for minimal data
        const parsedData = this.applyDestinationFallback(directData, attempt.body.destination as string);

        return this.parseSearchResponse(parsedData, page);
      } catch (error) {
        if (error instanceof Error && !error.message.includes("could not find region")) {
          throw error;
        }
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }

    // All region attempts failed - try Geo fallback if it was a region error
    if (isRegionNotFoundError) {
      console.log(`🌍 All region attempts failed, trying Geo fallback for: "${rawDestination}"`);
      
      const coords = await geocodePlace(rawDestination);
      if (coords) {
        console.log(`📍 Geo fallback: searching near ${coords.lat}, ${coords.lon}`);
        
        try {
          const geoResult = await this.searchByGeo({
            latitude: coords.lat,
            longitude: coords.lon,
            checkin: params.checkIn,
            checkout: params.checkOut,
            guests,
            radius: 10000, // 10km radius for city search
            residency,
            currency: "USD",
          });
          
          console.log(`✅ Geo fallback succeeded: ${geoResult.hotels.length} hotels`);
          return geoResult;
        } catch (geoError) {
          console.error("❌ Geo fallback also failed:", geoError);
          // Fall through to throw original error
        }
      }
    }

    // All attempts failed
    console.error("❌ All search attempts failed");
    throw lastError || new Error("Search failed after all attempts");
  }

  /**
   * Parse raw search response into SearchResponse format
   */
  private parseSearchResponse(data: any, page: number): SearchResponse {
    // Check if response indicates an error
    if (data && typeof data === 'object' && 'error' in data) {
      throw new Error(data.error || data.details || "Search failed");
    }

    const rawResponse = data as {
      success: boolean;
      hotels: any[];
      total?: number;
      hasMore?: boolean;
      page?: number;
    };

    console.log("✅ Search Response:", {
      hotels: rawResponse.hotels?.length || 0,
      total: rawResponse.total,
      page: rawResponse.page,
      hasMore: rawResponse.hasMore,
    });

    // Debug: Log first hotel structure
    if (rawResponse.hotels?.length > 0) {
      const sample = rawResponse.hotels[0];
      console.log("📦 Sample hotel structure:", {
        topLevelKeys: Object.keys(sample),
        hotel_id: sample.hotel_id,
        id: sample.id,
        name: sample.name,
        hasStaticVm: !!sample.static_vm,
      });
    }

    // Transform backend response to match Hotel type
    const hotels: Hotel[] = (rawResponse.hotels || []).map((h: any) => {
      const hotelId = h.hotel_id || h.id;
      const staticData = h.static_data || {};
      const staticVm = h.static_vm || h.ratehawk_data?.static_vm;
      
      const humanizeSlug = (slug: string): string => {
        return slug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
      };
      
      const rawName = staticData.name || h.name || staticVm?.name;
      const hotelName = rawName && rawName.trim() ? rawName : humanizeSlug(hotelId);
      
      const amenityStrings = h.amenities || staticVm?.amenities || [];
      
      const rates = h.rates || h.ratehawk_data?.rates || [];
      let priceFrom = 0;
      let currency = "USD";
      
      if (rates.length > 0) {
        const prices = rates.map((rate: any) => {
          const paymentType = rate.payment_options?.payment_types?.[0];
          const amount = parseFloat(paymentType?.show_amount || paymentType?.amount || '0');
          return { amount, currency: paymentType?.show_currency_code || paymentType?.currency_code || 'USD' };
        }).filter((p: any) => p.amount > 0);
        
        if (prices.length > 0) {
          const lowestPrice = prices.reduce((min: any, p: any) => p.amount < min.amount ? p : min, prices[0]);
          priceFrom = lowestPrice.amount;
          currency = lowestPrice.currency;
        }
      }
      
      if (priceFrom === 0 && h.price?.amount) {
        priceFrom = h.price.amount;
        currency = h.price.currency || "USD";
      }
      
      let images: Array<{ url: string; alt: string }> = [];
      
      if (staticData.images && staticData.images.length > 0) {
        images = staticData.images.slice(0, 10).map((url: string) => {
          let processedUrl = typeof url === 'string' ? url : '';
          if (processedUrl.includes('{size}')) {
            processedUrl = processedUrl.replace('{size}', '640x400');
          }
          return { url: processedUrl, alt: hotelName };
        }).filter((img: any) => img.url && img.url.length > 30);
      }
      
      if (images.length === 0 && staticVm?.images?.length > 0) {
        images = staticVm.images.slice(0, 10).map((img: any) => {
          const url = typeof img === 'string' 
            ? img.replace('{size}', '640x400')
            : img.tmpl?.replace("{size}", "640x400") || img.url || "";
          return { url, alt: hotelName };
        }).filter((img: any) => img.url && img.url.length > 30);
      }
      
      const mainImage = images[0]?.url || h.image || "/placeholder.svg";
      
      const hasFreeCancellation = h.freeCancellation || 
        rates.some((r: any) => r.free_cancellation === true || r.cancellationPolicy?.toLowerCase().includes("free"));
      const mealPlan = h.mealPlan || rates[0]?.meal || rates[0]?.meal_data?.name;
      const paymentTypes = rates[0]?.payment_options?.payment_types?.map((p: any) => p.type) || [];

      const address = staticData.address || staticVm?.address || h.location || "";
      const regionName = staticVm?.region?.name || "";
      
      let cityFromAddress = "";
      if (address && !regionName && !staticData.city) {
        const addressParts = address.split(',').map((p: string) => p.trim());
        if (addressParts.length >= 2) {
          const lastPart = addressParts[addressParts.length - 1];
          cityFromAddress = /^\d/.test(lastPart) ? addressParts[addressParts.length - 2] || "" : lastPart;
        }
      }
      
      const city = staticData.city || regionName || cityFromAddress || "";
      const country = staticData.country || staticVm?.region?.country_code || "";
      
      let starRating = 0;
      if (staticData.star_rating) {
        starRating = staticData.star_rating;
      } else if (staticVm?.star_rating) {
        starRating = staticVm.star_rating > 5 ? Math.round(staticVm.star_rating / 10) : staticVm.star_rating;
      } else if (h.rating) {
        starRating = h.rating;
      }

      const latitude = staticData.coordinates?.lat || staticVm?.latitude;
      const longitude = staticData.coordinates?.lon || staticVm?.longitude;

      return {
        id: hotelId,
        hotel_id: hotelId, // Add alias for backward compatibility with database/enrichment
        name: hotelName,
        description: staticVm?.description || h.description || "",
        address,
        city,
        country,
        starRating,
        reviewScore: staticVm?.rating || h.reviewScore,
        reviewCount: staticVm?.review_count || h.reviewCount || 0,
        images,
        mainImage,
        amenities: amenityStrings.map((a: string, idx: number) => ({ id: `amenity-${idx}`, name: a })),
        priceFrom,
        currency,
        latitude,
        longitude,
        ratehawk_data: {
          ...h,
          static_vm: staticVm,
        },
        freeCancellation: hasFreeCancellation,
        mealPlan,
        paymentTypes,
      } as Hotel;
    });

    const totalResults = rawResponse.total || hotels.length;
    const hasMore = rawResponse.hasMore ?? (hotels.length === 50);

    return {
      hotels,
      totalResults,
      hasMore,
      nextPage: page + 1,
      currentPage: page,
    };
  }

  // ===== NEW SEARCH METHODS =====

  /**
   * Search hotels by Point of Interest name (e.g., "The Forum in Inglewood")
   */
  async searchByPOI(params: POISearchParams): Promise<SearchResponse> {
    const userId = this.getCurrentUserId();

    if (!params.poiName?.trim()) {
      throw new Error("Please enter a point of interest name");
    }

    if (!params.checkin || !params.checkout) {
      throw new Error("Please select check-in and check-out dates");
    }

    const requestBody = {
      userId,
      poiName: params.poiName.trim(),
      checkin: this.formatDate(params.checkin),
      checkout: this.formatDate(params.checkout),
      guests: params.guests,
      radius: params.radius || 5000,
      residency: params.residency?.toLowerCase() || "us",
      currency: params.currency || "USD",
    };

    console.log("🔍 POI Search Request:", requestBody);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ratehawk/search/by-poi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error("❌ POI Search error:", response.status);
        throw new Error(`POI search failed: ${response.status}`);
      }

      const data = await response.json();
      return this.transformSearchResponse(data);
    } catch (error) {
      console.error("❌ POI Search failed:", error);
      throw error;
    }
  }

  /**
   * Search hotels by geographic coordinates (lat/lon)
   */
  async searchByGeo(params: GeoSearchParams): Promise<SearchResponse> {
    const userId = this.getCurrentUserId();

    if (params.latitude === undefined || params.longitude === undefined) {
      throw new Error("Please provide coordinates");
    }

    if (!params.checkin || !params.checkout) {
      throw new Error("Please select check-in and check-out dates");
    }

    const requestBody = {
      userId,
      latitude: params.latitude,
      longitude: params.longitude,
      checkin: this.formatDate(params.checkin),
      checkout: this.formatDate(params.checkout),
      guests: params.guests,
      radius: params.radius || 5000,
      residency: params.residency?.toLowerCase() || "us",
      currency: params.currency || "USD",
    };

    console.log("🔍 Geo Search Request:", requestBody);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ratehawk/search/by-geo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error("❌ Geo Search error:", response.status);
        throw new Error(`Geo search failed: ${response.status}`);
      }

      const data = await response.json();
      return this.transformSearchResponse(data);
    } catch (error) {
      console.error("❌ Geo Search failed:", error);
      throw error;
    }
  }

  /**
   * Search hotels by hotel IDs (for favorites/saved hotels)
   */
  async searchByIds(params: IdsSearchParams): Promise<SearchResponse> {
    const userId = this.getCurrentUserId();

    if (!params.hotelIds || params.hotelIds.length === 0) {
      throw new Error("Please select at least one hotel");
    }

    if (!params.checkin || !params.checkout) {
      throw new Error("Please select check-in and check-out dates");
    }

    const requestBody = {
      userId,
      ids: params.hotelIds,
      hids: params.hotelIds, // Send both formats for backend compatibility
      checkin: this.formatDate(params.checkin),
      checkout: this.formatDate(params.checkout),
      guests: params.guests,
      residency: params.residency?.toLowerCase() || "us",
      currency: params.currency || "USD",
    };

    console.log("🔍 IDs Search Request:", requestBody);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ratehawk/search/by-ids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error("❌ IDs Search error:", response.status);
        throw new Error(`IDs search failed: ${response.status}`);
      }

      const data = await response.json();
      return this.transformSearchResponse(data);
    } catch (error) {
      console.error("❌ IDs Search failed:", error);
      throw error;
    }
  }

  /**
   * Transform raw API response to SearchResponse format
   * Shared by all search methods
   */
  private transformSearchResponse(data: any): SearchResponse {
    // Check if response indicates an error
    if (data && typeof data === 'object' && 'error' in data) {
      throw new Error(data.error || data.details || "Search failed");
    }

    const rawResponse = data as {
      success: boolean;
      hotels: any[];
      total?: number;
      hasMore?: boolean;
      page?: number;
    };

    // Use the same hotel transformation logic as searchHotels
    const hotels: Hotel[] = (rawResponse.hotels || []).map((h: any) => this.transformHotelData(h));

    const totalResults = rawResponse.total || hotels.length;
    const hasMore = rawResponse.hasMore ?? false;

    return {
      hotels,
      totalResults,
      hasMore,
      nextPage: (rawResponse.page || 1) + 1,
      currentPage: rawResponse.page || 1,
    };
  }

  /**
   * Transform raw hotel data to Hotel type
   * Extracted for reuse across search methods
   */
  private transformHotelData(h: any): Hotel {
    const hotelId = h.hotel_id || h.id;
    const staticData = h.static_data || {};
    const staticVm = h.static_vm || h.ratehawk_data?.static_vm;

    const humanizeSlug = (slug: string): string => {
      return slug
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .trim();
    };

    const rawName = staticData.name || h.name || staticVm?.name;
    const hotelName = rawName && rawName.trim() ? rawName : humanizeSlug(hotelId);

    const amenityStrings = h.amenities || staticVm?.amenities || [];
    const rates = h.rates || h.ratehawk_data?.rates || [];
    
    let priceFrom = 0;
    let currency = "USD";

    if (rates.length > 0) {
      const prices = rates.map((rate: any) => {
        const paymentType = rate.payment_options?.payment_types?.[0];
        const amount = parseFloat(paymentType?.show_amount || paymentType?.amount || '0');
        return { amount, currency: paymentType?.show_currency_code || paymentType?.currency_code || 'USD' };
      }).filter((p: any) => p.amount > 0);

      if (prices.length > 0) {
        const lowestPrice = prices.reduce((min: any, p: any) => p.amount < min.amount ? p : min, prices[0]);
        priceFrom = lowestPrice.amount;
        currency = lowestPrice.currency;
      }
    }

    if (priceFrom === 0 && h.price?.amount) {
      priceFrom = h.price.amount;
      currency = h.price.currency || "USD";
    }

    let images: Array<{ url: string; alt: string }> = [];

    if (staticData.images && staticData.images.length > 0) {
      images = staticData.images.slice(0, 10).map((url: string) => {
        let processedUrl = typeof url === 'string' ? url : '';
        if (processedUrl.includes('{size}')) {
          processedUrl = processedUrl.replace('{size}', '640x400');
        }
        return { url: processedUrl, alt: hotelName };
      }).filter((img: any) => img.url && img.url.length > 30);
    }

    if (images.length === 0 && staticVm?.images?.length > 0) {
      images = staticVm.images.slice(0, 10).map((img: any) => {
        const url = typeof img === 'string'
          ? img.replace('{size}', '640x400')
          : img.tmpl?.replace("{size}", "640x400") || img.url || "";
        return { url, alt: hotelName };
      }).filter((img: any) => img.url && img.url.length > 30);
    }

    const mainImage = images[0]?.url || h.image || "/placeholder.svg";

    const hasFreeCancellation = h.freeCancellation ||
      rates.some((r: any) => r.free_cancellation === true || r.cancellationPolicy?.toLowerCase().includes("free"));
    const mealPlan = h.mealPlan || rates[0]?.meal || rates[0]?.meal_data?.name;
    const paymentTypes = rates[0]?.payment_options?.payment_types?.map((p: any) => p.type) || [];

    const address = staticData.address || staticVm?.address || h.location || "";
    const regionName = staticVm?.region?.name || "";

    let cityFromAddress = "";
    if (address && !regionName && !staticData.city) {
      const addressParts = address.split(',').map((p: string) => p.trim());
      if (addressParts.length >= 2) {
        const lastPart = addressParts[addressParts.length - 1];
        cityFromAddress = /^\d/.test(lastPart) ? addressParts[addressParts.length - 2] || "" : lastPart;
      }
    }

    const city = staticData.city || regionName || cityFromAddress || "";
    const country = staticData.country || staticVm?.region?.country_code || "";

    let starRating = 0;
    if (staticData.star_rating) {
      starRating = staticData.star_rating;
    } else if (staticVm?.star_rating) {
      starRating = staticVm.star_rating > 5 ? Math.round(staticVm.star_rating / 10) : staticVm.star_rating;
    } else if (h.rating) {
      starRating = h.rating;
    }

    const latitude = staticData.coordinates?.lat || staticVm?.latitude;
    const longitude = staticData.coordinates?.lon || staticVm?.longitude;

    return {
      id: hotelId,
      name: hotelName,
      description: staticVm?.description || h.description || "",
      address,
      city,
      country,
      starRating,
      reviewScore: staticVm?.rating || h.reviewScore,
      reviewCount: staticVm?.review_count || h.reviewCount || 0,
      images,
      mainImage,
      amenities: amenityStrings.map((a: string, idx: number) => ({ id: `amenity-${idx}`, name: a })),
      priceFrom,
      currency,
      latitude,
      longitude,
      ratehawk_data: {
        ...h,
        static_vm: staticVm,
      },
      freeCancellation: hasFreeCancellation,
      mealPlan,
      paymentTypes,
    } as Hotel;
  }

  async getHotelDetails(hotelId: string, searchParams?: SearchParams): Promise<HotelDetails | null> {
    console.warn("getHotelDetails: Backend endpoint not available. Use localStorage instead.");
    return null;
  }

  async getRoomRates(hotelId: string, searchParams: SearchParams): Promise<RoomRate[]> {
    console.log("📦 getRoomRates: Using stored rate data from hotel search results");
    return [];
  }

  // Helper to extract price from rate payment options
  private extractPriceFromRate(rate: RateHawkRate): number {
    const paymentType = rate.payment_options?.payment_types?.[0];
    if (paymentType) {
      const amount = paymentType.show_amount || paymentType.amount;
      if (amount) {
        return parseFloat(String(amount));
      }
    }
    // Fallback to daily_prices sum
    if (rate.daily_prices) {
      const prices = Array.isArray(rate.daily_prices) ? rate.daily_prices : [rate.daily_prices];
      return prices.reduce((sum, price) => sum + parseFloat(String(price)), 0);
    }
    return 0;
  }

  // Helper to extract currency from rate
  private extractCurrencyFromRate(rate: RateHawkRate): string {
    const paymentType = rate.payment_options?.payment_types?.[0];
    return paymentType?.show_currency_code || paymentType?.currency_code || "USD";
  }

  // Popular destinations fallback for when API has CORS issues or returns empty
  // IDs verified from RateHawk API response logs
  private static POPULAR_DESTINATIONS: Destination[] = [
    // US Major Cities
    { id: "2011", name: "Los Angeles", country: "California, United States", type: "city" },
    { id: "2621", name: "Las Vegas", country: "Nevada, United States", type: "city" },
    { id: "2007", name: "New York", country: "New York, United States", type: "city" },
    { id: "2008", name: "Miami", country: "Florida, United States", type: "city" },
    { id: "2012", name: "San Francisco", country: "California, United States", type: "city" },
    { id: "2015", name: "Chicago", country: "Illinois, United States", type: "city" },
    { id: "2620", name: "Orlando", country: "Florida, United States", type: "city" },
    { id: "2622", name: "Honolulu", country: "Hawaii, United States", type: "city" },
    // Phoenix verified from logs: id: 2790
    { id: "2790", name: "Phoenix", country: "Arizona, United States", type: "city" },
    { id: "2013", name: "Seattle", country: "Washington, United States", type: "city" },
    { id: "2014", name: "Denver", country: "Colorado, United States", type: "city" },
    { id: "2016", name: "Boston", country: "Massachusetts, United States", type: "city" },
    { id: "2017", name: "Atlanta", country: "Georgia, United States", type: "city" },
    { id: "2018", name: "Dallas", country: "Texas, United States", type: "city" },
    { id: "2019", name: "Houston", country: "Texas, United States", type: "city" },
    { id: "2020", name: "San Diego", country: "California, United States", type: "city" },
    { id: "2021", name: "Philadelphia", country: "Pennsylvania, United States", type: "city" },
    { id: "2022", name: "Washington D.C.", country: "District of Columbia, United States", type: "city" },
    { id: "2623", name: "Nashville", country: "Tennessee, United States", type: "city" },
    { id: "2624", name: "Austin", country: "Texas, United States", type: "city" },
    { id: "2625", name: "New Orleans", country: "Louisiana, United States", type: "city" },
    { id: "2626", name: "Portland", country: "Oregon, United States", type: "city" },
    { id: "2627", name: "San Antonio", country: "Texas, United States", type: "city" },
    // International
    { id: "2114", name: "London", country: "United Kingdom", type: "city" },
    { id: "2734", name: "Paris", country: "France", type: "city" },
    { id: "2741", name: "Rome", country: "Italy", type: "city" },
    { id: "2731", name: "Barcelona", country: "Spain", type: "city" },
    { id: "3014", name: "Dubai", country: "United Arab Emirates", type: "city" },
    { id: "3016", name: "Tokyo", country: "Japan", type: "city" },
    { id: "2629", name: "Cancun", country: "Mexico", type: "city" },
    { id: "2933", name: "Nassau", country: "Bahamas", type: "city" },
    { id: "2739", name: "Amsterdam", country: "Netherlands", type: "city" },
    { id: "3224", name: "Sydney", country: "Australia", type: "city" },
    { id: "3108", name: "Bangkok", country: "Thailand", type: "city" },
    { id: "3125", name: "Singapore", country: "Singapore", type: "city" },
  ];

  // Normalize query for fallback matching (handles "Phoenix, AZ" -> "phoenix")
  private normalizeQueryForFallback(query: string): string {
    let normalized = query.toLowerCase().trim();
    
    // If contains comma, use part before comma (city name)
    if (normalized.includes(',')) {
      normalized = normalized.split(',')[0].trim();
    }
    
    // Remove common state abbreviations that might confuse matching
    normalized = normalized.replace(/\s+(az|ca|ny|fl|tx|nv|wa|co|ma|ga|pa|dc|il|hi|tn|la|or)$/i, '');
    
    return normalized;
  }

  // Get fallback destinations when API returns empty or fails
  private getFallbackDestinations(query: string): Destination[] {
    const normalizedQuery = this.normalizeQueryForFallback(query);
    
    // Filter popular destinations by normalized query
    const matches = RateHawkApiService.POPULAR_DESTINATIONS.filter((dest) => {
      const destNameLower = dest.name.toLowerCase();
      const destCountryLower = dest.country.toLowerCase();
      
      // Match against city name or country/state
      return destNameLower.includes(normalizedQuery) || 
             destCountryLower.includes(normalizedQuery) ||
             normalizedQuery.includes(destNameLower);
    });

    // If we found matches, return them
    if (matches.length > 0) {
      console.log(`📍 Fallback: Found ${matches.length} matching destinations for "${query}" (normalized: "${normalizedQuery}")`);
      return matches;
    }

    // No matches - return a "search this location" option so user can still proceed
    console.log(`📍 Fallback: No matches for "${query}", returning search option`);
    return [
      { id: "", name: query, country: "Search this location", type: "city" }
    ];
  }

  // Try to resolve region ID from fallback destinations
  private resolveFromFallback(destination: string): number | null {
    const normalizedQuery = this.normalizeQueryForFallback(destination);
    
    const match = RateHawkApiService.POPULAR_DESTINATIONS.find((dest) => {
      const destNameLower = dest.name.toLowerCase();
      return destNameLower === normalizedQuery || destNameLower.includes(normalizedQuery);
    });
    
    if (match && match.id) {
      console.log(`📍 Fallback resolution: "${destination}" → regionId: ${match.id}`);
      return parseInt(match.id, 10);
    }
    
    return null;
  }

  async getDestinations(query: string, signal?: AbortSignal): Promise<Destination[]> {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/destination`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal,
      });

      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      if (!response.ok) {
        console.error("❌ Destination API error:", response.status);
        throw new Error(`Destination lookup failed: ${response.status}`);
      }

      const data = await response.json();

      if (data?.error) {
        const errorMsg = String(data.error);
        if (errorMsg.includes('aborted') || errorMsg.includes('Aborted') || errorMsg.includes('timeout')) {
          throw new DOMException('Aborted', 'AbortError');
        }
        console.warn('⚠️ Destination API returned error:', data.error);
        throw new Error(data.error);
      }

      const isNewFormat = data?.status === 'ok' && data?.data?.destinations;
      let suggestions: Destination[] = [];

      if (isNewFormat) {
        const meta = data.meta || {};
        console.log(`🔍 Destination API response (cache: ${meta.from_cache}, ${meta.duration_ms}ms):`, data.data.destinations.length, 'results');

        suggestions = (data.data.destinations || []).map((dest: {
          label: string;
          region_id: number;
          type: string;
          country_code?: string;
          country_name?: string;
        }) => {
          const labelParts = dest.label.split(',').map(p => p.trim());
          let displayName = labelParts[0];
          if (labelParts.length >= 2 && dest.country_code === 'US') {
            displayName = `${labelParts[0]}, ${labelParts[1]}`;
          }
          const displayParts = displayName.split(',').length;
          const remainingParts = labelParts.slice(displayParts).join(', ');

          return {
            id: String(dest.region_id),
            name: displayName,
            country: dest.country_name || remainingParts || '',
            type: dest.type?.toLowerCase().includes('city') ? 'city' : 'region',
          };
        });
      } else {
        const response = data as {
          hotels?: Array<{
            otahotel_id?: string;
            id?: string;
            hid?: number;
            hotel_name?: string;
            name?: string;
            region_id?: string;
            region_name?: string;
            country_name?: string;
            country?: string;
            slug?: string;
          }>;
          regions?: Array<{
            id: number;
            name: string;
            country?: string;
            country_code?: string;
            type?: string;
            slug?: string;
          }>;
        };

        console.log('🔍 Destination API response (legacy format):', response);

        const regionDestinations: Destination[] = (response.regions || [])
          .filter((region) => region.name)
          .map((region) => ({
            id: String(region.id),
            name: region.name,
            country: region.country || region.country_code || '',
            type: region.type?.toLowerCase().includes("city") ? "city" : "region",
          }));

        const hotelDestinations: Destination[] = (response.hotels || [])
          .slice(0, 3)
          .filter((hotel) => (hotel.hotel_name || hotel.name) && hotel.region_id)
          .map((hotel) => ({
            id: hotel.region_id || '', // Use region_id so search works
            name: hotel.hotel_name || hotel.name || 'Unknown Hotel',
            country: hotel.region_name 
              ? `${hotel.region_name}, ${hotel.country_name || ''}` 
              : (hotel.country || ''),
            type: "hotel" as const,
          }));

        suggestions = [...regionDestinations, ...hotelDestinations];
      }

      if (suggestions.length === 0) {
        console.log(`⚠️ API returned 0 results for "${query}", using local fallback`);
        return this.getFallbackDestinations(query);
      }

      return suggestions;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }

      console.error("Error fetching destinations:", error);
      console.log("📍 Using fallback destination search for:", query);
      return this.getFallbackDestinations(query);
    }
  }
}

export const ratehawkApi = new RateHawkApiService();
