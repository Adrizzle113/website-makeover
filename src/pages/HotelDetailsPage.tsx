import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

// Import travelfrontend sections
import { HeroSection } from "../screens/HotelDetails/sections/HeroSection";
import { HotelInfoSection } from "../screens/HotelDetails/sections/HotelInfoSection";
import { RoomSelectionSection } from "../screens/HotelDetails/sections/RoomSelectionSection";
import { FacilitiesGridSection } from "../screens/HotelDetails/sections/FacilitiesGridSection";
import { MapSection } from "../screens/HotelDetails/sections/MapSection";
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
  ratehawk_data?: any;
}

interface HotelData {
  hotel: Hotel;
  searchContext: SearchContext;
  allAvailableHotels?: number;
  selectedFromPage?: number;
}

interface ProcessedRoom {
  id: string;
  name: string;
  type: string;
  price: number;
  currency: string;
  image: string;
  bedding: string;
  occupancy: string;
  size: string;
  amenities: string[];
  cancellation: string;
  paymentType: string;
  availability: number;
  originalRate?: any;
  rgHash?: string;
}

const HotelDetailsPage = () => {
  const { hotelId } = useParams<{ hotelId: string }>();
  const navigate = useNavigate();

  const [hotelData, setHotelData] = useState<HotelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<ProcessedRoom | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

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
      console.log("📦 hotelData:", data);
      console.log("📦 searchContext:", data.searchContext);

      // Get searchContext from hotelData
      const context = data.searchContext;

      // Validate that we have the required data
      if (!context) {
        console.warn("⚠️ Missing searchContext, skipping detailed rates fetch");
        return;
      }

      if (!context.checkin || !context.checkout) {
        console.warn("⚠️ Missing dates in searchContext, skipping detailed rates fetch");
        return;
      }

      // Format dates helper
      const formatDate = (date: string | Date): string => {
        if (!date) return "";

        if (typeof date === "string") {
          // If it's an ISO string, extract YYYY-MM-DD
          if (date.includes("T")) {
            return date.split("T")[0];
          }
          // If already in YYYY-MM-DD format, return as-is
          if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return date;
          }
        }

        if (date instanceof Date) {
          return date.toISOString().split("T")[0];
        }

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

      console.log("📤 Sending request to fetch detailed rates");
      console.log("📤 Request body:", JSON.stringify(requestBody, null, 2));
      console.log("📤 Endpoint:", `${API_BASE_URL}/api/ratehawk/hotel/details`);

      const response = await fetch(`${API_BASE_URL}/api/ratehawk/hotel/details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("📥 Response status:", response.status);

      if (!response.ok) {
        console.warn(`⚠️ Hotel details endpoint returned ${response.status}, continuing with existing data`);
        return;
      }

      const responseData = await response.json();
      console.log("📥 Response received:", responseData);

      // Extract rates and room_groups from response
      let rates: any[] = [];
      let room_groups: any[] = [];

      // Primary path: data.data.hotels[0]
      if (responseData.data?.data?.hotels?.[0]) {
        const hotelDetails = responseData.data.data.hotels[0];
        rates = hotelDetails.rates || [];
        room_groups = hotelDetails.room_groups || [];
        console.log(`✅ Found ${rates.length} rates and ${room_groups.length} room_groups`);
      }

      if (rates.length > 0 || room_groups.length > 0) {
        console.log(`🔄 Updating hotel ratehawk_data with fetched rates...`);

        // Update the hotel data with fetched rates and room_groups
        const updatedHotelData: HotelData = {
          ...data,
          hotel: {
            ...data.hotel,
            ratehawk_data: {
              ...data.hotel.ratehawk_data,
              rates: rates,
              room_groups: room_groups,
            },
          },
        };

        console.log(`✅ Updated hotel data with ${rates.length} rates and ${room_groups.length} room_groups`);
        setHotelData(updatedHotelData);
      } else {
        console.warn("⚠️ No rates or room_groups found in response");
      }
    } catch (error) {
      console.error("💥 ========== ERROR DETAILS ==========");
      console.error("💥 Error type:", error?.constructor?.name);
      console.error("💥 Error message:", error instanceof Error ? error.message : String(error));
      console.error("💥 Full error:", error);
      console.error("💥 ====================================");
    }
  };

  const handleRoomSelect = (room: ProcessedRoom, quantity: number) => {
    console.log("🛏️ Room selected:", room, "Quantity:", quantity);
    setSelectedRoom(room);
    setSelectedQuantity(quantity);

    // Navigate to booking or handle selection
    navigate(`/booking/${hotelId}`, {
      state: {
        hotel: hotelData?.hotel,
        room,
        quantity,
        searchContext: hotelData?.searchContext,
      },
    });
  };

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem("favoriteHotels") || "[]");

    if (isFavorite) {
      const updated = favorites.filter((id: string) => id !== hotelId);
      localStorage.setItem("favoriteHotels", JSON.stringify(updated));
      setIsFavorite(false);
    } else {
      favorites.push(hotelId);
      localStorage.setItem("favoriteHotels", JSON.stringify(favorites));
      setIsFavorite(true);
    }
  };

  const shareHotel = () => {
    if (navigator.share && hotelData) {
      navigator.share({
        title: hotelData.hotel.name,
        text: `Check out ${hotelData.hotel.name}`,
        url: window.location.href,
      });
    }
  };

  const handleBackToResults = () => {
    navigate(-1);
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

  const { hotel, searchContext } = hotelData;

  // Prepare images for hero section
  const heroImages = [
    { src: hotel.image || "", alt: hotel.name },
    // Add more images if available from ratehawk_data
    ...(hotel.ratehawk_data?.static_vm?.images?.slice(0, 4).map((img: any, index: number) => ({
      src: img.tmpl?.replace("{size}", "1024x768") || img.url || hotel.image,
      alt: `${hotel.name} - Image ${index + 2}`,
    })) || []),
  ];

  return (
    <div className="min-h-screen bg-[#f3ecdc]">
      {/* Hero Section - Full Width */}
      <HeroSection
        hotel={hotel}
        searchContext={searchContext}
        images={heroImages}
        onBack={handleBackToResults}
        onShare={shareHotel}
        onToggleFavorite={toggleFavorite}
        isFavorite={isFavorite}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Hotel Details Section */}
            <HotelInfoSection hotel={hotel} searchContext={searchContext} />

            {/* Room Selection Section */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Rooms</h2>
                <RoomSelectionSection
                  hotel={hotel}
                  searchContext={searchContext}
                  onRoomSelect={handleRoomSelect}
                  selectedRoomId={selectedRoom?.id}
                  selectedQuantity={selectedQuantity}
                />
              </CardContent>
            </Card>

            {/* Facilities Section */}
            {hotel.amenities && hotel.amenities.length > 0 && <FacilitiesGridSection amenities={hotel.amenities} />}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              {/* Hotel Policies */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Hotel Policies</h3>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Check-in:</span> 3:00 PM
                    </div>
                    <div>
                      <span className="font-medium">Check-out:</span> 12:00 PM
                    </div>
                    <div>
                      <span className="font-medium">Cancellation:</span> Free cancellation available on select rooms
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Map Section */}
              {hotel.location && <MapSection location={hotel.location} hotelName={hotel.name} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetailsPage;
