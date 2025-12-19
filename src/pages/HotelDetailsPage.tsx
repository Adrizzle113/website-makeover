import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  HotelHeroSection,
  RoomSelectionSection,
  BookingSection,
  AmenitiesSection,
  MapSection,
  HotelInfoSection,
  HotelPoliciesSection,
  FacilitiesAmenitiesSection,
} from "@/components/hotel";
import { Footer } from "@/components/layout/Footer";
import { useBookingStore } from "@/stores/bookingStore";
import type { HotelDetails } from "@/types/booking";
import { API_BASE_URL } from "@/config/api";

const HotelDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { selectedHotel, setSelectedHotel, clearRoomSelection, searchParams } = useBookingStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ NEW: Function to fetch detailed rates from backend
  const fetchDetailedRates = async (hotelId: string) => {
    try {
      console.log(`🔍 Fetching detailed rates for hotel: ${hotelId}`);

      const userId = localStorage.getItem("userId");
      const storedHotelData = localStorage.getItem("selectedHotel");

      if (!userId) {
        console.log("⚠️ No userId found, skipping detailed rates fetch");
        return;
      }

      // Get search params from stored hotel data
      let searchContext = null;
      if (storedHotelData) {
        try {
          const parsed = JSON.parse(storedHotelData);
          searchContext = parsed.searchContext;
        } catch (e) {
          console.error("Error parsing stored hotel data:", e);
        }
      }

      if (!searchContext) {
        console.log("⚠️ No search context found, skipping detailed rates fetch");
        return;
      }

      setIsLoadingRooms(true);

      const requestBody = {
        userId: userId,
        hotelId: hotelId,
        searchParams: {
          checkin: searchContext.checkin,
          checkout: searchContext.checkout,
          guests: searchContext.formattedGuests || searchContext.guests,
        },
        residency: "en-us",
        currency: "USD",
      };

      console.log("📤 Fetching hotel details with:", requestBody);

      const response = await fetch(`${API_BASE_URL}/api/ratehawk/hotel/details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      console.log("📥 Hotel details response:", {
        success: data.success,
        hasData: !!data.data,
        ratesCount: data.data?.rates?.length || 0,
      });

      if (data.success && data.data) {
        console.log(`✅ Fetched ${data.data.rates?.length || 0} detailed rates for ${hotelId}`);

        // Update the selected hotel with detailed rates
        setSelectedHotel((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            ratehawk_data: {
              ...prev.ratehawk_data,
              // Merge the new detailed data
              ...data.data,
              // Preserve enhancedData structure
              enhancedData: {
                room_groups: data.data.room_groups || prev.ratehawk_data?.room_groups || [],
                rates: data.data.rates || [],
                metadata: {
                  total_room_groups: data.data.room_groups?.length || 0,
                  total_rates: data.data.rates?.length || 0,
                  source: "hotel_details_api",
                  fetched_at: new Date().toISOString(),
                },
              },
            },
          };
        });
      } else {
        console.log("⚠️ No detailed rates data in response");
      }
    } catch (error) {
      console.error("💥 Failed to fetch detailed rates:", error);
      // Don't throw - we can still show the hotel with basic info
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    const loadHotelDetails = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(null);
      clearRoomSelection();

      // First check if hotel is already in store (from card click)
      if (selectedHotel && selectedHotel.id === id) {
        console.log("✅ Hotel already in store, fetching detailed rates...");
        setIsLoading(false);

        // Fetch detailed rates even if hotel is in store
        await fetchDetailedRates(id);
        return;
      }

      // Try to load from localStorage (for page refresh or direct URL access)
      try {
        const storedData = localStorage.getItem("selectedHotel");
        if (storedData) {
          const parsed = JSON.parse(storedData);
          if (parsed.hotel && parsed.hotel.id === id) {
            console.log("✅ Loaded hotel from localStorage, fetching detailed rates...");
            setSelectedHotel(parsed.hotel);
            setIsLoading(false);

            // Fetch detailed rates
            await fetchDetailedRates(id);
            return;
          }
        }
      } catch (err) {
        console.error("Error parsing stored hotel data:", err);
      }

      // Fallback to mock data if no stored data found
      console.warn("No stored hotel data found, using mock data");
      setSelectedHotel(getMockHotel(id));
      setIsLoading(false);
    };

    loadHotelDetails();
  }, [id]); // Removed other dependencies to prevent infinite loops

  // Debug: Log selectedHotel data when it changes
  useEffect(() => {
    if (selectedHotel) {
      console.log(`🏠 HotelDetailsPage - Rendering with hotel:`, {
        id: selectedHotel.id,
        name: selectedHotel.name,
        hasRatehawkData: !!selectedHotel.ratehawk_data,
        ratehawkDataKeys: Object.keys(selectedHotel.ratehawk_data || {}),
        roomGroups: selectedHotel.ratehawk_data?.room_groups?.length || 0,
        enhancedRoomGroups: selectedHotel.ratehawk_data?.enhancedData?.room_groups?.length || 0,
        rates: selectedHotel.ratehawk_data?.rates?.length || 0,
        enhancedRates: selectedHotel.ratehawk_data?.enhancedData?.rates?.length || 0,
        roomsFromStore: selectedHotel.rooms?.length || 0,
      });
    }
  }, [selectedHotel]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading hotel details...</p>
        </div>
      </div>
    );
  }

  if (error && !selectedHotel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive text-lg mb-4">{error}</p>
          <a href="/dashboard/search" className="text-primary hover:underline">
            Back to Search
          </a>
        </div>
      </div>
    );
  }

  if (!selectedHotel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground text-lg">Hotel not found</p>
          <a href="/dashboard/search" className="text-primary hover:underline">
            Back to Search
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        <HotelHeroSection hotel={selectedHotel} />
        <AmenitiesSection amenities={selectedHotel.amenities} facilities={selectedHotel.facilities} />
        <HotelInfoSection hotel={selectedHotel} />
        <RoomSelectionSection hotel={selectedHotel} isLoading={isLoadingRooms} />
        <HotelPoliciesSection hotel={selectedHotel} />
        <MapSection
          latitude={selectedHotel.latitude}
          longitude={selectedHotel.longitude}
          address={`${selectedHotel.address}, ${selectedHotel.city}, ${selectedHotel.country}`}
          hotelName={selectedHotel.name}
        />
        <FacilitiesAmenitiesSection />
        <BookingSection currency={selectedHotel.currency} />
      </main>
      <Footer />
    </div>
  );
};

// Mock hotel data for development/fallback
const getMockHotel = (id: string): HotelDetails => ({
  id,
  name: "Grand Luxury Resort & Spa",
  description: "Experience unparalleled luxury at our award-winning resort.",
  fullDescription:
    "Nestled in a prime location, the Grand Luxury Resort & Spa offers an exceptional blend of sophisticated elegance and modern comfort. Our meticulously designed rooms and suites provide a serene sanctuary, while world-class dining options tantalize your taste buds. Unwind at our renowned spa or take a refreshing dip in our infinity pool overlooking breathtaking views.",
  address: "123 Luxury Avenue",
  city: "Dubai",
  country: "United Arab Emirates",
  starRating: 5,
  reviewScore: 9.2,
  reviewCount: 1250,
  mainImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=80",
  images: [
    {
      url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      alt: "Hotel exterior",
    },
    {
      url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      alt: "Luxury room",
    },
    {
      url: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80",
      alt: "Pool area",
    },
    {
      url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
      alt: "Restaurant",
    },
  ],
  amenities: [
    { id: "1", name: "Free WiFi" },
    { id: "2", name: "Swimming Pool" },
    { id: "3", name: "Spa & Wellness" },
    { id: "4", name: "Fitness Center" },
    { id: "5", name: "Restaurant" },
    { id: "6", name: "Room Service" },
    { id: "7", name: "Parking" },
    { id: "8", name: "Air Conditioning" },
  ],
  facilities: ["Business Center", "Conference Rooms", "Concierge Service", "Laundry Service"],
  priceFrom: 450,
  currency: "USD",
  latitude: 25.1972,
  longitude: 55.2744,
  checkInTime: "3:00 PM",
  checkOutTime: "12:00 PM",
  policies: ["No smoking in rooms", "Pets allowed on request", "Credit card required for guarantee"],
  rooms: [
    {
      id: "room-1",
      name: "Deluxe King Room",
      description: "Spacious room with king bed and city views",
      price: 450,
      currency: "USD",
      maxOccupancy: 2,
      squareFootage: 450,
      bedType: "King Bed",
      amenities: ["Free WiFi", "Mini Bar", "Safe", "Air Conditioning", "Coffee Maker", "Flat Screen TV"],
      mealPlan: "Breakfast Included",
      cancellationPolicy: "Free cancellation until 24h before check-in",
      available: 5,
    },
    {
      id: "room-2",
      name: "Premium Suite",
      description: "Luxurious suite with separate living area",
      price: 750,
      originalPrice: 850,
      currency: "USD",
      maxOccupancy: 4,
      squareFootage: 850,
      bedType: "King Bed + Sofa Bed",
      amenities: ["Free WiFi", "Mini Bar", "Safe", "Balcony", "Living Area", "Jacuzzi", "Butler Service"],
      mealPlan: "Half Board",
      cancellationPolicy: "Free cancellation until 48h before check-in",
      available: 3,
    },
    {
      id: "room-3",
      name: "Family Room",
      description: "Perfect for families with two queen beds",
      price: 550,
      currency: "USD",
      maxOccupancy: 4,
      squareFootage: 550,
      bedType: "2 Queen Beds",
      amenities: ["Free WiFi", "Mini Bar", "Safe", "Air Conditioning", "Connecting Rooms Available"],
      mealPlan: "Room Only",
      cancellationPolicy: "Non-refundable",
      available: 2,
    },
  ],
});

export default HotelDetailsPage;
