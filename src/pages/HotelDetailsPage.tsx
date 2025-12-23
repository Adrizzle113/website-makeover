import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

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

interface RoomRate {
  id: string;
  roomName: string;
  price: number;
  currency: string;
  cancellationPolicy?: string;
  mealPlan?: string;
  rg_hash?: string;
}

const HotelDetailsPage = () => {
  const { hotelId } = useParams<{ hotelId: string }>();
  const navigate = useNavigate();

  const [hotelData, setHotelData] = useState<HotelData | null>(null);
  const [rates, setRates] = useState<RoomRate[]>([]);
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
      let hotelData: HotelData | null = null;

      if (savedData) {
        const parsedData: HotelData = JSON.parse(savedData);
        if (parsedData.hotel.id === hotelId) {
          console.log("✅ Found saved hotel data:", {
            hotelId: parsedData.hotel.id,
            hotelName: parsedData.hotel.name,
            destination: parsedData.searchContext?.destination,
          });
          hotelData = parsedData;
          setHotelData(hotelData);
        }
      }

      if (!hotelData) {
        console.warn("⚠️ No saved hotel data found for ID:", hotelId);
        setError("Hotel data not found. Please search for hotels again.");
        setLoading(false);
        return;
      }

      // Fetch detailed rates
      await fetchDetailedRates(hotelData);

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

      // Extract rates from response
      let extractedRates: RoomRate[] = [];

      // Try different response structures
      if (responseData.success && responseData.data) {
        // Handle nested structure: data.data.hotels[0].rates
        if (responseData.data.data?.hotels?.[0]?.rates) {
          extractedRates = processRates(responseData.data.data.hotels[0].rates);
          console.log("✅ Found rates in data.data.hotels[0].rates");
        }
        // Handle structure: data.rates
        else if (responseData.data.rates) {
          extractedRates = processRates(responseData.data.rates);
          console.log("✅ Found rates in data.rates");
        }
        // Handle structure: data.hotels[0].rates
        else if (responseData.data.hotels?.[0]?.rates) {
          extractedRates = processRates(responseData.data.hotels[0].rates);
          console.log("✅ Found rates in data.hotels[0].rates");
        }
      }
      // Handle direct rates array
      else if (responseData.rates) {
        extractedRates = processRates(responseData.rates);
        console.log("✅ Found rates in direct rates array");
      }

      if (extractedRates.length > 0) {
        console.log(`✅ Successfully extracted ${extractedRates.length} rates`);
        setRates(extractedRates);
      } else {
        console.warn("⚠️ No rates found in response");
      }
    } catch (error) {
      console.error("💥 ========== ERROR DETAILS ==========");
      console.error("💥 Error type:", error?.constructor?.name);
      console.error("💥 Error message:", error instanceof Error ? error.message : String(error));
      console.error("💥 Full error:", error);
      console.error("💥 ====================================");
    }
  };

  const processRates = (rawRates: any[]): RoomRate[] => {
    if (!Array.isArray(rawRates)) {
      console.warn("⚠️ rawRates is not an array:", rawRates);
      return [];
    }

    return rawRates
      .map((rate, index) => {
        try {
          // Extract price
          let price = 0;
          if (rate.payment_options?.payment_types?.[0]?.show_amount) {
            price = parseFloat(rate.payment_options.payment_types[0].show_amount);
          } else if (rate.price) {
            price = parseFloat(rate.price);
          }

          // Extract currency
          const currency = rate.payment_options?.payment_types?.[0]?.show_currency_code || rate.currency || "USD";

          // Extract room name
          const roomName = rate.room_name || rate.name || rate.rg_ext?.name || `Room Type ${index + 1}`;

          // Extract meal plan
          const mealPlan = rate.meal || rate.mealPlan || "Room Only";

          // Extract cancellation policy
          const cancellationPolicy = rate.cancellation_policy?.type || rate.cancellationPolicy || "Unknown";

          return {
            id: rate.book_hash || rate.match_hash || rate.rg_hash || `rate_${index}`,
            roomName,
            price,
            currency,
            cancellationPolicy,
            mealPlan,
            rg_hash: rate.rg_hash,
          };
        } catch (err) {
          console.error("Error processing rate:", err, rate);
          return null;
        }
      })
      .filter((rate): rate is NonNullable<typeof rate> => rate !== null) as RoomRate[];
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

  const handleBookNow = (rate: RoomRate) => {
    console.log("📝 Booking room:", rate);
    // Navigate to booking page with rate info
    navigate(`/booking/${hotelId}`, {
      state: {
        hotel: hotelData?.hotel,
        rate,
        searchContext: hotelData?.searchContext,
      },
    });
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
    <div className="min-h-screen bg-gray-50">
      {/* Hotel Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <span className="mr-2">←</span> Back to results
          </button>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{hotel.name}</h1>
              {hotel.location && <p className="text-gray-600 mt-2">{hotel.location}</p>}
              {hotel.rating && (
                <div className="flex items-center mt-2">
                  <span className="text-yellow-500">★</span>
                  <span className="ml-1 font-semibold">{hotel.rating}</span>
                  {hotel.reviewCount && <span className="ml-2 text-gray-600">({hotel.reviewCount} reviews)</span>}
                </div>
              )}
            </div>
            <button onClick={toggleFavorite} className="p-3 rounded-full hover:bg-gray-100 transition">
              <span className="text-2xl">{isFavorite ? "❤️" : "🤍"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hotel Image */}
      {(hotel.image || hotel.images?.[0]) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <img
            src={hotel.image || hotel.images?.[0]}
            alt={hotel.name}
            className="w-full h-96 object-cover rounded-lg shadow-lg"
          />
        </div>
      )}

      {/* Hotel Description */}
      {hotel.description && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About this property</h2>
            <p className="text-gray-700 leading-relaxed">{hotel.description}</p>
          </div>
        </div>
      )}

      {/* Amenities */}
      {hotel.amenities && hotel.amenities.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Amenities</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {hotel.amenities.map((amenity, index) => (
                <div key={index} className="flex items-center text-gray-700">
                  <span className="mr-2">✓</span>
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Available Rooms */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Rooms</h2>

          {rates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading room rates... Please wait.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rates.map((rate) => (
                <div key={rate.id} className="border border-gray-200 rounded-lg p-6 hover:border-blue-500 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{rate.roomName}</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        {rate.mealPlan && (
                          <p>
                            <span className="font-medium">Meal:</span> {rate.mealPlan}
                          </p>
                        )}
                        {rate.cancellationPolicy && (
                          <p>
                            <span className="font-medium">Cancellation:</span> {rate.cancellationPolicy}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-6">
                      <div className="text-3xl font-bold text-gray-900">
                        {rate.currency} {rate.price.toFixed(2)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">per night</p>
                      <button
                        onClick={() => handleBookNow(rate)}
                        className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HotelDetailsPage;
