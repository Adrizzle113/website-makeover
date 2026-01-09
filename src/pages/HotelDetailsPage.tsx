import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { HotelDetails, POIData } from "@/types/booking";

// Categorize flat amenities into grouped structure for display
const categorizeAmenities = (
  flatAmenities: Array<{ id: string; name: string }>
): Record<string, string[]> => {
  // Accessibility first to catch wheelchair items before other categories match partial keywords
  const categoryKeywords: Record<string, string[]> = {
    accessibility: ["wheelchair", "accessible", "accessibility", "disability", "mobility", "disabled"],
    popular: ["wifi", "pool", "spa", "fitness", "restaurant", "breakfast", "gym"],
    general: [
      "24-hour", "reception", "atm", "air conditioning", "non-smoking", "smoke-free", 
      "currency exchange", "electric car", "charging", "elevator", "lift", "express check", 
      "garden", "gift shop", "heating", "newspaper", "shopping", "terrace"
    ],
    rooms: [
      "cable tv", "flat-screen", "hairdryer", "hair dryer", "fireplace", "non-smoking room", 
      "room service", "shower", "bathtub", "toiletries", "minibar", "safe", "desk", "wardrobe", "iron"
    ],
    services: [
      "concierge", "dry-cleaning", "dry cleaning", "iron and board", "laundry", 
      "luggage storage", "luggage", "safe-deposit", "shoe shine", "telephone", "wake-up", "wake up"
    ],
    meals: ["bar", "breakfast", "coffeemaker", "coffee maker", "restaurant", "dining", "kitchen", "meal"],
    internet: ["wifi", "wi-fi", "internet", "broadband"],
    transfer: ["car rental", "shuttle", "airport", "taxi", "transfer"],
    languages: ["english", "french", "german", "spanish", "multi-language", "chinese", "italian", "portuguese"],
    recreation: ["bike rental", "fishing", "hiking", "sun deck", "library", "game room"],
    parking: ["parking", "valet", "garage"],
    poolBeach: [
      "heated swimming", "indoor pool", "outdoor pool", "pool facilities", "spa tub", 
      "swimming pool", "pool", "beach", "jacuzzi", "hot tub", "sun lounger"
    ],
    business: [
      "business center", "conference", "event facilities", "fax", "copy machine", 
      "meeting", "presentation"
    ],
    sports: ["cycling", "fitness", "gym", "tennis", "golf", "sport", "water sport"],
    beautyWellness: ["doctor", "first aid", "massage", "sauna", "spa", "steam room", "beauty", "wellness"],
    kids: ["babysitting", "childcare", "playground", "playroom", "kids", "children"],
    pets: ["pet", "dog", "cat", "animal"],
    healthSafety: [
      "covid", "contactless", "decontamination", "protection equipment", 
      "housekeeping", "sanitizer", "security", "fire extinguisher"
    ],
  };

  const categories: Record<string, string[]> = {};

  flatAmenities.forEach(({ name }) => {
    const lowerName = name.toLowerCase();
    let matched = false;
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(kw => lowerName.includes(kw))) {
        if (!categories[category]) categories[category] = [];
        if (!categories[category].includes(name)) {
          categories[category].push(name);
        }
        matched = true;
        break;
      }
    }
    
    // Add to uncategorized if no match found
    if (!matched) {
      if (!categories.uncategorized) categories.uncategorized = [];
      if (!categories.uncategorized.includes(name)) {
        categories.uncategorized.push(name);
      }
    }
  });

  return categories;
};
import { useBookingStore } from "@/stores/bookingStore";
import { fetchMapboxPOI } from "@/services/mapboxPOI";

// Import components from src/components/hotel
import { HotelHeroSection } from "../components/hotel/HotelHeroSection";
import { HotelInfoSection } from "../components/hotel/HotelInfoSection";
import { RoomSelectionSection } from "../components/hotel/RoomSelectionSection";
import { FacilitiesAmenitiesSection } from "../components/hotel/FacilitiesAmenitiesSection";
import { MapSection } from "../components/hotel/MapSection";
import { HotelPoliciesSection } from "../components/hotel/HotelPoliciesSection";
import { HotelReviewsSection } from "../components/hotel/HotelReviewsSection";
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

