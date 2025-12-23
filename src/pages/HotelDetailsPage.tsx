import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { useBookingStore } from "@/stores/bookingStore";
import type { HotelDetails, HotelImage, HotelAmenity } from "@/types/booking";
import {
  HotelHeroSection,
  RoomSelectionSection,
  HotelInfoSection,
  FacilitiesAmenitiesSection,
  MapSection,
  HotelPoliciesSection,
} from "@/components/hotel";

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
  amenities?: (string | { id?: string; name?: string })[];
  description?: string;
  ratehawk_data?: any;
  latitude?: number;
  longitude?: number;
}

interface HotelData {
  hotel: RawHotel;
  searchContext: SearchContext;
  allAvailableHotels?: number;
  selectedFromPage?: number;
}

const HotelDetailsPage = () => {
  const { hotelId } = useParams<{ hotelId: string }>();
  const navigate = useNavigate();
  
  const { setSearchParams, setSelectedHotel, clearRoomSelection } = useBookingStore();

  const [hotelData, setHotelData] = useState<HotelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRates, setLoadingRates] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHotelData();
    // Clear any previously selected rooms when loading a new hotel
    clearRoomSelection();
  }, [hotelId]);

  const loadHotelData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Loading hotel data for ID:", hotelId);

      // Try to get saved hotel data from localStorage
      const savedData = localStorage.getItem("selectedHotel");
      let parsedHotelData: HotelData | null = null;

      if (savedData) {
        const parsedData: HotelData = JSON.parse(savedData);
        if (parsedData.hotel.id === hotelId) {
          console.log("✅ Found saved hotel data:", {
            hotelId: parsedData.hotel.id,
            hotelName: parsedData.hotel.name,
            destination: parsedData.searchContext?.destination,
          });
          parsedHotelData = parsedData;
          setHotelData(parsedHotelData);
        }
      }

      if (!parsedHotelData) {
        console.warn("⚠️ No saved hotel data found for ID:", hotelId);
        setError("Hotel data not found. Please search for hotels again.");
        setLoading(false);
        return;
      }

      // Transform and store in booking store
      const hotelDetails = transformToHotelDetails(parsedHotelData.hotel);
      setSelectedHotel(hotelDetails);
      
      // Update search params in store
      if (parsedHotelData.searchContext) {
        const context = parsedHotelData.searchContext;
        const guestCount = Array.isArray(context.guests) 
          ? context.guests.reduce((sum, g) => sum + (g.adults || 2), 0)
          : context.guests || 2;
        
        setSearchParams({
          destination: context.destination || "",
          destinationId: context.destinationId,
          checkIn: new Date(context.checkin),
          checkOut: new Date(context.checkout),
          guests: guestCount,
          rooms: Array.isArray(context.guests) ? context.guests.length : 1,
        });
      }

      setLoading(false);

      // Fetch detailed rates (async, updates the hotel in store)
      await fetchDetailedRates(parsedHotelData);

    } catch (err) {
      console.error("💥 Error loading hotel data:", err);
      setError(err instanceof Error ? err.message : "Failed to load hotel information. Please try again.");
      setLoading(false);
    }
  };

  const transformToHotelDetails = (hotel: RawHotel): HotelDetails => {
    // Extract city and country from location
    const locationParts = hotel.location?.split(",").map(s => s.trim()) || [];
    const city = locationParts[0] || "";
    const country = locationParts[locationParts.length - 1] || "";

    // Transform images
    const images: HotelImage[] = [];
    if (hotel.images && hotel.images.length > 0) {
      hotel.images.forEach(img => {
        images.push({ url: img, alt: hotel.name });
      });
    } else if (hotel.image) {
      images.push({ url: hotel.image, alt: hotel.name });
    }

    // Transform amenities
    const amenities: HotelAmenity[] = (hotel.amenities || [])
      .map((amenity, index) => {
        const name = typeof amenity === "string" ? amenity : amenity?.name || "";
        const id = typeof amenity === "string" ? `amenity_${index}` : amenity?.id || `amenity_${index}`;
        return name ? { id, name } : null;
      })
      .filter((a): a is HotelAmenity => a !== null);

    return {
      id: hotel.id,
      name: hotel.name,
      description: hotel.description || "",
      fullDescription: hotel.description,
      address: hotel.location || "",
      city,
      country,
      starRating: hotel.rating || 0,
      reviewScore: hotel.reviewScore,
      reviewCount: hotel.reviewCount,
      images,
      mainImage: hotel.image || hotel.images?.[0] || "/placeholder.svg",
      amenities,
      priceFrom: hotel.price?.amount || 0,
      currency: hotel.price?.currency || "USD",
      latitude: hotel.latitude,
      longitude: hotel.longitude,
      ratehawk_data: hotel.ratehawk_data,
      checkInTime: "3:00 PM",
      checkOutTime: "11:00 AM",
    };
  };

  const fetchDetailedRates = async (data: HotelData) => {
    try {
      setLoadingRates(true);
      console.log("🔍 Starting fetchDetailedRates...");

      const context = data.searchContext;

      if (!context || !context.checkin || !context.checkout) {
        console.warn("⚠️ Missing dates in searchContext, skipping detailed rates fetch");
        setLoadingRates(false);
        return;
      }

      const formatDate = (date: string | Date): string => {
        if (!date) return "";
        if (typeof date === "string") {
          if (date.includes("T")) return date.split("T")[0];
          if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
        }
        if (date instanceof Date) return date.toISOString().split("T")[0];
        return String(date);
      };

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

      const response = await fetch(`${API_BASE_URL}/api/ratehawk/hotel/details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.warn(`⚠️ Hotel details endpoint returned ${response.status}`);
        setLoadingRates(false);
        return;
      }

      const responseData = await response.json();
      console.log("📥 Response received:", responseData);

      // Update the hotel in store with new ratehawk_data
      if (responseData.success && responseData.data) {
        const updatedHotel = transformToHotelDetails(data.hotel);
        
        // Merge the fetched rates data into ratehawk_data
        updatedHotel.ratehawk_data = {
          ...data.hotel.ratehawk_data,
          ...responseData.data,
        };
        
        setSelectedHotel(updatedHotel);
        console.log("✅ Updated hotel with detailed rates");
      }

      setLoadingRates(false);
    } catch (error) {
      console.error("💥 Error fetching detailed rates:", error);
      setLoadingRates(false);
    }
  };

  // Get the hotel details from the store for the modular components
  const selectedHotel = useBookingStore((state) => state.selectedHotel);

  // Transform amenities for the FacilitiesAmenitiesSection
  const amenitiesForFacilities = useMemo(() => {
    if (!selectedHotel?.amenities) return undefined;
    
    // Group amenities by category (simple grouping)
    const grouped: Record<string, string[]> = {
      general: [],
    };
    
    selectedHotel.amenities.forEach((amenity) => {
      grouped.general.push(amenity.name);
    });
    
    return grouped;
  }, [selectedHotel?.amenities]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading hotel details...</p>
        </div>
      </div>
    );
  }

  if (error || !hotelData || !selectedHotel) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
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
      {/* Hero Section with Image Gallery */}
      <HotelHeroSection hotel={selectedHotel} />

      {/* Room Selection Section */}
      <RoomSelectionSection hotel={selectedHotel} isLoading={loadingRates} />

      {/* Hotel Info Section with Sidebar */}
      <HotelInfoSection hotel={selectedHotel} />

      {/* Facilities & Amenities Section */}
      <FacilitiesAmenitiesSection amenities={amenitiesForFacilities} />

      {/* Map Section */}
      <MapSection
        address={selectedHotel.address}
        hotelName={selectedHotel.name}
        latitude={selectedHotel.latitude}
        longitude={selectedHotel.longitude}
      />

      {/* Hotel Policies Section */}
      <HotelPoliciesSection hotel={selectedHotel} />
    </div>
  );
};

export default HotelDetailsPage;
