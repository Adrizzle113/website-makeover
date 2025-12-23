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

  // Function to fetch detailed rates from backend using room_groups + rg_hash matching
  const fetchDetailedRates = async (hotelId: string) => {
    console.log("🚀 fetchDetailedRates called for:", hotelId);

    try {
      const userId = localStorage.getItem("userId");
      const storedHotelData = localStorage.getItem("selectedHotel");

      if (!userId) {
        console.log("❌ No userId found, skipping detailed rates fetch");
        return;
      }

      // Get search params from stored hotel data
      let searchContext = null;
      if (storedHotelData) {
        try {
          const parsed = JSON.parse(storedHotelData);
          searchContext = parsed.searchContext;
          console.log("📋 searchContext:", searchContext);
        } catch (e) {
          console.error("❌ Error parsing stored hotel data:", e);
        }
      }

      if (!searchContext) {
        console.log("❌ No search context found, skipping detailed rates fetch");
        return;
      }

      setIsLoadingRooms(true);

      // Format dates correctly (YYYY-MM-DD)
      const formatDate = (dateString: string): string => {
        if (!dateString) return "";
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
        return dateString.split("T")[0];
      };

      // Format guests correctly (array of room objects)
      const formatGuests = (guests: any) => {
        if (Array.isArray(guests) && guests.length > 0 && guests[0]?.adults !== undefined) {
          return guests;
        }
        if (Array.isArray(guests) && guests.length > 0) {
          return guests;
        }
        if (typeof guests === "number") {
          return [{ adults: guests }];
        }
        return [{ adults: 2 }];
      };

      const requestBody = {
        userId: userId,
        hotelId: hotelId,
        searchParams: {
          checkin: formatDate(searchContext.checkin),
          checkout: formatDate(searchContext.checkout),
          guests: formatGuests(searchContext.formattedGuests || searchContext.guests),
        },
        residency: "en-us",
        currency: "USD",
      };

      console.log("📤 Fetching hotel details:", `${API_BASE_URL}/api/ratehawk/hotel/details`);

      const response = await fetch(`${API_BASE_URL}/api/ratehawk/hotel/details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      console.log("📥 Response received:", {
        success: data.success,
        hasData: !!data.data,
        ratesCount: data.data?.rates?.length || 0,
        roomGroupsCount: data.data?.room_groups?.length || 0,
      });

      // Handle the new API format: data.data.data.hotels[0] contains room_groups and rates
      let ratehawkData = null;
      if (data.data?.data?.hotels?.[0]) {
        ratehawkData = data.data.data.hotels[0];
        console.log("✅ Found rates in new API format (data.data.data.hotels[0])");
      } else if (data.data?.rates) {
        ratehawkData = data.data;
        console.log("✅ Found rates in standard format (data.data.rates)");
      }

      if (ratehawkData && selectedHotel) {
        const updated = {
          ...selectedHotel,
          ratehawk_data: {
            ...selectedHotel.ratehawk_data,
            // Store rates and room_groups at the top level for easy access
            rates: ratehawkData.rates || [],
            room_groups: ratehawkData.room_groups || [],
            // Also store in enhancedData for backward compatibility
            enhancedData: {
              room_groups: ratehawkData.room_groups || [],
              rates: ratehawkData.rates || [],
              metadata: {
                total_room_groups: ratehawkData.room_groups?.length || 0,
                total_rates: ratehawkData.rates?.length || 0,
                source: "hotel_details_api",
                fetched_at: new Date().toISOString(),
              },
            },
            // Store full nested data for reference
            data: data.data,
          },
        };

        console.log("✅ Updated hotel with rates:", {
          hotelId: updated.id,
          ratesCount: updated.ratehawk_data?.rates?.length,
          roomGroupsCount: updated.ratehawk_data?.room_groups?.length,
        });

        setSelectedHotel(updated);
      } else {
        console.log("❌ No rates data in response");
      }
    } catch (error) {
      console.error("💥 Error fetching rates:", error);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    const loadHotelDetails = async () => {
      console.log("🏨 loadHotelDetails called for id:", id);

      if (!id) return;

      setIsLoading(true);
      setError(null);
      clearRoomSelection();

      // First check if hotel is already in store (from card click)
      if (selectedHotel && selectedHotel.id === id) {
        console.log("✅ Hotel already in store:", selectedHotel.id);
        setIsLoading(false);
        await fetchDetailedRates(id);
        return;
      }

      // Try to load from localStorage (for page refresh or direct URL access)
      try {
        const storedData = localStorage.getItem("selectedHotel");
        if (storedData) {
          const parsed = JSON.parse(storedData);
          if (parsed.hotel && parsed.hotel.id === id) {
            console.log("✅ Loaded hotel from localStorage:", parsed.hotel.id);
            setSelectedHotel(parsed.hotel);
            setIsLoading(false);
            await fetchDetailedRates(id);
            return;
          }
        }
      } catch (err) {
        console.error("❌ Error parsing stored hotel data:", err);
      }

      // Fallback to mock data if no stored data found
      console.warn("⚠️ No stored hotel data found, using mock data");
      setSelectedHotel(getMockHotel(id));
      setIsLoading(false);
    };

    loadHotelDetails();
  }, [id]);

  // Debug logging
  useEffect(() => {
    if (selectedHotel) {
      console.log(`🏠 Hotel state updated:`, {
        id: selectedHotel.id,
        name: selectedHotel.name,
        roomGroups: selectedHotel.ratehawk_data?.room_groups?.length || 0,
        rates: selectedHotel.ratehawk_data?.rates?.length || 0,
        enhancedRates: selectedHotel.ratehawk_data?.enhancedData?.rates?.length || 0,
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

        {isLoadingRooms && (
          <div className="container mx-auto px-4 py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-muted-foreground">Loading room options...</p>
          </div>
        )}

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
  fullDescription: "Nestled in a prime location, the Grand Luxury Resort & Spa offers an exceptional blend of sophisticated elegance and modern comfort.",
  address: "123 Luxury Avenue",
  city: "Dubai",
  country: "United Arab Emirates",
  starRating: 5,
  reviewScore: 9.2,
  reviewCount: 1250,
  mainImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=80",
  images: [
    { url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80", alt: "Hotel exterior" },
    { url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80", alt: "Luxury room" },
  ],
  amenities: [
    { id: "1", name: "Free WiFi" },
    { id: "2", name: "Swimming Pool" },
    { id: "3", name: "Spa & Wellness" },
  ],
  facilities: ["Business Center", "Conference Rooms"],
  priceFrom: 450,
  currency: "USD",
  latitude: 25.1972,
  longitude: 55.2744,
  checkInTime: "3:00 PM",
  checkOutTime: "12:00 PM",
  policies: ["No smoking in rooms"],
  rooms: [],
});

export default HotelDetailsPage;
