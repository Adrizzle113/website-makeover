import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { HotelDetails } from "@/types/booking";

// Import components from src/components/hotel
import { HotelHeroSection } from "../components/hotel/HotelHeroSection";
import { HotelInfoSection } from "../components/hotel/HotelInfoSection";
import { RoomSelectionSection } from "../components/hotel/RoomSelectionSection";
import { FacilitiesAmenitiesSection } from "../components/hotel/FacilitiesAmenitiesSection";
import { MapSection } from "../components/hotel/MapSection";
import { HotelPoliciesSection } from "../components/hotel/HotelPoliciesSection";
import { Card, CardContent } from "../components/ui/card";

interface SearchContext {
  destination: string;
  destinationId?: string;
  checkin: string | Date;
  checkout: string | Date;
  guests: number | Array<{ adults: number }>;
  formattedGuests?: Array<{ adults: number }>;
  totalHotels?: number;
  availableHotels?: number;
  searchTimestamp?: string;
}

interface Hotel {
  id: string;
  name: string;
  location?: string;
  rating?: number;
  reviewScore?: number;
  reviewCount?: number;
  price?: {
    amount: number;
    currency: string;
    period?: string;
  };
  image?: string;
  images?: string[];
  amenities?: string[];
  description?: string;
  fullDescription?: string;
  checkInTime?: string;
  checkOutTime?: string;
  policies?: string[];
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  ratehawk_data?: any;
}

interface HotelData {
  hotel: Hotel;
  searchContext: SearchContext;
  allAvailableHotels?: number;
  selectedFromPage?: number;
}

// Transform local Hotel interface to global HotelDetails type
const transformToHotelDetails = (hotel: Hotel): HotelDetails => ({
  id: hotel.id,
  name: hotel.name,
  description: hotel.description || '',
  fullDescription: hotel.fullDescription || hotel.description || '',
  address: hotel.address || hotel.location || '',
  city: hotel.city || '',
  country: hotel.country || '',
  starRating: hotel.rating || 0,
  reviewScore: hotel.reviewScore || 0,
  reviewCount: hotel.reviewCount || 0,
  images: Array.isArray(hotel.images) 
    ? hotel.images.map((img) => 
        typeof img === 'string' ? { url: img } : { url: img }
      )
    : [],
  mainImage: hotel.image || hotel.images?.[0] || '',
  amenities: hotel.amenities?.map((name) => ({ id: name, name })) || [],
  priceFrom: hotel.price?.amount || 0,
  currency: hotel.price?.currency || 'USD',
  latitude: hotel.latitude || 0,
  longitude: hotel.longitude || 0,
  checkInTime: hotel.checkInTime,
  checkOutTime: hotel.checkOutTime,
  policies: hotel.policies,
  ratehawk_data: hotel.ratehawk_data,
});