// Helper to extract lowest price from ratehawk_data rates
const getLowestPriceFromRatehawkData = (ratehawkData: any): number => {
  if (!ratehawkData?.rates || !Array.isArray(ratehawkData.rates)) return 0;
  
  let lowestPrice = 0;
  for (const rate of ratehawkData.rates) {
    let price = 0;
    // Try payment_options first
    if (rate.payment_options?.payment_types?.[0]) {
      const pt = rate.payment_options.payment_types[0];
      price = parseFloat(pt.show_amount || pt.amount || "0");
    }
    // Try daily_prices
    if (price <= 0 && rate.daily_prices) {
      const dailyPrices = Array.isArray(rate.daily_prices) ? rate.daily_prices : [rate.daily_prices];
      price = dailyPrices.reduce((sum: number, p: any) => sum + parseFloat(String(p) || "0"), 0);
    }
    // Try direct price
    if (price <= 0 && rate.price) {
      price = parseFloat(rate.price);
    }
    // Try show_amount at rate level
    if (price <= 0 && rate.show_amount) {
      price = parseFloat(rate.show_amount);
    }
    
    if (price > 0 && (lowestPrice === 0 || price < lowestPrice)) {
      lowestPrice = price;
    }
  }
  return lowestPrice;
};

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
    priceFrom: hotel.price?.amount || getLowestPriceFromRatehawkData(hotel.ratehawk_data) || 0,
    currency: hotel.price?.currency || "USD",
    latitude: hotel.latitude || 0,
    longitude: hotel.longitude || 0,
    checkInTime: hotel.checkInTime,
    checkOutTime: hotel.checkOutTime,
    policies: hotel.policies,
    ratehawk_data: hotel.ratehawk_data,
  };
};

const isLikelySlugName = (name: string) => !!name && !name.includes(" ") && /[_-]/.test(name);

const humanizeSlug = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .trim();

const normalizeStaticImages = (raw: unknown): AnyHotelImage[] => {
  if (!Array.isArray(raw)) return [];

  return (raw as unknown[])
    .map((img) => {
      if (typeof img === "string") return img.replace("{size}", "1024x768");

      if (img && typeof img === "object") {
        const anyImg = img as any;
        if (typeof anyImg.url === "string") {
          return { ...anyImg, url: anyImg.url.replace("{size}", "1024x768") };
        }
        if (typeof anyImg.tmpl === "string") {
          return { ...anyImg, tmpl: anyImg.tmpl.replace("{size}", "1024x768") };
        }
      }

      return null;
    })
    .filter(Boolean) as AnyHotelImage[];
};

const getFirstImageUrl = (images: AnyHotelImage[] | undefined): string | undefined => {
  const first = images?.[0];
  if (!first) return undefined;

  if (typeof first === "string") return first;

  if (first && typeof first === "object") {
    const anyFirst = first as any;
    if (typeof anyFirst.url === "string") return anyFirst.url;
    if (typeof anyFirst.tmpl === "string") return anyFirst.tmpl;
  }

  return undefined;
};

const isPlaceholderImage = (url?: string) =>
  !url || url === "/placeholder.svg" || url.includes("placeholder.svg");

const hasRealImages = (images: AnyHotelImage[] | undefined): boolean => {
  if (!images || images.length === 0) return false;
  const firstUrl = getFirstImageUrl(images);
  return !!firstUrl && !isPlaceholderImage(firstUrl);
};

