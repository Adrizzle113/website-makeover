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

  async searchHotels(params: SearchParams, page: number = 1, filters?: SearchFilters): Promise<SearchResponse> {
    const userId = this.getCurrentUserId();

    // VALIDATION: Fail early with helpful errors
    const rawDestination = params.destination?.trim();
    if (!rawDestination) {
      throw new Error('Please select a destination');
    }

    if (!params.checkIn || !params.checkOut) {
      throw new Error('Please select check-in and check-out dates');
    }

    if (new Date(this.formatDate(params.checkIn)) >= new Date(this.formatDate(params.checkOut))) {
      throw new Error('Check-out must be after check-in');
    }

    // Simplify destination: Remove state/region suffix if present
    // e.g., "New York, New York" → "New York" (Render backend can't resolve full region names)
    let searchDestination = rawDestination;
    if (rawDestination.includes(',')) {
      searchDestination = rawDestination.split(',')[0].trim();
      console.log(`📍 Simplified destination: "${rawDestination}" → "${searchDestination}"`);
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

    // Build request body - ALWAYS include simplified destination string
    const requestBody: Record<string, unknown> = {
      userId,
      destination: searchDestination, // Simplified city name (required by backend)
      checkin: this.formatDate(params.checkIn),
      checkout: this.formatDate(params.checkOut),
      guests,
      page,
      limit: 20,
      currency: 'USD',
      residency: 'us',
    };

    // If destinationId is numeric, ALSO include regionId for faster lookup
    const isNumericId = params.destinationId && /^\d+$/.test(params.destinationId);
    if (isNumericId) {
      requestBody.regionId = parseInt(params.destinationId!, 10);
      console.log(`✅ Including regionId: ${requestBody.regionId}`);
    }

    // Add filters if provided
    const apiFilters = this.transformFiltersForApi(filters);
    if (apiFilters) {
      requestBody.filters = apiFilters;
    }

    console.log("📤 SENDING REQUEST TO EDGE FUNCTION:", requestBody);

    // Call Supabase edge function to proxy to Render (avoids CORS)
    const { data, error } = await supabase.functions.invoke('travelapi-search', {
      body: requestBody,
    });

    if (error) {
      console.error("❌ Edge function error:", error);
      
      // Try to extract the actual error message from the response
      let errorMessage = "Search failed";
      try {
        // The error context may contain the JSON body from the edge function
        if (error.context && typeof error.context === 'object') {
          const ctx = error.context as { error?: string; details?: string };
          errorMessage = ctx.error || ctx.details || errorMessage;
        } else if (error.message) {
          // Try to parse JSON from error message
          const jsonMatch = error.message.match(/\{.*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            errorMessage = parsed.error || parsed.details || errorMessage;
          } else {
            errorMessage = error.message;
          }
        }
      } catch {
        // Use default message if parsing fails
      }
      
      throw new Error(errorMessage);
    }

    // Check if response indicates an error (edge function returned error JSON with 2xx)
    if (data && typeof data === 'object' && 'error' in data && !('hotels' in data && (data as any).hotels?.length > 0)) {
      const errorData = data as { error: string; details?: string };
      throw new Error(errorData.error || errorData.details || "Search failed");
    }

    // Type the response
    const rawResponse = data as {
      success: boolean;
      hotels: Array<{
        id: string;
        name: string;
        location?: string;
        rating?: number;
        reviewScore?: number;
        reviewCount?: number;
        price?: { amount: number; currency: string; period?: string };
        image?: string;
        amenities?: string[];
        description?: string;
        freeCancellation?: boolean;
        mealPlan?: string;
        paymentType?: string;
        ratehawk_data?: any;
      }>;
      total?: number;
      hasMore?: boolean;
    };

    // ✅ CRITICAL DEBUG: Log EXACT response from backend
    if (rawResponse.hotels && rawResponse.hotels.length > 0) {
      const firstHotel = rawResponse.hotels[0];
      console.log("🔥🔥🔥 CRITICAL - RAW BACKEND RESPONSE ANALYSIS:", {
        hotelId: firstHotel.id,
        hotelName: firstHotel.name,
        ratehawk_data_structure: {
          has_ratehawk_data: !!firstHotel.ratehawk_data,
          top_level_keys: Object.keys(firstHotel.ratehawk_data || {}),

          // Rates analysis
          has_rates_array: !!firstHotel.ratehawk_data?.rates,
          rates_count: firstHotel.ratehawk_data?.rates?.length || 0,
          rates_is_array: Array.isArray(firstHotel.ratehawk_data?.rates),

          // EnhancedData analysis
          has_enhanced_data: !!firstHotel.ratehawk_data?.enhancedData,
          enhanced_rates_count: firstHotel.ratehawk_data?.enhancedData?.rates?.length || 0,
          enhanced_rates_is_array: Array.isArray(firstHotel.ratehawk_data?.enhancedData?.rates),

          // Room groups analysis
          room_groups_count: firstHotel.ratehawk_data?.room_groups?.length || 0,
          enhanced_room_groups_count: firstHotel.ratehawk_data?.enhancedData?.room_groups?.length || 0,
        },

        // Log ACTUAL data (not just counts)
        ACTUAL_RATES_ARRAY: firstHotel.ratehawk_data?.rates,
        ACTUAL_ENHANCED_RATES: firstHotel.ratehawk_data?.enhancedData?.rates,
        ACTUAL_ROOM_GROUPS: firstHotel.ratehawk_data?.room_groups,
      });

      // Also log the full ratehawk_data to see complete structure
      console.log("📦 FULL ratehawk_data for first hotel:", JSON.parse(JSON.stringify(firstHotel.ratehawk_data)));
    }

    // Transform backend response to match Hotel type - PRESERVE EVERYTHING
    const hotels: Hotel[] = (rawResponse.hotels || []).map((h) => {
      const staticVm = h.ratehawk_data?.static_vm;
      const amenityStrings = h.amenities || [];

      // ✅ DON'T filter or modify rates - keep ALL of them
      const rates = h.ratehawk_data?.rates || [];

      // Extract cancellation and meal info from rates
      const hasFreeCancellation =
        h.freeCancellation || rates.some((r) => r.cancellationPolicy?.toLowerCase().includes("free"));
      const mealPlan = h.mealPlan || rates[0]?.mealPlan;
      const paymentTypes = rates[0]?.paymentInfo?.allowed_payment_types?.map((p) => p.type) || [];

      return {
        id: h.id,
        name: h.name,
        description: h.description || "",
        address: h.location || staticVm?.address || "",
        city: staticVm?.city || "",
        country: staticVm?.country || "",
        starRating: staticVm?.star_rating ? Math.round(staticVm.star_rating / 10) : h.rating || 0,
        reviewScore: h.reviewScore,
        reviewCount: h.reviewCount,
        images: (staticVm?.images || []).slice(0, 10).map((img) => ({
          url: img.tmpl.replace("{size}", "1024x768"),
          alt: h.name,
        })),
        mainImage: h.image || staticVm?.images?.[0]?.tmpl.replace("{size}", "1024x768") || "/placeholder.svg",
        amenities: amenityStrings.map((a, idx) => ({ id: `amenity-${idx}`, name: a })),
        priceFrom: h.price?.amount || 0,
        currency: h.price?.currency || "USD",
        latitude: staticVm?.latitude,
        longitude: staticVm?.longitude,
        // ✅ CRITICAL: Preserve COMPLETE ratehawk_data - don't modify it
        ratehawk_data: h.ratehawk_data,
        // Extended fields for filtering display
        freeCancellation: hasFreeCancellation,
        mealPlan,
        paymentTypes,
      } as Hotel;
    });

    // Debug: Log what we're passing to the rest of the app
    hotels.forEach((h) => {
      console.log(`📦 TRANSFORMED Hotel ${h.id}:`, {
        hasRatehawkData: !!h.ratehawk_data,
        rates_count: h.ratehawk_data?.rates?.length || 0,
        enhanced_rates_count: h.ratehawk_data?.enhancedData?.rates?.length || 0,
        room_groups_count: h.ratehawk_data?.room_groups?.length || 0,
        enhanced_room_groups_count: h.ratehawk_data?.enhancedData?.room_groups?.length || 0,
      });
    });

    const totalResults = rawResponse.total || hotels.length;
    const hasMore = rawResponse.hasMore ?? hotels.length === 20;

    return {
      hotels,
      totalResults,
      hasMore,
      nextPage: page + 1,
    };
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

  // Popular destinations fallback for when API has CORS issues
  private static POPULAR_DESTINATIONS: Destination[] = [
    { id: "las_vegas", name: "Las Vegas", country: "Nevada, United States", type: "city" },
    { id: "new_york", name: "New York", country: "New York, United States", type: "city" },
    { id: "miami", name: "Miami", country: "Florida, United States", type: "city" },
    { id: "los_angeles", name: "Los Angeles", country: "California, United States", type: "city" },
    { id: "san_francisco", name: "San Francisco", country: "California, United States", type: "city" },
    { id: "chicago", name: "Chicago", country: "Illinois, United States", type: "city" },
    { id: "orlando", name: "Orlando", country: "Florida, United States", type: "city" },
    { id: "honolulu", name: "Honolulu", country: "Hawaii, United States", type: "city" },
    { id: "london", name: "London", country: "United Kingdom", type: "city" },
    { id: "paris", name: "Paris", country: "France", type: "city" },
    { id: "rome", name: "Rome", country: "Italy", type: "city" },
    { id: "barcelona", name: "Barcelona", country: "Spain", type: "city" },
    { id: "dubai", name: "Dubai", country: "United Arab Emirates", type: "city" },
    { id: "tokyo", name: "Tokyo", country: "Japan", type: "city" },
    { id: "cancun", name: "Cancun", country: "Mexico", type: "city" },
    { id: "nassau", name: "Nassau", country: "Bahamas", type: "city" },
    { id: "amsterdam", name: "Amsterdam", country: "Netherlands", type: "city" },
    { id: "sydney", name: "Sydney", country: "Australia", type: "city" },
    { id: "bangkok", name: "Bangkok", country: "Thailand", type: "city" },
    { id: "singapore", name: "Singapore", country: "Singapore", type: "city" },
  ];

  async getDestinations(query: string): Promise<Destination[]> {
    try {
      // Call Supabase edge function to proxy to Render (avoids CORS)
      const { data, error } = await supabase.functions.invoke('travelapi-destination', {
        body: { query },
      });

      if (error) {
        console.error("❌ Destination edge function error:", error);
        throw error;
      }

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

      console.log('🔍 Destination API response:', response);

      // Transform regions to Destination format (prioritize regions/cities)
      // Use numeric ID since the search API expects region_id (not slug)
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
      return [...regionDestinations, ...hotelDestinations];
    } catch (error) {
      console.error("Error fetching destinations:", error);

      // Fallback: Filter popular destinations by query when API fails (CORS issues)
      console.log("📍 Using fallback destination search for:", query);
      const queryLower = query.toLowerCase();
      return RateHawkApiService.POPULAR_DESTINATIONS.filter(
        (dest) => dest.name.toLowerCase().includes(queryLower) || dest.country.toLowerCase().includes(queryLower),
      );
    }
  }
}

export const ratehawkApi = new RateHawkApiService();