const HotelDetailsPage = () => {
  const { hotelId } = useParams<{ hotelId: string }>();
  const navigate = useNavigate();

  const [hotelData, setHotelData] = useState<HotelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    loadHotelData();
  }, [hotelId]);

  const loadHotelData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Loading hotel data for ID:", hotelId);

      // Try to get saved hotel data from localStorage
      const savedData = localStorage.getItem("selectedHotel");
      let initialHotelData: HotelData | null = null;

      if (savedData) {
        const parsedData: HotelData = JSON.parse(savedData);
        if (parsedData.hotel.id === hotelId) {
          console.log("✅ Found saved hotel data:", {
            hotelId: parsedData.hotel.id,
            hotelName: parsedData.hotel.name,
            destination: parsedData.searchContext?.destination,
          });
          initialHotelData = parsedData;
          setHotelData(initialHotelData);
        }
      }

      if (!initialHotelData) {
        console.warn("⚠️ No saved hotel data found for ID:", hotelId);
        setError("Hotel data not found. Please search for hotels again.");
        setLoading(false);
        return;
      }

      // Fetch detailed rates and static info
      await fetchHotelDetails(initialHotelData);

      // Check if this hotel is in favorites
      const favorites = JSON.parse(localStorage.getItem("favoriteHotels") || "[]");
      setIsFavorite(favorites.includes(hotelId));

      setLoading(false);
    } catch (err) {
      console.error("💥 Error loading hotel data:", err);
      setError(err instanceof Error ? err.message : "Failed to load hotel information. Please try again.");
      setLoading(false);
    }
  };

  const fetchStaticHotelInfo = async (hotelId: string) => {
    try {
      console.log("📚 Fetching static hotel info...");

      const response = await fetch(`${API_BASE_URL}/api/ratehawk/hotel/static-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId: hotelId,
          residency: "en-us",
        }),
      });

      if (!response.ok) {
        console.warn(`⚠️ Static info endpoint returned ${response.status}`);
        return null;
      }

      const responseData = await response.json();

      if (responseData.success && responseData.data) {
        console.log("✅ Static info fetched successfully");

        if (responseData.data.description) {
          const preview = responseData.data.description.substring(0, 100);
          console.log(`📝 Description found (${responseData.data.description.length} chars): ${preview}...`);
        } else {
          console.log("📝 No description in static info response");
        }

        return responseData.data;
      }

      console.log("⚠️ Static info response not in expected format");
      return null;
    } catch (error) {
      console.error("💥 Error fetching static info:", error);
      return null;
    }
  };

  const fetchHotelDetails = async (data: HotelData) => {
    try {
      console.log("🔍 Starting fetchHotelDetails...");

      const context = data.searchContext;

      if (!context || !context.checkin || !context.checkout) {
        console.warn("⚠️ Missing search context or dates");
        return;
      }

      // Get the actual RateHawk hotel ID from stored data instead of URL slug
      const ratehawkHotelId = data.hotel.ratehawk_data?.requested_hotel_id 
        || data.hotel.ratehawk_data?.ota_hotel_id 
        || data.hotel.ratehawk_data?.id
        || hotelId;

      console.log("🆔 Hotel ID resolution:", {
        urlParam: hotelId,
        ratehawkId: ratehawkHotelId,
        fromData: data.hotel.ratehawk_data?.requested_hotel_id || data.hotel.ratehawk_data?.ota_hotel_id
      });

      // Format dates helper
      const formatDate = (date: string | Date): string => {
        if (!date) return "";
        if (typeof date === "string") {
          if (date.includes("T")) return date.split("T")[0];
          if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
        }
        if (date instanceof Date) return date.toISOString().split("T")[0];
        return String(date);
      };

      // Format guests helper
      const formatGuests = (guests: any): Array<{ adults: number }> => {
        if (Array.isArray(guests)) {
          return guests.map((g) => ({
            adults: typeof g === "object" ? g.adults || 2 : g || 2,
          }));
        }
        if (typeof guests === "number") {
          return [{ adults: Math.max(1, guests) }];
        }
        return [{ adults: 2 }];
      };

      const requestBody = {
        hotelId: ratehawkHotelId,
        searchContext: {
          checkin: formatDate(context.checkin),
          checkout: formatDate(context.checkout),
          guests: formatGuests(context.guests),
        },
        residency: "en-us",
        currency: "USD",
      };

      console.log("📤 Fetching rates and static info in parallel with hotelId:", ratehawkHotelId);

      // Fetch both rates AND static info in parallel for better performance
      const [ratesResponse, staticInfo] = await Promise.all([
        fetch(`${API_BASE_URL}/api/ratehawk/hotel/details`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }),
        fetchStaticHotelInfo(ratehawkHotelId),
      ]);

      console.log("📥 Both API responses received");

      // Process rates response
      let rates: any[] = [];
      let room_groups: any[] = [];

      if (ratesResponse.ok) {
        const ratesData = await ratesResponse.json();

        if (ratesData.data?.data?.hotels?.[0]) {
          const hotelDetails = ratesData.data.data.hotels[0];
          rates = hotelDetails.rates || [];
          room_groups = hotelDetails.room_groups || [];
          console.log(`✅ Found ${rates.length} rates and ${room_groups.length} room_groups`);
        }
      } else {
        console.warn(`⚠️ Rates API returned ${ratesResponse.status}`);
      }

      // Merge all data together
      const updatedHotelData: HotelData = {
        ...data,
        hotel: {
          ...data.hotel,
          // Static info from API (Solution 1)
          description: staticInfo?.description || data.hotel.description,
          fullDescription: staticInfo?.fullDescription || data.hotel.fullDescription,
          checkInTime: staticInfo?.checkInTime || data.hotel.checkInTime,
          checkOutTime: staticInfo?.checkOutTime || data.hotel.checkOutTime,
          policies: staticInfo?.policies?.length > 0 ? staticInfo.policies : data.hotel.policies,
          address: staticInfo?.address || data.hotel.address,
          phone: staticInfo?.phone || data.hotel.phone,
          email: staticInfo?.email || data.hotel.email,
          latitude: staticInfo?.coordinates?.latitude || data.hotel.latitude,
          longitude: staticInfo?.coordinates?.longitude || data.hotel.longitude,
          amenities: staticInfo?.amenities?.length > 0 ? staticInfo.amenities : data.hotel.amenities,
          // Rate data
          ratehawk_data: {
            ...data.hotel.ratehawk_data,
            rates: rates,
            room_groups: room_groups,
            static_info: staticInfo, // Store the full static info
          },
        },
      };

      console.log("🔄 Updated hotel with:");
      console.log(`   - ${rates.length} rates`);
      console.log(`   - ${staticInfo?.description ? "Description ✅" : "Description ❌"}`);
      console.log(`   - ${staticInfo?.checkInTime ? "Check-in time ✅" : "Check-in time ❌"}`);
      console.log(`   - ${staticInfo?.policies?.length || 0} policies`);
      console.log(`   - ${staticInfo?.amenities?.length || 0} amenities from static info`);

      setHotelData(updatedHotelData);
    } catch (error) {
      console.error("💥 Error fetching hotel details:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading hotel details...</p>
        </div>
      </div>
    );
  }

  if (error || !hotelData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/search")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  const { hotel } = hotelData;
  const hotelDetails = transformToHotelDetails(hotel);

  return (
    <div className="min-h-screen bg-background">
      <HotelHeroSection hotel={hotelDetails} />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <HotelInfoSection hotel={hotelDetails} />
            <RoomSelectionSection hotel={hotelDetails} isLoading={false} />
            <FacilitiesAmenitiesSection />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              <HotelPoliciesSection hotel={hotelDetails} />
              <MapSection
                latitude={hotelDetails.latitude}
                longitude={hotelDetails.longitude}
                address={hotelDetails.address}
                hotelName={hotelDetails.name}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetailsPage;
