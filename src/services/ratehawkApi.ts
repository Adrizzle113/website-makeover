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
  hotelKinds?: string[];
  // Snake_case versions for backend compatibility
  price_min?: number;
  price_max?: number;
  stars?: number[];
  serp_filters?: string[];
  hotel_kinds?: string[];
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

  // Auto-lookup region_id from destination string
  private async lookupRegionId(destination: string): Promise<number | null> {
    try {
      console.log(`🔍 Auto-looking up region_id for: "${destination}"`);
      
      const { data, error } = await supabase.functions.invoke("travelapi-destination", {
        body: { query: destination },
      });

      if (error) {
        console.error("❌ Destination lookup failed:", error);
        // Fallback to local resolution
        return this.resolveFromFallback(destination);
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

      console.warn(`⚠️ No region_id from API for "${destination}", trying local fallback`);
      // Fallback to local resolution when API returns empty
      return this.resolveFromFallback(destination);
    } catch (error) {
      console.error("❌ Error looking up region_id:", error);
      // Fallback to local resolution on any error
      return this.resolveFromFallback(destination);
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
    // Use residency from filters if provided, otherwise default to "us"
    const residency = filters?.residency?.toLowerCase() || "us";
    const requestBody: Record<string, unknown> = {
      userId,
      destination,
      checkin: this.formatDate(params.checkIn),
      checkout: this.formatDate(params.checkOut),
      guests,
      page,
      limit: 100, // ✅ Load 100 hotels per page for faster initial load
      currency: "USD",
      residency,
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
        // Allow searching with just destination string - backend may resolve it
        console.log(`ℹ️ No regionId found, proceeding with destination string only: "${destination}"`);
      } else {
        console.log(`✅ Auto-lookup successful: ${regionId}`);
      }
    }

    // Include regionId in request only if available
    if (regionId) {
      requestBody.regionId = regionId;
      requestBody.region_id = regionId;
    }

    // Add filters if provided
    const apiFilters = this.transformFiltersForApi(filters);
    if (apiFilters) {
      requestBody.filters = apiFilters;
    }

    // Call edge function (handles CORS and proxies to Render backend)
    console.log("🔍 Search Request:", {
      destination,
      regionId: requestBody.regionId,
      page,
      limit: 100,
      residency,
    });
    
    // Log filters being sent to backend
    if (apiFilters) {
      console.log("🎯 Filters being sent to backend:", apiFilters);
    } else {
      console.log("🎯 No filters applied");
    }

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
        
        // Static data from enrichment (static_data) or legacy format (static_vm)
        const staticData = h.static_data || {};
        const staticVm = h.static_vm || h.ratehawk_data?.static_vm;
        
        // Helper: Convert slug to human-readable name
        const humanizeSlug = (slug: string): string => {
          return slug
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .trim();
        };
        
        // Get hotel name - prefer actual names, humanize slug as last resort
        const rawName = staticData.name || h.name || staticVm?.name;
        const hotelName = rawName && rawName.trim() ? rawName : humanizeSlug(hotelId);
        
        // Get amenities from various sources
        const amenityStrings = h.amenities || staticVm?.amenities || [];
        
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
        
        // Get images from enriched static_data first, then static_vm
        let images: Array<{ url: string; alt: string }> = [];
        
        // Enriched static_data images - may need {size} template replacement
        if (staticData.images && staticData.images.length > 0) {
          images = staticData.images.slice(0, 10).map((url: string) => {
            let processedUrl = typeof url === 'string' ? url : '';
            // Replace {size} template if present
            if (processedUrl.includes('{size}')) {
              processedUrl = processedUrl.replace('{size}', '640x400');
            }
            return { url: processedUrl, alt: hotelName };
          }).filter((img: any) => img.url && img.url.length > 30);
        }
        
        // Fallback to static_vm images if static_data images are insufficient
        if (images.length === 0 && staticVm?.images?.length > 0) {
          images = staticVm.images.slice(0, 10).map((img: any) => {
            const url = typeof img === 'string' 
              ? img.replace('{size}', '640x400')
              : img.tmpl?.replace("{size}", "640x400") || img.url || "";
            return { url, alt: hotelName };
          }).filter((img: any) => img.url && img.url.length > 30);
        }
        
        const mainImage = images[0]?.url || h.image || "/placeholder.svg";
        
        // Debug: Log name and image extraction for first few hotels
        if (rawResponse.hotels.indexOf(h) < 3) {
          console.log(`🏨 Hotel ${hotelId}:`, {
            nameSource: staticData.name ? 'static_data' : (h.name ? 'h.name' : (staticVm?.name ? 'static_vm' : 'humanized')),
            finalName: hotelName,
            imageSource: staticData.images?.length ? 'static_data' : (staticVm?.images?.length ? 'static_vm' : 'none'),
            imageCount: images.length,
            mainImage: mainImage?.substring(0, 60),
          });
        }
        
        // Extract cancellation and meal info from rates
        const hasFreeCancellation = h.freeCancellation || 
          rates.some((r: any) => r.free_cancellation === true || r.cancellationPolicy?.toLowerCase().includes("free"));
        const mealPlan = h.mealPlan || rates[0]?.meal || rates[0]?.meal_data?.name;
        const paymentTypes = rates[0]?.payment_options?.payment_types?.map((p: any) => p.type) || [];

        // Get address, city, country from enriched data or static_vm.region
        const address = staticData.address || staticVm?.address || h.location || "";
        // static_vm uses region object with name (city), country_code, etc.
        const regionName = staticVm?.region?.name || "";
        
        // Extract city from address as fallback (e.g., "1020 S Figueroa Street, Los Angeles" -> "Los Angeles")
        let cityFromAddress = "";
        if (address && !regionName && !staticData.city) {
          const addressParts = address.split(',').map((p: string) => p.trim());
          if (addressParts.length >= 2) {
            // Take the last part that looks like a city (not a zip code)
            const lastPart = addressParts[addressParts.length - 1];
            cityFromAddress = /^\d/.test(lastPart) ? addressParts[addressParts.length - 2] || "" : lastPart;
          }
        }
        
        const city = staticData.city || regionName || cityFromAddress || "";
        const country = staticData.country || staticVm?.region?.country_code || "";
        
        // Get star rating - enriched data is 1-5, static_vm might be 10-50
        let starRating = 0;
        if (staticData.star_rating) {
          starRating = staticData.star_rating; // Already 1-5 from enrichment
        } else if (staticVm?.star_rating) {
          starRating = staticVm.star_rating > 5 ? Math.round(staticVm.star_rating / 10) : staticVm.star_rating;
        } else if (h.rating) {
          starRating = h.rating;
        }

        // Get coordinates
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
          // Preserve COMPLETE backend data for hotel details page
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
