import { API_BASE_URL } from "@/config/api";
import type { SearchParams, Hotel, HotelDetails, Destination, SearchFilters, RoomRate } from "@/types/booking";

const API_ENDPOINTS = {
  SEARCH_HOTELS: "/api/ratehawk/search",
  GET_DESTINATIONS: "/api/destination",
} as const;

const getApiUrl = (endpoint: keyof typeof API_ENDPOINTS) => {
  return `${API_BASE_URL}${API_ENDPOINTS[endpoint]}`;
};

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
    const userId = localStorage.getItem('userId');
    if (!userId) {
      throw new Error('No authenticated user found. Please log in first.');
    }
    return userId;
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

      const userSession = response.sessions?.find(
        (s) => s.userId === userId || (!!s.email && s.email === userId)
      );

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

  async searchHotels(
    params: SearchParams, 
    page: number = 1,
    filters?: SearchFilters
  ): Promise<SearchResponse> {
    const url = getApiUrl("SEARCH_HOTELS");
    const userId = this.getCurrentUserId();

    // Format guests as array of room objects (required by backend)
    const guestsPerRoom = Math.max(1, Math.floor(params.guests / params.rooms));
    const guests = Array.from({ length: params.rooms }, (_, index) => {
      // Distribute adults across rooms, with extra going to first rooms
      const baseAdults = guestsPerRoom;
      const extraAdult = index < (params.guests % params.rooms) ? 1 : 0;
      return {
        adults: baseAdults + extraAdult,
        children: params.childrenAges || [],
      };
    });

    // Build request body with optional filters
    const requestBody: Record<string, unknown> = {
      userId,
      destination: params.destinationId || params.destination,
      checkin: params.checkIn.toISOString().split("T")[0],
      checkout: params.checkOut.toISOString().split("T")[0],
      guests,
      page,
      limit: 20,
    };

    // Add filters if provided
    const apiFilters = this.transformFiltersForApi(filters);
    if (apiFilters) {
      requestBody.filters = apiFilters;
    }

    const rawResponse = await this.fetchWithError<{
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
        ratehawk_data?: {
          static_vm?: {
            city?: string;
            address?: string;
            country?: string;
            star_rating?: number;
            latitude?: number;
            longitude?: number;
            images?: Array<{ tmpl: string }>;
          };
          rates?: Array<{
            cancellationPolicy?: string;
            mealPlan?: string;
            paymentInfo?: {
              allowed_payment_types?: Array<{ type: string }>;
            };
          }>;
        };
      }>;
      total?: number;
      hasMore?: boolean;
    }>(url, {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    // Transform backend response to match Hotel type
    const hotels: Hotel[] = (rawResponse.hotels || []).map((h) => {
      const staticVm = h.ratehawk_data?.static_vm;
      const amenityStrings = h.amenities || [];
      const rates = h.ratehawk_data?.rates || [];

      // Extract cancellation and meal info from rates
      const hasFreeCancellation = h.freeCancellation || 
        rates.some(r => r.cancellationPolicy?.toLowerCase().includes('free'));
      const mealPlan = h.mealPlan || rates[0]?.mealPlan;
      const paymentTypes = rates[0]?.paymentInfo?.allowed_payment_types?.map(p => p.type) || [];

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
        mainImage: h.image || (staticVm?.images?.[0]?.tmpl.replace("{size}", "1024x768")) || "/placeholder.svg",
        amenities: amenityStrings.map((a, idx) => ({ id: `amenity-${idx}`, name: a })),
        priceFrom: h.price?.amount || 0,
        currency: h.price?.currency || "USD",
        latitude: staticVm?.latitude,
        longitude: staticVm?.longitude,
        // Preserve the raw ratehawk_data for room processing
        ratehawk_data: h.ratehawk_data,
        // Extended fields for filtering display
        freeCancellation: hasFreeCancellation,
        mealPlan,
        paymentTypes,
      } as Hotel;
    });

    const totalResults = rawResponse.total || hotels.length;
    const hasMore = rawResponse.hasMore ?? (hotels.length === 20);

    return { 
      hotels, 
      totalResults,
      hasMore,
      nextPage: page + 1,
    };
  }

  async getHotelDetails(hotelId: string, searchParams?: SearchParams): Promise<HotelDetails | null> {
    // Hotel details endpoint doesn't exist on backend
    // Hotel data should be retrieved from localStorage (set when user clicks hotel card)
    console.warn("getHotelDetails: Backend endpoint not available. Use localStorage instead.");
    return null;
  }

  async getRoomRates(hotelId: string, searchParams: SearchParams): Promise<RoomRate[]> {
    // Try to get room data from a dedicated endpoint or extract from search
    // For now, we'll make a targeted search for this specific hotel
    const url = getApiUrl("SEARCH_HOTELS");
    
    try {
      const userId = this.getCurrentUserId();
      
      // Format guests for the API
      const guestsPerRoom = Math.max(1, Math.floor(searchParams.guests / searchParams.rooms));
      const guests = Array.from({ length: searchParams.rooms }, (_, index) => {
        const baseAdults = guestsPerRoom;
        const extraAdult = index < (searchParams.guests % searchParams.rooms) ? 1 : 0;
        return {
          adults: baseAdults + extraAdult,
          children: searchParams.childrenAges || [],
        };
      });

      const requestBody = {
        userId,
        destination: hotelId, // Search specifically for this hotel
        checkin: searchParams.checkIn.toISOString().split("T")[0],
        checkout: searchParams.checkOut.toISOString().split("T")[0],
        guests,
        page: 1,
        limit: 1,
      };

      const rawResponse = await this.fetchWithError<{
        success: boolean;
        hotels: Array<{
          id: string;
          ratehawk_data?: {
            rates?: Array<{
              id?: string;
              roomName?: string;
              roomDescription?: string;
              price?: number;
              originalPrice?: number;
              currency?: string;
              maxOccupancy?: number;
              squareFootage?: number;
              bedType?: string;
              amenities?: string[];
              cancellationPolicy?: string;
              mealPlan?: string;
              available?: number;
            }>;
          };
        }>;
      }>(url, {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      // Find the matching hotel and extract room rates
      const hotel = rawResponse.hotels?.find(h => h.id === hotelId);
      const rates = hotel?.ratehawk_data?.rates || [];

      return rates.map((rate, idx) => ({
        id: rate.id || `room-${idx}`,
        name: rate.roomName || `Room ${idx + 1}`,
        description: rate.roomDescription,
        price: rate.price || 0,
        originalPrice: rate.originalPrice,
        currency: rate.currency || "USD",
        maxOccupancy: rate.maxOccupancy || 2,
        squareFootage: rate.squareFootage,
        bedType: rate.bedType,
        amenities: rate.amenities,
        cancellationPolicy: rate.cancellationPolicy,
        mealPlan: rate.mealPlan,
        available: rate.available || 5,
      }));
    } catch (error) {
      console.error("Error fetching room rates:", error);
      return [];
    }
  }

  async getDestinations(query: string): Promise<Destination[]> {
    const url = `${API_BASE_URL}/api/destination`;

    try {
      const response = await this.fetchWithError<{
        hotels?: Array<{
          otahotel_id: string;
          hotel_name: string;
          region_name: string;
          country_name: string;
        }>;
        regions?: Array<{
          id: number;
          name: string;
          country: string;
          type: string;
        }>;
      }>(url, {
        method: "POST",
        body: JSON.stringify({ query }),
      });

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
      return [...regionDestinations, ...hotelDestinations];
    } catch (error) {
      console.error("Error fetching destinations:", error);
      return [];
    }
  }
}

export const ratehawkApi = new RateHawkApiService();
