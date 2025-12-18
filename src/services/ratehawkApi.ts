import { API_BASE_URL } from "@/config/api";
import type { SearchParams, Hotel, HotelDetails, Destination } from "@/types/booking";

const API_ENDPOINTS = {
  SEARCH_HOTELS: "/api/ratehawk/search",
  GET_DESTINATIONS: "/api/destination",
} as const;

const getApiUrl = (endpoint: keyof typeof API_ENDPOINTS) => {
  return `${API_BASE_URL}${API_ENDPOINTS[endpoint]}`;
};

interface SearchResponse {
  hotels: Hotel[];
  totalResults: number;
}

interface SessionCheckResponse {
  isLoggedIn: boolean;
  ratehawkData?: {
    email: string;
    sessionExpiry: string;
  };
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
    const url = `${API_BASE_URL}/api/sessions/${userId}`;
    
    try {
      const response = await this.fetchWithError<SessionCheckResponse>(url);
      return response;
    } catch (error) {
      console.error("Session check failed:", error);
      return { isLoggedIn: false };
    }
  }

  async searchHotels(params: SearchParams): Promise<SearchResponse> {
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

    return this.fetchWithError<SearchResponse>(url, {
      method: "POST",
      body: JSON.stringify({
        userId,
        destination: params.destinationId || params.destination,
        checkin: params.checkIn.toISOString().split("T")[0],
        checkout: params.checkOut.toISOString().split("T")[0],
        guests,
      }),
    });
  }

  async getHotelDetails(hotelId: string, searchParams?: SearchParams): Promise<HotelDetails | null> {
    // Hotel details endpoint doesn't exist on backend
    // Hotel data should be retrieved from localStorage (set when user clicks hotel card)
    console.warn("getHotelDetails: Backend endpoint not available. Use localStorage instead.");
    return null;
  }

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
      return [];
    }
  }
}

export const ratehawkApi = new RateHawkApiService();
