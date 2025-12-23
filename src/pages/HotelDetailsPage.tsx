import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

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

      // Fetch detailed rates and update hotel data
      await fetchDetailedRates(initialHotelData);

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

  const fetchDetailedRates = async (data: HotelData) => {
    try {
      console.log("🔍 Starting fetchDetailedRates...");

      const context = data.searchContext;

      if (!context || !context.checkin || !context.checkout) {
        console.warn("⚠️ Missing search context or dates");
        return;
      }

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
        hotelId: hotelId,
        searchContext: {
          checkin: formatDate(context.checkin),
          checkout: formatDate(context.checkout),
          guests: formatGuests(context.guests),
        },
        residency: "en-us",
        currency: "USD",
      };

      console.log("📤 Fetching detailed rates from API");

      const response = await fetch(`${API_BASE_URL}/api/ratehawk/hotel/details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.warn(`⚠️ API returned ${response.status}`);
        return;
      }

      const responseData = await response.json();
      console.log("📥 API Response received");

      // Extract rates, room_groups, and other hotel information
      let rates: any[] = [];
      let room_groups: any[] = [];
      let description: string | null = null;
      let fullDescription: string | null = null;
      let checkInTime: string | null = null;
      let checkOutTime: string | null = null;
      let policies: string[] = [];
      let additionalInfo: any = {};
      let staticData: any = null;

      if (responseData.data?.data?.hotels?.[0]) {
        const hotelDetails = responseData.data.data.hotels[0];
        rates = hotelDetails.rates || [];
        room_groups = hotelDetails.room_groups || [];
        staticData = hotelDetails;

        // Log the structure to see what's available
        console.log("📊 Static dump structure:", {
          topLevelKeys: Object.keys(hotelDetails),
          hasStaticVm: !!hotelDetails.static_vm,
          staticVmKeys: hotelDetails.static_vm ? Object.keys(hotelDetails.static_vm) : [],
          hasFacts: !!hotelDetails.facts,
          factsKeys: hotelDetails.facts ? Object.keys(hotelDetails.facts) : [],
        });

        // Extract description from various possible locations
        description =
          hotelDetails.description ||
          hotelDetails.hotel_description ||
          hotelDetails.static_vm?.description ||
          hotelDetails.static_vm?.hotel_description ||
          hotelDetails.facts?.description ||
          hotelDetails.facts?.hotel_description ||
          null;

        // Extract full/detailed description
        fullDescription =
          hotelDetails.full_description ||
          hotelDetails.static_vm?.full_description ||
          hotelDetails.static_vm?.detailed_description ||
          description; // Fallback to regular description

        // Extract check-in/check-out times
        checkInTime =
          hotelDetails.check_in_time ||
          hotelDetails.static_vm?.check_in_time ||
          hotelDetails.facts?.check_in_time ||
          null;

        checkOutTime =
          hotelDetails.check_out_time ||
          hotelDetails.static_vm?.check_out_time ||
          hotelDetails.facts?.check_out_time ||
          null;

        // Extract policies
        if (hotelDetails.policies) {
          policies = Array.isArray(hotelDetails.policies) ? hotelDetails.policies : [hotelDetails.policies];
        } else if (hotelDetails.static_vm?.policies) {
          policies = Array.isArray(hotelDetails.static_vm.policies)
            ? hotelDetails.static_vm.policies
            : [hotelDetails.static_vm.policies];
        } else if (hotelDetails.facts?.policies) {
          policies = Array.isArray(hotelDetails.facts.policies)
            ? hotelDetails.facts.policies
            : [hotelDetails.facts.policies];
        }

        // Extract additional useful information
        additionalInfo = {
          address: hotelDetails.address || hotelDetails.static_vm?.address,
          city: hotelDetails.city || hotelDetails.static_vm?.city,
          country: hotelDetails.country || hotelDetails.static_vm?.country,
          phone: hotelDetails.phone || hotelDetails.static_vm?.phone || hotelDetails.facts?.phone,
          email: hotelDetails.email || hotelDetails.static_vm?.email || hotelDetails.facts?.email,
          star_rating: hotelDetails.star_rating || hotelDetails.static_vm?.star_rating,
          latitude: hotelDetails.latitude || hotelDetails.static_vm?.latitude,
          longitude: hotelDetails.longitude || hotelDetails.static_vm?.longitude,
        };

        console.log(`✅ Found ${rates.length} rates and ${room_groups.length} room_groups`);
        if (description) {
          console.log(`📝 Description found (${description.length} chars):`, description.substring(0, 100) + "...");
        } else {
          console.log(`📝 Description not found. Available text fields:`, {
            description: hotelDetails.description,
            hotel_description: hotelDetails.hotel_description,
            static_vm_description: hotelDetails.static_vm?.description,
            facts_description: hotelDetails.facts?.description,
          });
        }

        console.log(`ℹ️ Additional info extracted:`, {
          hasCheckInTime: !!checkInTime,
          hasCheckOutTime: !!checkOutTime,
          policiesCount: policies.length,
          hasAddress: !!additionalInfo.address,
          hasCoordinates: !!(additionalInfo.latitude && additionalInfo.longitude),
        });
      }

      // Update hotel data with all fetched information
      const updatedHotelData: HotelData = {
        ...data,
        hotel: {
          ...data.hotel,
          description: description || data.hotel.description,
          fullDescription: fullDescription || data.hotel.fullDescription,
          checkInTime: checkInTime || data.hotel.checkInTime,
          checkOutTime: checkOutTime || data.hotel.checkOutTime,
          policies: policies.length > 0 ? policies : data.hotel.policies,
          address: additionalInfo.address || data.hotel.address,
          city: additionalInfo.city || data.hotel.city,
          country: additionalInfo.country || data.hotel.country,
          phone: additionalInfo.phone || data.hotel.phone,
          email: additionalInfo.email || data.hotel.email,
          latitude: additionalInfo.latitude || data.hotel.latitude,
          longitude: additionalInfo.longitude || data.hotel.longitude,
          ratehawk_data: {
            ...data.hotel.ratehawk_data,
            rates: rates,
            room_groups: room_groups,
            static_vm: staticData?.static_vm || data.hotel.ratehawk_data?.static_vm,
            facts: staticData?.facts || data.hotel.ratehawk_data?.facts,
          },
        },
      };

      console.log(`🔄 Updated hotel with ${rates.length} rates${description ? " and description" : ""}`);
      setHotelData(updatedHotelData);
    } catch (error) {
      console.error("💥 Error fetching rates:", error);
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

  return (
    <div className="min-h-screen bg-background">
      <HotelHeroSection hotel={hotel} />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <HotelInfoSection hotel={hotel} />
            <RoomSelectionSection hotel={hotel} isLoading={false} />
            <FacilitiesAmenitiesSection />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              <HotelPoliciesSection hotel={hotel} />
              <MapSection
                latitude={hotel.latitude}
                longitude={hotel.longitude}
                address={hotel.location || hotel.address}
                hotelName={hotel.name}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetailsPage;
