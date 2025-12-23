import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { HotelDetails, HotelImage, HotelAmenity } from "../types/booking";
import { useBookingStore } from "../stores/bookingStore";

// Import components from src/components/hotel
import { HotelHeroSection } from "../components/hotel/HotelHeroSection";
import { HotelInfoSection } from "../components/hotel/HotelInfoSection";
import { RoomSelectionSection } from "../components/hotel/RoomSelectionSection";
import { FacilitiesAmenitiesSection } from "../components/hotel/FacilitiesAmenitiesSection";
import { MapSection } from "../components/hotel/MapSection";
import { HotelPoliciesSection } from "../components/hotel/HotelPoliciesSection";
import { BookingSidebar } from "../components/hotel/BookingSidebar";

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

interface RawHotel {
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
  hotel: RawHotel;
  searchContext: SearchContext;
  allAvailableHotels?: number;
  selectedFromPage?: number;
}

// Transform raw hotel data to HotelDetails type
const transformToHotelDetails = (hotel: RawHotel): HotelDetails => {
  // Parse location into city and country
  const locationParts = (hotel.location || "").split(",").map(s => s.trim());
  const city = locationParts[0] || "";
  const country = locationParts[locationParts.length - 1] || "";

  // Transform string[] images to HotelImage[]
  const images: HotelImage[] = [];
  if (hotel.image) {
    images.push({ url: hotel.image, alt: hotel.name });
  }
  if (hotel.images) {
    hotel.images.forEach((img, i) => {
      if (img !== hotel.image) {
        images.push({ url: img, alt: `${hotel.name} - Image ${i + 1}` });
      }
    });
  }

  // Transform string[] amenities to HotelAmenity[]
  const amenities: HotelAmenity[] = (hotel.amenities || []).map((name, i) => ({
    id: `amenity-${i}`,
    name,
  }));

  return {
    id: hotel.id,
    name: hotel.name,
    description: hotel.description || "",
    address: hotel.location || "",
    city,
    country,
    starRating: hotel.rating || 0,
    reviewScore: hotel.reviewScore,
    reviewCount: hotel.reviewCount,
    images: images.length > 0 ? images : [{ url: "/placeholder.svg", alt: hotel.name }],
    mainImage: hotel.image || hotel.images?.[0] || "/placeholder.svg",
    amenities,
    priceFrom: hotel.price?.amount || 0,
    currency: hotel.price?.currency || "USD",
    latitude: hotel.ratehawk_data?.latitude,
    longitude: hotel.ratehawk_data?.longitude,
    ratehawk_data: hotel.ratehawk_data,
    checkInTime: "3:00 PM",
    checkOutTime: "12:00 PM",
    policies: ["Check-in from 3:00 PM", "Check-out by 12:00 PM"],
  };
};

const HotelDetailsPage = () => {
  const { hotelId } = useParams<{ hotelId: string }>();
  const navigate = useNavigate();
  const { setSelectedHotel, setSearchParams } = useBookingStore();

  const [hotelData, setHotelData] = useState<HotelData | null>(null);
  const [hotelDetails, setHotelDetails] = useState<HotelDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        
        // Normalize IDs for comparison (handle different formats)
        const normalizeId = (id: string) => id?.toLowerCase().replace(/[_\-\s]/g, '');
        const savedId = normalizeId(parsedData.hotel.id);
        const urlId = normalizeId(hotelId || '');
        
        console.log("🔍 Comparing hotel IDs:", { 
          savedId: parsedData.hotel.id, 
          urlId: hotelId,
          normalized: { savedId, urlId },
          match: savedId === urlId 
        });

        if (savedId === urlId || parsedData.hotel.id === hotelId) {
          console.log("✅ Found saved hotel data:", {
            hotelId: parsedData.hotel.id,
            hotelName: parsedData.hotel.name,
            destination: parsedData.searchContext?.destination,
          });
          initialHotelData = parsedData;
          setHotelData(initialHotelData);

          // Transform and set hotel details
          const transformed = transformToHotelDetails(parsedData.hotel);
          console.log("✅ Transformed hotel details:", transformed);
          setHotelDetails(transformed);
          setSelectedHotel(transformed);

          // Set search params for BookingSidebar
          const context = parsedData.searchContext;
          if (context) {
            const guestCount = Array.isArray(context.guests) 
              ? context.guests.reduce((sum, g) => sum + (g.adults || 2), 0)
              : context.guests || 2;
            
            setSearchParams({
              destination: context.destination,
              destinationId: context.destinationId,
              checkIn: new Date(context.checkin),
              checkOut: new Date(context.checkout),
              guests: guestCount,
              rooms: Array.isArray(context.guests) ? context.guests.length : 1,
            });
          }
        } else {
          console.warn("⚠️ Hotel ID mismatch:", { savedId: parsedData.hotel.id, urlId: hotelId });
        }
      } else {
        console.warn("⚠️ No selectedHotel in localStorage");
      }

      if (!initialHotelData) {
        console.warn("⚠️ No saved hotel data found for ID:", hotelId);
        setError("Hotel data not found. Please search for hotels again.");
        setLoading(false);
        return;
      }

      // Fetch detailed rates and update hotel data
      await fetchDetailedRates(initialHotelData);

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

      // Extract rates and room_groups
      let rates: any[] = [];
      let room_groups: any[] = [];

      if (responseData.data?.data?.hotels?.[0]) {
        const hotelApiData = responseData.data.data.hotels[0];
        rates = hotelApiData.rates || [];
        room_groups = hotelApiData.room_groups || [];
        console.log(`✅ Found ${rates.length} rates and ${room_groups.length} room_groups`);
      }

      if (rates.length > 0 || room_groups.length > 0) {
        // Update hotel data with fetched rates
        const updatedRawHotel: RawHotel = {
          ...data.hotel,
          ratehawk_data: {
            ...data.hotel.ratehawk_data,
            rates: rates,
            room_groups: room_groups,
          },
        };

        const updatedHotelData: HotelData = {
          ...data,
          hotel: updatedRawHotel,
        };

        console.log(`🔄 Updated hotel with ${rates.length} rates`);
        setHotelData(updatedHotelData);

        // Transform and update hotel details
        const transformed = transformToHotelDetails(updatedRawHotel);
        setHotelDetails(transformed);
        setSelectedHotel(transformed);
      }
    } catch (error) {
      console.error("💥 Error fetching rates:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading hotel details...</p>
        </div>
      </div>
    );
  }

  if (error || !hotelDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-destructive text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Oops! Something went wrong</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => navigate("/search")}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

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
            <HotelPoliciesSection hotel={hotelDetails} />
            <MapSection
              latitude={hotelDetails.latitude}
              longitude={hotelDetails.longitude}
              address={hotelDetails.address}
              hotelName={hotelDetails.name}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <BookingSidebar currency={hotelDetails.currency} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetailsPage;