const HotelDetailsPage = () => {
  const { hotelId: rawHotelId } = useParams<{ hotelId: string }>();
  const hotelId = String(rawHotelId); // Normalize to string for consistent comparisons
  const navigate = useNavigate();
  const { selectedHotel, searchParams, searchResults, setSelectedHotel } = useBookingStore();

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
        if (String(parsedData.hotel.id) === hotelId) {
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
          (selectedHotel && String(selectedHotel.id) === hotelId ? selectedHotel : null) ||
          (searchResults?.find((h) => String(h.id) === hotelId) as any) ||
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

  // Fetch description from WorldOTA via edge function (primary source)
  const fetchWorldOtaDescription = async (hotelId: string): Promise<string | null> => {
    try {
      console.log("🌐 Fetching description from WorldOTA...");
      
      const numericId = parseInt(hotelId.replace(/\D/g, ""), 10);
      if (isNaN(numericId)) {
        console.warn("⚠️ Cannot convert hotelId to numeric:", hotelId);
        return null;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const response = await fetch(`${supabaseUrl}/functions/v1/worldota-hotel-info`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ hid: numericId, language: "en" }),
      });

      if (!response.ok) {
        console.warn(`⚠️ WorldOTA edge function returned ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      if (data.success && data.hotel?.description) {
        console.log(`✅ WorldOTA description fetched (${data.hotel.description.length} chars, cached: ${data.cached})`);
        return data.hotel.description;
      }

      console.log("⚠️ No description in WorldOTA response");
      return null;
    } catch (error) {
      console.error("💥 Error fetching WorldOTA description:", error);
      return null;
    }
  };

  const fetchStaticHotelInfo = async (hotelId: string) => {
    try {
      console.log("📚 Fetching static hotel info...");

      // Use GET request with hotel ID in path (matching the working pattern from ratehawkApi.ts)
      const response = await fetch(
        `${API_BASE_URL}/api/ratehawk/hotel/static-info/${hotelId}`
      );

      if (!response.ok) {
        console.warn(`⚠️ Static info endpoint returned ${response.status}`);
        return null;
      }

      const responseData = await response.json();

      // Response format is { success: true, hotel: { ...data } }
      if (responseData.success && responseData.hotel) {
        console.log("✅ Static info fetched successfully");
        const data = responseData.hotel;

        // Try to extract description from description_struct
        let extractedDescription = data.description;
        
        if (!extractedDescription && data.description_struct) {
          const struct = data.description_struct;
          if (typeof struct === 'string') {
            extractedDescription = struct;
          } else if (Array.isArray(struct)) {
            // description_struct.paragraphs format from WorldOTA
            extractedDescription = struct
              .map((item: any) => {
                if (typeof item === 'string') return item;
                if (item.paragraphs) return item.paragraphs.join(' ');
                if (item.text) return item.text;
                return '';
              })
              .filter(Boolean)
              .join(' ');
          } else if (struct.paragraphs && Array.isArray(struct.paragraphs)) {
            // { paragraphs: [...], title: "..." } format
            extractedDescription = struct.paragraphs.join(' ');
          } else if (struct.text || struct.content) {
            extractedDescription = struct.text || struct.content;
          }
        }

        if (extractedDescription) {
          const preview = extractedDescription.substring(0, 100);
          console.log(`📝 Description found (${extractedDescription.length} chars): ${preview}...`);
        } else {
          console.log("📝 No description in static info response");
        }

        return {
          ...data,
          description: extractedDescription,
        };
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
      const worldotaDescPromise = fetchWorldOtaDescription(ratehawkHotelId);

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
          ? "📤 Fetching rates, static info, and WorldOTA description in parallel with hotelId:"
          : "📤 Fetching static hotel info and WorldOTA description (no search dates available) with hotelId:",
        ratehawkHotelId,
      );

      const [ratesResponse, staticInfo, worldotaDescription] = await Promise.all([
        ratesPromise, 
        staticInfoPromise,
        worldotaDescPromise
      ]);

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

      // Only use existing images from search - don't fetch additional images from static-info
      const existingImages = normalizeStaticImages((data.hotel as any)?.images);
      const imagesToUse = existingImages.slice(0, 1); // Only keep the main thumbnail

      const existingMainImage = typeof (data.hotel as any)?.mainImage === "string" ? (data.hotel as any).mainImage : undefined;
      const existingLegacyImage = typeof data.hotel.image === "string" ? data.hotel.image : undefined;
      const existingFirstImage = getFirstImageUrl(existingImages);

      const pickedMainImageRaw =
        (existingMainImage && !isPlaceholderImage(existingMainImage) ? existingMainImage : undefined) ||
        (existingLegacyImage && !isPlaceholderImage(existingLegacyImage) ? existingLegacyImage : undefined) ||
        existingFirstImage;

      const pickedMainImage = pickedMainImageRaw
        ? String(pickedMainImageRaw).replace("{size}", "1024x768")
        : undefined;

      const staticName = typeof (staticInfo as any)?.name === "string" ? (staticInfo as any).name.trim() : undefined;
      const currentName = typeof data.hotel.name === "string" ? data.hotel.name.trim() : "";
      const nameToUse =
        staticName && (!currentName || currentName === data.hotel.id || isLikelySlugName(currentName))
          ? staticName
          : currentName || staticName || humanizeSlug(data.hotel.id);

      const staticCity = typeof (staticInfo as any)?.city === "string" ? (staticInfo as any).city : undefined;
      const staticCountry = typeof (staticInfo as any)?.country === "string" ? (staticInfo as any).country : undefined;
      const staticAddress = typeof (staticInfo as any)?.address === "string" ? (staticInfo as any).address : undefined;
      const staticPhone = typeof (staticInfo as any)?.phone === "string" ? (staticInfo as any).phone : undefined;
      const staticEmail = typeof (staticInfo as any)?.email === "string" ? (staticInfo as any).email : undefined;

      // Merge all data together
      const updatedHotelData: HotelData = {
        ...data,
        hotel: {
          ...data.hotel,
          // Prefer a real hotel name from static info (fallback to humanized slug)
          name: nameToUse,

          // Priority: WorldOTA description > static info > existing data
          description: worldotaDescription 
            || (staticInfo?.description && staticInfo.description.length >= 100 
                ? staticInfo.description 
                : undefined)
            || (data.hotel.description && data.hotel.description.length >= 100
                ? data.hotel.description
                : undefined),
          fullDescription: worldotaDescription 
            || (staticInfo?.description && staticInfo.description.length >= 100
                ? staticInfo.description
                : undefined)
            || (data.hotel.fullDescription && data.hotel.fullDescription.length >= 100
                ? data.hotel.fullDescription
                : undefined),
          checkInTime: staticInfo?.checkInTime || data.hotel.checkInTime,
          checkOutTime: staticInfo?.checkOutTime || data.hotel.checkOutTime,
          policies: staticInfo?.policies?.length > 0 ? staticInfo.policies : data.hotel.policies,

          address: staticAddress || data.hotel.address,
          city: staticCity || data.hotel.city,
          country: staticCountry || data.hotel.country,
          phone: staticPhone || data.hotel.phone,
          email: staticEmail || data.hotel.email,

          latitude: staticInfo?.coordinates?.latitude || data.hotel.latitude,
          longitude: staticInfo?.coordinates?.longitude || data.hotel.longitude,
          amenities: staticInfo?.amenities?.length > 0 ? staticInfo.amenities : data.hotel.amenities,

          // Ensure hero images + star rating are available even if stored data is missing them
          starRating: staticInfo?.starRating ?? data.hotel.starRating,
          rating: staticInfo?.starRating ?? data.hotel.rating,
          images: imagesToUse,
          mainImage: pickedMainImage,
          image: pickedMainImage,

          // Review score and count from static info
          reviewScore: staticInfo?.rating ?? staticInfo?.review_score ?? staticInfo?.reviewScore ?? data.hotel.reviewScore,
          reviewCount: staticInfo?.review_count ?? staticInfo?.reviewCount ?? data.hotel.reviewCount,

          // Rate data - prefer API rates, fallback to stored rates from search
          ratehawk_data: {
            ...data.hotel.ratehawk_data,
            // Use API rates if available, otherwise keep stored rates from search
            rates: rates.length > 0 ? rates : (data.hotel.ratehawk_data?.rates || []),
            room_groups: room_groups.length > 0 ? room_groups : (data.hotel.ratehawk_data?.room_groups || []),
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
      console.log(`   - Review score: ${staticInfo?.rating ?? staticInfo?.review_score ?? 'N/A'}`);

      setHotelData(updatedHotelData);
      
      // Update the Zustand store so BookingPage can access the hotel data
      const hotelDetails = transformToHotelDetails(updatedHotelData.hotel);
      setSelectedHotel(hotelDetails);
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
            onClick={() => navigate("/dashboard/search")}
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

  // Categorize amenities from API for display (inline, no hook needed)
  const categorizedAmenities = categorizeAmenities(hotelDetails.amenities || []);

  return (
    <div className="min-h-screen bg-background pb-24">
      <HotelHeroSection hotel={hotelDetails} />

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <HotelInfoSection hotel={hotelDetails} />
          <RoomSelectionSection 
            hotel={hotelDetails} 
            isLoading={false}
            checkInTime={hotelDetails.checkInTime}
            checkOutTime={hotelDetails.checkOutTime}
          />
          <FacilitiesAmenitiesSection amenities={categorizedAmenities} />
          <HotelPoliciesSection hotel={hotelDetails} />
          <HotelReviewsSection hotel={hotelDetails} />
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
        </div>
      </div>

      <StickyBookingBar 
        hotelId={hotelDetails.id} 
        hotelName={hotelDetails.name}
        currency={hotelDetails.currency}
      />
    </div>
  );
};

export default HotelDetailsPage;
