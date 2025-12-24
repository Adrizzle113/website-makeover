import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { HotelDetails, POIData } from "@/types/booking";
import { useBookingStore } from "@/stores/bookingStore";
import { fetchMapboxPOI } from "@/services/mapboxPOI";

// Import components from src/components/hotel
import { HotelHeroSection } from "../components/hotel/HotelHeroSection";
import { HotelInfoSection } from "../components/hotel/HotelInfoSection";
import { RoomSelectionSection } from "../components/hotel/RoomSelectionSection";
import { FacilitiesAmenitiesSection } from "../components/hotel/FacilitiesAmenitiesSection";
import { MapSection } from "../components/hotel/MapSection";
import { HotelPoliciesSection } from "../components/hotel/HotelPoliciesSection";
import { StickyBookingBar } from "../components/hotel/StickyBookingBar";
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

type AnyHotelImage =
  | string
  | { url: string; alt?: string }
  | { tmpl: string };

interface Hotel {
  id: string;
  name: string;
  location?: string;
  /** Legacy field from some API responses (stars) */
  rating?: number;
  /** Preferred field used by our global HotelDetails model (stars) */
  starRating?: number;
  reviewScore?: number;
  reviewCount?: number;
  price?: {
    amount: number;
    currency: string;
    period?: string;
  };
  /** Legacy main image field */
  image?: string;
  /** Preferred main image field */
  mainImage?: string;
  images?: AnyHotelImage[];
  amenities?: Array<string | { id?: string; name?: string }>;
  description?: string;
  fullDescription?: string;
  checkInTime?: string;
  checkOutTime?: string;
  policies?: any;
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
const transformToHotelDetails = (hotel: Hotel): HotelDetails => {
  const anyHotel = hotel as any;

  const normalizeImageUrl = (url: string) => url.replace("{size}", "1024x768");

  const images: HotelDetails["images"] = Array.isArray(anyHotel.images)
    ? anyHotel.images
        .map((img: AnyHotelImage, index: number) => {
          if (typeof img === "string") {
            return { url: normalizeImageUrl(img), alt: `${hotel.name} - Photo ${index + 1}` };
          }

          if (img && typeof img === "object") {
            if ("url" in img && typeof (img as any).url === "string") {
              const url = normalizeImageUrl((img as any).url);
              return { url, alt: (img as any).alt || `${hotel.name} - Photo ${index + 1}` };
            }

            if ("tmpl" in img && typeof (img as any).tmpl === "string") {
              const url = normalizeImageUrl((img as any).tmpl);
              return { url, alt: `${hotel.name} - Photo ${index + 1}` };
            }
          }

          return null;
        })
        .filter(Boolean)
    : [];

  const mainImage =
    (typeof anyHotel.mainImage === "string" && anyHotel.mainImage) ||
    (typeof anyHotel.image === "string" && anyHotel.image) ||
    images[0]?.url ||
    "/placeholder.svg";

  const amenities: HotelDetails["amenities"] = Array.isArray(anyHotel.amenities)
    ? anyHotel.amenities.map((a: any, idx: number) =>
        typeof a === "string"
          ? { id: `amenity-${idx}`, name: a }
          : { id: a?.id ? String(a.id) : `amenity-${idx}`, name: a?.name ? String(a.name) : String(a) },
      )
    : [];

  const starRating = Number(anyHotel.starRating ?? anyHotel.rating ?? 0);

  return {
    id: hotel.id,
    name: hotel.name,
    description: hotel.description || "",
    fullDescription: hotel.fullDescription || hotel.description || "",
    address: hotel.address || hotel.location || "",
    city: hotel.city || "",
    country: hotel.country || "",
    starRating,
    reviewScore: hotel.reviewScore || 0,
    reviewCount: hotel.reviewCount || 0,
    images,
    mainImage,
    amenities,
    priceFrom: hotel.price?.amount || 0,
    currency: hotel.price?.currency || "USD",
    latitude: hotel.latitude || 0,
    longitude: hotel.longitude || 0,
    checkInTime: hotel.checkInTime,
    checkOutTime: hotel.checkOutTime,
    policies: hotel.policies,
    ratehawk_data: hotel.ratehawk_data,
  };
};

const HotelDetailsPage = () => {
  const { hotelId } = useParams<{ hotelId: string }>();
  const navigate = useNavigate();
  const { selectedHotel, searchParams, searchResults } = useBookingStore();

  const [hotelData, setHotelData] = useState<HotelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [poiData, setPoiData] = useState<POIData | null>(null);
  const [poiLoading, setPoiLoading] = useState(false);

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

      // Fallback: use in-memory store data (covers cases where localStorage was cleared)
      if (!initialHotelData) {
        const storeHotel =
          (selectedHotel && selectedHotel.id === hotelId ? selectedHotel : null) ||
          (searchResults?.find((h) => h.id === hotelId) as any) ||
          null;

        if (storeHotel) {
          console.log("✅ Using in-memory hotel data from store for:", hotelId);
          initialHotelData = {
            hotel: storeHotel as any,
            searchContext: searchParams
              ? {
                  destination: searchParams.destination,
                  checkin: searchParams.checkIn,
                  checkout: searchParams.checkOut,
                  guests: searchParams.guests,
                }
              : (null as any),
          } as any;
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

  const fetchPOIData = async (latitude: number, longitude: number): Promise<void> => {
    if (!latitude || !longitude) {
      console.log("⚠️ No coordinates available for POI fetch");
      return;
    }

    setPoiLoading(true);
    try {
      const data = await fetchMapboxPOI(latitude, longitude);
      setPoiData(data);
    } catch (error) {
      console.error("❌ Error fetching POI:", error);
    } finally {
      setPoiLoading(false);
    }
  };

  const fetchHotelDetails = async (data: HotelData) => {
    try {
      console.log("🔍 Starting fetchHotelDetails...");

      const context = data.searchContext;

      // Get the actual RateHawk hotel ID from stored data instead of URL slug
      const ratehawkHotelId =
        data.hotel.ratehawk_data?.requested_hotel_id ||
        data.hotel.ratehawk_data?.ota_hotel_id ||
        data.hotel.ratehawk_data?.id ||
        hotelId;

      console.log("🆔 Hotel ID resolution:", {
        urlParam: hotelId,
        ratehawkId: ratehawkHotelId,
        fromData: data.hotel.ratehawk_data?.requested_hotel_id || data.hotel.ratehawk_data?.ota_hotel_id,
      });

      const canFetchRates = !!context?.checkin && !!context?.checkout;

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
      const formatGuests = (guests: any): Array<{ adults: number; children: number[] }> => {
        if (Array.isArray(guests)) {
          return guests.map((g) => {
            const adults = typeof g === "object" ? g.adults || 2 : g || 2;
            const children = typeof g === "object" && Array.isArray(g.children) ? g.children : [];
            return { adults, children };
          });
        }
        if (typeof guests === "number") {
          return [{ adults: Math.max(1, guests), children: [] }];
        }
        return [{ adults: 2, children: [] }];
      };

      const staticInfoPromise = fetchStaticHotelInfo(ratehawkHotelId);

      const ratesPromise: Promise<Response | null> = canFetchRates
        ? fetch(`${API_BASE_URL}/api/ratehawk/hotel/details`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              hotelId: ratehawkHotelId,
              searchContext: {
                checkin: formatDate(context.checkin),
                checkout: formatDate(context.checkout),
                guests: formatGuests(context.guests),
              },
              residency: "en-us",
              currency: "USD",
            }),
          })
        : Promise.resolve(null);

      console.log(
        canFetchRates
          ? "📤 Fetching rates and static info in parallel with hotelId:"
          : "📤 Fetching static hotel info (no search dates available) with hotelId:",
        ratehawkHotelId,
      );

      const [ratesResponse, staticInfo] = await Promise.all([ratesPromise, staticInfoPromise]);

      // Fetch POI using Mapbox (non-blocking) so it doesn't delay page load
      const lat = staticInfo?.coordinates?.latitude || data.hotel.latitude;
      const lng = staticInfo?.coordinates?.longitude || data.hotel.longitude;
      if (lat && lng) {
        fetchPOIData(lat, lng);
      }

      console.log("📥 API responses received");

      // Process rates response
      let rates: any[] = [];
      let room_groups: any[] = [];

      if (ratesResponse && ratesResponse.ok) {
        const ratesData = await ratesResponse.json();

        if (ratesData.data?.data?.hotels?.[0]) {
          const hotelDetails = ratesData.data.data.hotels[0];
          rates = hotelDetails.rates || [];
          room_groups = hotelDetails.room_groups || [];
          console.log(`✅ Found ${rates.length} rates and ${room_groups.length} room_groups`);
        }
      } else if (ratesResponse) {
        console.warn(`⚠️ Rates API returned ${ratesResponse.status}`);
      } else {
        console.warn("⚠️ Rates API not called (missing search dates)");
      }

      // Merge all data together
      const updatedHotelData: HotelData = {
        ...data,
        hotel: {
          ...data.hotel,
          // Static info from API (Solution 1)
          description: staticInfo?.description || data.hotel.description,
          fullDescription: staticInfo?.description || staticInfo?.fullDescription || data.hotel.fullDescription,
          checkInTime: staticInfo?.checkInTime || data.hotel.checkInTime,
          checkOutTime: staticInfo?.checkOutTime || data.hotel.checkOutTime,
          policies: staticInfo?.policies?.length > 0 ? staticInfo.policies : data.hotel.policies,
          address: staticInfo?.address || data.hotel.address,
          phone: staticInfo?.phone || data.hotel.phone,
          email: staticInfo?.email || data.hotel.email,
          latitude: staticInfo?.coordinates?.latitude || data.hotel.latitude,
          longitude: staticInfo?.coordinates?.longitude || data.hotel.longitude,
          amenities: staticInfo?.amenities?.length > 0 ? staticInfo.amenities : data.hotel.amenities,

          // Ensure hero images + star rating are available even if stored data is missing them
          starRating: staticInfo?.starRating ?? data.hotel.starRating,
          rating: staticInfo?.starRating ?? data.hotel.rating,
          images:
            Array.isArray((data.hotel as any).images) && (data.hotel as any).images.length > 0
              ? (data.hotel as any).images
              : (staticInfo?.images || []).map((u: string) => String(u).replace("{size}", "1024x768")),
          mainImage:
            (data.hotel as any).mainImage ||
            data.hotel.image ||
            (staticInfo?.images?.[0] ? String(staticInfo.images[0]).replace("{size}", "1024x768") : undefined),
          image:
            data.hotel.image ||
            (staticInfo?.images?.[0] ? String(staticInfo.images[0]).replace("{size}", "1024x768") : undefined),

          // Rate data
          ratehawk_data: {
            ...data.hotel.ratehawk_data,
            ...(rates.length > 0 ? { rates } : {}),
            ...(room_groups.length > 0 ? { room_groups } : {}),
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
    <div className="min-h-screen bg-background pb-24">
      <HotelHeroSection hotel={hotelDetails} />

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <HotelInfoSection hotel={hotelDetails} />
          <RoomSelectionSection hotel={hotelDetails} isLoading={false} />
          <HotelPoliciesSection hotel={hotelDetails} />
          <MapSection
            latitude={hotelDetails.latitude}
            longitude={hotelDetails.longitude}
            address={hotelDetails.address}
            hotelName={hotelDetails.name}
            nearby={poiData?.nearby}
            airports={poiData?.airports}
            subways={poiData?.subways}
            placesOfInterest={poiData?.placesOfInterest}
            isLoading={poiLoading}
          />
          <FacilitiesAmenitiesSection />
        </div>
      </div>

      <StickyBookingBar hotelId={hotelDetails.id} hotelName={hotelDetails.name} />
    </div>
  );
};

export default HotelDetailsPage;
