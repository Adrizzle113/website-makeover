import { API_BASE_URL } from "@/config/api";
import type { SearchParams, Hotel, HotelDetails, Destination } from "@/types/booking";

const API_ENDPOINTS = {
  SEARCH_HOTELS: "/api/ratehawk/search",
  GET_HOTEL_DETAILS: "/api/ratehawk/hotel",
  GET_DESTINATIONS: "/api/destination", // ✅ Fixed: Changed from /api/ratehawk/destinations
  INIT_SESSION: "/api/ratehawk/session",
} as const;

const getApiUrl = (endpoint: keyof typeof API_ENDPOINTS) => {
  return `${API_BASE_URL}${API_ENDPOINTS[endpoint]}`;
};

interface SearchResponse {
  hotels: Hotel[];
  totalResults: number;
}

interface DestinationResponse {
  destinations: Destination[];
}

class RateHawkApiService {
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

  async searchHotels(params: SearchParams): Promise<SearchResponse> {
    const url = getApiUrl("SEARCH_HOTELS");

    return this.fetchWithError<SearchResponse>(url, {
      method: "POST",
      body: JSON.stringify({
        destination: params.destinationId || params.destination,
        checkIn: params.checkIn.toISOString().split("T")[0],
        checkOut: params.checkOut.toISOString().split("T")[0],
        guests: params.guests,
        rooms: params.rooms,
        children: params.children,
        childrenAges: params.childrenAges,
      }),
    });
  }

  async getHotelDetails(hotelId: string, searchParams?: SearchParams): Promise<HotelDetails> {
    const url = `${getApiUrl("GET_HOTEL_DETAILS")}/${hotelId}`;
    const queryParams = new URLSearchParams();

    if (searchParams) {
      queryParams.append("checkIn", searchParams.checkIn.toISOString().split("T")[0]);
      queryParams.append("checkOut", searchParams.checkOut.toISOString().split("T")[0]);
      queryParams.append("guests", String(searchParams.guests));
      queryParams.append("rooms", String(searchParams.rooms));
    }

    const fullUrl = queryParams.toString() ? `${url}?${queryParams}` : url;
    return this.fetchWithError<HotelDetails>(fullUrl);
  }

  // ✅ Fixed: Changed from GET to POST and updated to use correct endpoint
  async getDestinations(query: string): Promise<Destination[]> {
    const url = `${API_BASE_URL}/api/destination`;

    try {
      const response = await this.fetchWithError<any>(url, {
        method: "POST",
        body: JSON.stringify({ query }),
      });

      // Handle different response formats
      return response.destinations || response.data || response || [];
    } catch (error) {
      console.error("Error fetching destinations:", error);
      // Return empty array on error so the UI doesn't break
      return [];
    }
  }

  async initSession(): Promise<{ sessionId: string }> {
    const url = getApiUrl("INIT_SESSION");
    return this.fetchWithError<{ sessionId: string }>(url, { method: "POST" });
  }
}

export const ratehawkApi = new RateHawkApiService();
