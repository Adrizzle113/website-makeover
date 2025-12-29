import { API_BASE_URL } from "@/config/api";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateUserId } from "@/lib/getOrCreateUserId";
import type {
  SearchParams,
  Hotel,
  HotelDetails,
  Destination,
  SearchFilters,
  RoomRate,
  RateHawkRate,
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

    // Price range
    if (filters.priceMin !== undefined) apiFilters.minPrice = filters.priceMin;
    if (filters.priceMax !== undefined) apiFilters.maxPrice = filters.priceMax;

    // Star ratings
    if (filters.starRatings.length > 0) apiFilters.starRatings = filters.starRatings;

    // Cancellation
    if (filters.freeCancellationOnly) apiFilters.freeCancellation = true;
    if (filters.refundableOnly) apiFilters.refundableOnly = true;

    // Meal plans
    if (filters.mealPlans.length > 0) apiFilters.mealPlans = filters.mealPlans;

    // Amenities
    if (filters.amenities.length > 0) apiFilters.amenities = filters.amenities;

    // Payment types
    if (filters.paymentTypes.length > 0) apiFilters.paymentTypes = filters.paymentTypes;

    // Rate type
    if (filters.rateType) apiFilters.rateType = filters.rateType;

    // Room types
    if (filters.roomTypes.length > 0) apiFilters.roomTypes = filters.roomTypes;

    // Bed types
    if (filters.bedTypes.length > 0) apiFilters.bedTypes = filters.bedTypes;

    // Residency
    if (filters.residency && filters.residency !== "US") apiFilters.residency = filters.residency;

    // Return undefined if no filters are active
    return Object.keys(apiFilters).length > 0 ? apiFilters : undefined;
  }

  // Auto-lookup region_id from destination string
  private async lookupRegionId(destination: string): Promise<number | null> {
    try {
      console.log(`🔍 Auto-looking up region_id for: "${destination}"`);
      
      const { data, error } = await supabase.functions.invoke("travelapi-destination", {
        body: { query: destination },
      });

      if (error) {
        console.error("❌ Destination lookup failed:", error);
        return null;
      }

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

      console.warn(`⚠️ No region_id found for "${destination}"`);
      return null;
    } catch (error) {
      console.error("❌ Error looking up region_id:", error);
      return null;
    }
  }

  async searchHotels(params: SearchParams, page: number = 1, filters?: SearchFilters): Promise<SearchResponse> {
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

    // Prefer sending a plain city name to the backend (it often fails on "City, State")
    let destination = rawDestination;
    if (rawDestination.includes(",")) {
      destination = rawDestination.split(",")[0].trim();
      console.log(`📍 Simplified destination: "${rawDestination}" → "${destination}"`);
    }

    // Format guests as array of room objects (required by backend)
    const guestsPerRoom = Math.max(1, Math.floor(params.guests / params.rooms));
    const guests = Array.from({ length: params.rooms }, (_, index) => {
      // Distribute adults across rooms, with extra going to first rooms
      const baseAdults = guestsPerRoom;
      const extraAdult = index < params.guests % params.rooms ? 1 : 0;
      return {
        adults: baseAdults + extraAdult,
        children: params.childrenAges || [],
      };
    });

    // Build request body - ALWAYS include a destination string
    const requestBody: Record<string, unknown> = {
      userId,
      destination,
      checkin: this.formatDate(params.checkIn),
      checkout: this.formatDate(params.checkOut),
      guests,
      page,
      limit: 100, // ✅ Load 100 hotels per page for faster initial load
      currency: "USD",
      residency: "us",
    };

    // Handle regionId - use provided ID or auto-lookup as fallback
    const isNumericId = params.destinationId && /^\d+$/.test(params.destinationId);
    let regionId: number | null = null;
    
    if (isNumericId) {
      regionId = parseInt(params.destinationId!, 10);
      
      // Log warning for large IDs (for debugging), but DON'T reject them
      // Large IDs like 966242095 are valid for smaller cities/regions
      if (regionId > 100000) {
        console.warn(`ℹ️ Large regionId: ${regionId} - may be a smaller city/region (valid)`);
      }
      console.log(`✅ Using provided regionId: ${regionId}`);
    }
    
    if (!regionId) {
      // Auto-lookup fallback
      console.log(`⚠️ No valid region_id, auto-looking up for: "${destination}"`);
      regionId = await this.lookupRegionId(destination);
      
      if (!regionId) {
        throw new Error(
          `Could not find location ID for "${destination}". Please select a destination from the autocomplete dropdown.`
        );
      }
      console.log(`✅ Auto-lookup successful: ${regionId}`);
    }

    // Include regionId in request
    requestBody.regionId = regionId;
    requestBody.region_id = regionId;

    // Add filters if provided
    const apiFilters = this.transformFiltersForApi(filters);
    if (apiFilters) {
      requestBody.filters = apiFilters;
    }

    // Call edge function (handles CORS and proxies to Render backend)
    console.log("🔍 Search Request:", {
      destination,
      page,
      limit: 100,
    });

    try {
      const { data, error } = await supabase.functions.invoke("travelapi-search", {
        body: requestBody,
      });

      if (error) {
        console.error("❌ Search error:", error);
        throw new Error(error.message || "Search failed");
      }

      console.log("✅ Search Response:", {
        hotels: data.hotels?.length || 0,
        total: data.total,
        page: data.page,
        hasMore: data.hasMore,
      });

      // Debug: Log first hotel structure to understand data format
      if (data.hotels?.length > 0) {
        const sample = data.hotels[0];
        console.log("📦 Sample hotel structure:", {
          topLevelKeys: Object.keys(sample),
          hotel_id: sample.hotel_id,
          id: sample.id,
          name: sample.name,
          hasStaticVm: !!sample.static_vm,
          staticVmKeys: sample.static_vm ? Object.keys(sample.static_vm) : [],
          ratesCount: sample.rates?.length || 0,
          sampleRate: sample.rates?.[0] ? Object.keys(sample.rates[0]) : [],
        });
      }

      // Check if response indicates an error
      if (data && typeof data === 'object' && 'error' in data) {
        const errorData = data as { error: string; details?: string };
        throw new Error(errorData.error || errorData.details || "Search failed");
      }

      // Raw response - flexible typing to handle backend format
      const rawResponse = data as {
        success: boolean;
        hotels: any[];
        total?: number;
        hasMore?: boolean;
        page?: number;
      };

      // Transform backend response to match Hotel type - handle Render backend format
      const hotels: Hotel[] = (rawResponse.hotels || []).map((h: any) => {
        // Backend returns hotel_id, not id
        const hotelId = h.hotel_id || h.id;
        
        // Static data sources (priority order):
        // 1. static_data from edge function enrichment (hotel_dump_data)
        // 2. static_vm from Render backend
        // 3. Fallback to top-level fields
        const staticData = h.static_data;
        const staticVm = h.static_vm || h.ratehawk_data?.static_vm;
        
        // Get hotel name from multiple possible sources
        const hotelName = staticData?.name || h.name || staticVm?.name || `Hotel ${hotelId}`;
        
        // Get amenities from various sources
        const amenityStrings = staticData?.amenities || h.amenities || staticVm?.amenities || [];
        
        // Calculate price from rates array (Render backend format)
        const rates = h.rates || h.ratehawk_data?.rates || [];
        let priceFrom = 0;
        let currency = "USD";
        
        if (rates.length > 0) {
          // Find the lowest price from all rates
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
        
        // Fallback to h.price if no rates
        if (priceFrom === 0 && h.price?.amount) {
          priceFrom = h.price.amount;
          currency = h.price.currency || "USD";
        }
        
        // Get images - prioritize enriched static_data, then static_vm
        let images: { url: string; alt: string }[] = [];
        
        if (staticData?.images && staticData.images.length > 0) {
          // Use pre-processed images from edge function enrichment
          images = staticData.images.map((img: any) => ({
            url: typeof img === 'string' ? img : img.url || '',
            alt: hotelName,
          })).filter((img: any) => img.url);
        } else if (staticVm?.images) {
          // Fallback to static_vm images
          const rawImages = staticVm.images || [];
          images = rawImages.slice(0, 10).map((img: any) => {
            const url = typeof img === 'string' 
              ? img 
              : img.tmpl?.replace("{size}", "1024x768") || img.url || "";
            return { url, alt: hotelName };
          }).filter((img: any) => img.url);
        }
        
        const mainImage = staticData?.mainImage || images[0]?.url || h.image || "/placeholder.svg";
        
        // Extract cancellation and meal info from rates
        const hasFreeCancellation = h.freeCancellation || 
          rates.some((r: any) => r.free_cancellation === true || r.cancellationPolicy?.toLowerCase().includes("free"));
        const mealPlan = h.mealPlan || rates[0]?.meal || rates[0]?.meal_data?.name;
        const paymentTypes = rates[0]?.payment_options?.payment_types?.map((p: any) => p.type) || [];

        // Star rating - prefer static_data (already processed), then static_vm (needs division)
        let starRating = 0;
        if (staticData?.star_rating) {
          starRating = staticData.star_rating;
        } else if (staticVm?.star_rating) {
          starRating = Math.round(staticVm.star_rating / 10);
        } else if (h.rating) {
          starRating = h.rating;
        }

        return {
          id: hotelId,
          name: hotelName,
          description: staticVm?.description || h.description || "",
          address: staticData?.address || staticVm?.address || h.location || "",
          city: staticData?.city || staticVm?.city || "",
          country: staticData?.country || staticVm?.country || "",
          starRating,
          reviewScore: staticVm?.rating || h.reviewScore,
          reviewCount: staticVm?.review_count || h.reviewCount || 0,
          images,
          mainImage,
          amenities: (Array.isArray(amenityStrings) ? amenityStrings : []).map((a: string, idx: number) => ({ id: `amenity-${idx}`, name: a })),
          priceFrom,
          currency,
          latitude: staticData?.latitude || staticVm?.latitude,
          longitude: staticData?.longitude || staticVm?.longitude,
          // Preserve COMPLETE backend data for hotel details page
          ratehawk_data: {
            ...h,
            static_vm: staticVm,
            static_data: staticData,
          },
          freeCancellation: hasFreeCancellation,
          mealPlan,
          paymentTypes,
        } as Hotel;
      });

      const totalResults = rawResponse.total || hotels.length;
      const hasMore = rawResponse.hasMore ?? (hotels.length === 100);

      return {
        hotels,
        totalResults,
        hasMore,
        nextPage: page + 1,
        currentPage: page,
      };
    } catch (error) {
      console.error("❌ Search failed:", error);
      throw error;
    }
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
    { id: "2011", name: "Los Angeles", country: "California, United States", type: "city" },
    { id: "2621", name: "Las Vegas", country: "Nevada, United States", type: "city" },
    { id: "2007", name: "New York", country: "New York, United States", type: "city" },
    { id: "2008", name: "Miami", country: "Florida, United States", type: "city" },
    { id: "2012", name: "San Francisco", country: "California, United States", type: "city" },
    { id: "2015", name: "Chicago", country: "Illinois, United States", type: "city" },
    { id: "2620", name: "Orlando", country: "Florida, United States", type: "city" },
    { id: "2622", name: "Honolulu", country: "Hawaii, United States", type: "city" },
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

  // Get fallback destinations when API returns empty or fails
  private getFallbackDestinations(query: string): Destination[] {
    const queryLower = query.toLowerCase().trim();
    
    // Filter popular destinations by query
    const matches = RateHawkApiService.POPULAR_DESTINATIONS.filter(
      (dest) => 
        dest.name.toLowerCase().includes(queryLower) || 
        dest.country.toLowerCase().includes(queryLower)
    );

    // If we found matches, return them
    if (matches.length > 0) {
      console.log(`📍 Fallback: Found ${matches.length} matching destinations for "${query}"`);
      return matches;
    }

    // No matches - return a "search this location" option so user can still proceed
    console.log(`📍 Fallback: No matches for "${query}", returning search option`);
    return [
      { id: "", name: query, country: "Search this location", type: "city" }
    ];
  }

  async getDestinations(query: string, signal?: AbortSignal): Promise<Destination[]> {
    // Check if already aborted before making request
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    try {
      // Call Supabase edge function to proxy to Render (avoids CORS)
      const { data, error } = await supabase.functions.invoke('travelapi-destination', {
        body: { query },
      });

      // Check if aborted after request completes (before processing)
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      if (error) {
        console.error("❌ Destination edge function error:", error);
        throw error;
      }

      // Check if response contains an abort/timeout error from edge function
      if (data?.error) {
        const errorMsg = String(data.error);
        if (errorMsg.includes('aborted') || errorMsg.includes('Aborted') || errorMsg.includes('timeout')) {
          // Throw AbortError so frontend handles it gracefully (ignored by catch)
          throw new DOMException('Aborted', 'AbortError');
        }
        console.warn('⚠️ Destination API returned error:', data.error);
        throw new Error(data.error);
      }

      // Handle new structured response format from backend
      // Format: { status: "ok", data: { destinations: [...] }, meta: { from_cache, duration_ms } }
      const isNewFormat = data?.status === 'ok' && data?.data?.destinations;
      
      let suggestions: Destination[] = [];
      
      if (isNewFormat) {
        const meta = data.meta || {};
        console.log(`🔍 Destination API response (cache: ${meta.from_cache}, ${meta.duration_ms}ms):`, data.data.destinations.length, 'results');
        
        // Transform new format destinations with "City, State" for US to avoid ambiguity
        suggestions = (data.data.destinations || []).map((dest: {
          label: string;
          region_id: number;
          type: string;
          country_code?: string;
          country_name?: string;
        }) => {
          const labelParts = dest.label.split(',').map(p => p.trim());
          
          // For US destinations, show "City, State" to distinguish e.g. "Los Angeles, California" vs "Los Angeles, Texas"
          let displayName = labelParts[0]; // Default: just city name
          if (labelParts.length >= 2 && dest.country_code === 'US') {
            displayName = `${labelParts[0]}, ${labelParts[1]}`; // "Los Angeles, California"
          }
          
          // Country is everything after the display name parts
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
        // Legacy response format handling
        const response = data as {
          hotels?: Array<{
            otahotel_id: string;
            hotel_name: string;
            region_name: string;
            country_name: string;
            slug?: string;
          }>;
          regions?: Array<{
            id: number;
            name: string;
            country: string;
            type: string;
            slug?: string;
          }>;
        };

        console.log('🔍 Destination API response (legacy format):', response);

        // Transform regions to Destination format (prioritize regions/cities)
        const regionDestinations: Destination[] = (response.regions || []).map((region) => ({
          id: String(region.id),
          name: region.name,
          country: region.country,
          type: region.type.toLowerCase().includes("city") ? "city" : "region",
        }));

        // Optionally include hotels as suggestions
        const hotelDestinations: Destination[] = (response.hotels || []).slice(0, 3).map((hotel) => ({
          id: hotel.otahotel_id,
          name: hotel.hotel_name,
          country: `${hotel.region_name}, ${hotel.country_name}`,
          type: "hotel" as const,
        }));

        // Return regions first, then a few hotel suggestions
        suggestions = [...regionDestinations, ...hotelDestinations];
      }

      // CRITICAL: If API returned empty results, use local fallback
      if (suggestions.length === 0) {
        console.log(`⚠️ API returned 0 results for "${query}", using local fallback`);
        return this.getFallbackDestinations(query);
      }

      return suggestions;
    } catch (error) {
      // Re-throw AbortError so frontend can handle it properly
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }

      console.error("Error fetching destinations:", error);

      // Fallback: Use local popular destinations when API fails
      console.log("📍 Using fallback destination search for:", query);
      return this.getFallbackDestinations(query);
    }
  }
}

export const ratehawkApi = new RateHawkApiService();
