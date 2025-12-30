import { useState, useMemo } from "react";
import {
  Plus,
  Minus,
  Bed,
  Check,
  Users,
  Maximize,
  Wifi,
  Bath,
  Wind,
  Tv,
  Crown,
  Home,
  Star,
  Coffee,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { HotelDetails, RateHawkRate, RateHawkRoomGroup } from "@/types/booking";
import { useBookingStore } from "@/stores/bookingStore";
import { RoomUpsells } from "./RoomUpsells";
import { differenceInDays } from "date-fns";
// Room category types for sorting and badges
type RoomCategory = "standard" | "deluxe" | "suite" | "premium" | "family" | "apartment";

// Processed room structure
interface ProcessedRoom {
  id: string;
  name: string;
  type: string;
  price: number;
  currency: string;
  bedding: string;
  occupancy: string;
  size: string;
  amenities: string[];
  cancellation: string;
  paymentType: string;
  availability: number;
  rgHash?: string;
  bookHash?: string;
  matchHash?: string;
  meal?: string;
  isFallbackPrice?: boolean;
  category: RoomCategory;
}

// Get room category from name
const getRoomCategory = (name: string): RoomCategory => {
  const lowerName = name.toLowerCase();
  if (
    lowerName.includes("presidential") ||
    lowerName.includes("royal") ||
    lowerName.includes("grand") ||
    lowerName.includes("luxury")
  ) {
    return "premium";
  }
  if (lowerName.includes("suite") || lowerName.includes("ambassador")) {
    return "suite";
  }
  if (lowerName.includes("family") || lowerName.includes("apartment") || lowerName.includes("villa")) {
    return "family";
  }
  if (lowerName.includes("deluxe") || lowerName.includes("superior")) {
    return "deluxe";
  }
  if (lowerName.includes("studio") || lowerName.includes("cottage") || lowerName.includes("bungalow")) {
    return "apartment";
  }
  return "standard";
};

// Category sort order (standard first, premium last)
const categorySortOrder: Record<RoomCategory, number> = {
  standard: 0,
  deluxe: 1,
  apartment: 2,
  family: 3,
  suite: 4,
  premium: 5,
};

// Category badge config
const categoryBadgeConfig: Record<
  RoomCategory,
  { label: string; variant: "default" | "secondary" | "outline"; icon: React.ReactNode }
> = {
  standard: { label: "Standard", variant: "outline", icon: null },
  deluxe: { label: "Deluxe", variant: "secondary", icon: <Star className="w-3 h-3" /> },
  apartment: { label: "Apartment", variant: "outline", icon: <Home className="w-3 h-3" /> },
  family: { label: "Family", variant: "secondary", icon: <Users className="w-3 h-3" /> },
  suite: { label: "Suite", variant: "default", icon: <Crown className="w-3 h-3" /> },
  premium: { label: "Premium", variant: "default", icon: <Crown className="w-3 h-3" /> },
};

interface RoomSelectionSectionProps {
  hotel: HotelDetails;
  isLoading?: boolean;
  checkInTime?: string;
  checkOutTime?: string;
}

// Get amenity icon based on name
const getAmenityIcon = (amenity: string | { id?: string; name?: string }) => {
  // Handle both string and object amenities
  const amenityName = typeof amenity === "string" ? amenity : amenity?.name || amenity?.id || "";
  if (!amenityName) return <Check className="w-3 h-3" />;

  const lowerAmenity = amenityName.toLowerCase();
  if (lowerAmenity.includes("wifi") || lowerAmenity.includes("internet")) {
    return <Wifi className="w-3 h-3" />;
  } else if (lowerAmenity.includes("bath") || lowerAmenity.includes("shower")) {
    return <Bath className="w-3 h-3" />;
  } else if (lowerAmenity.includes("air") || lowerAmenity.includes("conditioning")) {
    return <Wind className="w-3 h-3" />;
  } else if (lowerAmenity.includes("tv") || lowerAmenity.includes("television")) {
    return <Tv className="w-3 h-3" />;
  }
  return <Check className="w-3 h-3" />;
};

// Get occupancy from room name
const getOccupancyFromName = (name: string): string => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("single")) return "1 guest";
  if (lowerName.includes("triple")) return "3 guests";
  if (lowerName.includes("quadruple") || lowerName.includes("quad")) return "4 guests";
  if (lowerName.includes("studio")) return "1-2 guests";
  if (lowerName.includes("family")) return "4-6 guests";
  return "2 guests";
};

// Extract room_groups and rates from multiple possible locations in ratehawk_data
const extractRoomData = (hotel: HotelDetails): { roomGroups: RateHawkRoomGroup[]; rates: RateHawkRate[] } => {
  const data = hotel.ratehawk_data;
  if (!data) return { roomGroups: [], rates: [] };

  // Try multiple locations for room_groups
  let roomGroups: RateHawkRoomGroup[] = [];
  const roomGroupLocations = [
    data.room_groups,
    data.enhancedData?.room_groups,
    data.data?.data?.hotels?.[0]?.room_groups,
    data.data?.room_groups,
  ];

  for (const location of roomGroupLocations) {
    if (Array.isArray(location) && location.length > 0) {
      roomGroups = location;
      console.log(`📊 Found ${roomGroups.length} room_groups`);
      break;
    }
  }

  // Try multiple locations for rates
  let rates: RateHawkRate[] = [];
  const rateLocations = [data.rates, data.enhancedData?.rates, data.data?.data?.hotels?.[0]?.rates, data.data?.rates];

  for (const location of rateLocations) {
    if (Array.isArray(location) && location.length > 0) {
      rates = location;
      console.log(`📊 Found ${rates.length} rates`);
      break;
    }
  }

  return { roomGroups, rates };
};

// Helper to extract rg_hash from rate (may be nested)
const getRateRgHash = (rate: RateHawkRate): string | undefined => {
  // Try direct rg_hash first
  if (rate.rg_hash) return rate.rg_hash;
  // Try nested in rooms array
  if (rate.rooms?.[0]?.rg_hash) return rate.rooms[0].rg_hash;
  // Try rg_ext
  if ((rate as any).rg_ext?.rg_hash) return (rate as any).rg_ext.rg_hash;
  return undefined;
};

// Process rooms using room_groups + rg_hash matching (the working approach)
const processRoomsWithRoomGroups = (hotel: HotelDetails): ProcessedRoom[] => {
  const { roomGroups, rates } = extractRoomData(hotel);

  console.log(`🔍 Processing rooms: ${roomGroups.length} room_groups, ${rates.length} rates`);

  // Debug: Log actual rate structure to understand the data
  if (rates.length > 0) {
    console.log("🔎 First rate structure:", JSON.stringify(rates[0], null, 2).slice(0, 500));
    console.log(
      "🔎 Rate rg_hash values (resolved):",
      rates.map((r) => getRateRgHash(r)),
    );
  }
  if (roomGroups.length > 0) {
    console.log(
      "🔎 RoomGroup rg_hash values:",
      roomGroups.slice(0, 3).map((rg) => rg.rg_hash),
    );
  }

  // If we have room_groups, use them with rg_hash matching
  if (roomGroups.length > 0 && rates.length > 0) {
    const processedRooms: ProcessedRoom[] = [];

    roomGroups.forEach((roomGroup, index) => {
      try {
        const nameStruct = roomGroup.name_struct || {};
        const mainName = nameStruct.main_name || `Room Type ${index + 1}`;
        const beddingType = nameStruct.bedding_type || "";
        const rgHash = roomGroup.rg_hash;
        const fullRoomName = beddingType ? `${mainName} - ${beddingType}` : mainName;

        // Find matching rates for this room group using rg_hash (check nested locations)
        const matchingRates = rates.filter((rate) => getRateRgHash(rate) === rgHash);
        console.log(`🔗 Found ${matchingRates.length} rates for: ${fullRoomName} (${rgHash})`);

        // Get the best rate (lowest price) for this room type
        let bestRate: RateHawkRate | null = null;
        let lowestPrice = Infinity;
        let currency = "USD";

        matchingRates.forEach((rate) => {
          let ratePrice = 0;
          if (rate.payment_options?.payment_types?.length && rate.payment_options.payment_types.length > 0) {
            const paymentType = rate.payment_options.payment_types[0];
            ratePrice = parseFloat(paymentType.show_amount || paymentType.amount || "0");
            currency = paymentType.show_currency_code || paymentType.currency_code || "USD";
          } else if (rate.daily_prices) {
            const dailyPrices = Array.isArray(rate.daily_prices) ? rate.daily_prices : [rate.daily_prices];
            ratePrice = dailyPrices.reduce((sum, p) => sum + parseFloat(String(p) || "0"), 0);
            currency = rate.currency || "USD";
          } else if (rate.price) {
            ratePrice = parseFloat(rate.price);
            currency = rate.currency || "USD";
          }

          if (ratePrice > 0 && ratePrice < lowestPrice) {
            lowestPrice = ratePrice;
            bestRate = rate;
          }
        });

        // Skip if no valid price found
        if (!bestRate || lowestPrice === Infinity) {
          return; // Don't log every skip, reduce noise
        }

        // Determine occupancy
        let occupancy = getOccupancyFromName(mainName);

        // Extract amenities
        let roomAmenities: string[] = [];
        if (bestRate) {
          roomAmenities = [
            ...(bestRate.amenities || []),
            ...(bestRate.room_amenities || []),
            ...(bestRate.rooms?.[0]?.amenities_data || []),
          ].slice(0, 4);
        }
        if (roomAmenities.length === 0) {
          roomAmenities = hotel.amenities?.slice(0, 3).map((a) => a.name) || ["Free WiFi", "Air conditioning"];
        }

        // Determine bedding display
        let beddingDisplay = beddingType || "Standard bedding";
        const lowerName = mainName.toLowerCase();
        if (!beddingType) {
          if (lowerName.includes("twin")) beddingDisplay = "Twin beds";
          else if (lowerName.includes("double")) beddingDisplay = "Double bed";
          else if (lowerName.includes("single")) beddingDisplay = "Single bed";
          else if (lowerName.includes("king")) beddingDisplay = "King bed";
          else if (lowerName.includes("queen")) beddingDisplay = "Queen bed";
        }

        const category = getRoomCategory(fullRoomName);
        const roomSize = bestRate?.rooms?.[0]?.size || "Standard size";
        const cancellationPolicy = bestRate?.cancellation_policy?.type || "Free cancellation";
        const paymentType = bestRate?.payment_options?.payment_types?.[0]?.type || "Pay at hotel";
        const meal = bestRate?.meal || "nomeal";

        processedRooms.push({
          id: bestRate?.match_hash || bestRate?.book_hash || roomGroup.room_group_id?.toString() || `room_${index}`,
          name: fullRoomName,
          type: mainName,
          price: Math.round(lowestPrice),
          currency: currency,
          bedding: beddingDisplay,
          occupancy: occupancy,
          size: roomSize,
          amenities: roomAmenities,
          cancellation: cancellationPolicy,
          paymentType: paymentType,
          availability: bestRate?.allotment || 5,
          rgHash: rgHash,
          bookHash: bestRate?.book_hash,
          matchHash: bestRate?.match_hash,
          meal: meal,
          isFallbackPrice: false,
          category: category,
        });

        console.log(`✅ Processed: ${fullRoomName} - ${currency} ${Math.round(lowestPrice)}`);
      } catch (error) {
        console.error(`Error processing room group ${index}:`, error);
      }
    });

    if (processedRooms.length > 0) {
      console.log(`✅ Processed ${processedRooms.length} rooms from room_groups`);
      return processedRooms;
    }

    // If room_groups exist but no matches found, fall back to direct rate processing
    console.log(`⚠️ No rg_hash matches found, falling back to direct rate processing`);
  }

  // Fallback: process rates directly if no room_groups or processing failed
  return processRatesDirectly(hotel, rates);
};

// Fallback: process rooms directly from rates array
const processRatesDirectly = (hotel: HotelDetails, rates: RateHawkRate[]): ProcessedRoom[] => {
  // Debug: Log what we're working with
  if (rates.length > 0) {
    console.log("💰 processRatesDirectly: Processing", rates.length, "rates");
    console.log("💰 First rate structure:", JSON.stringify(rates[0], null, 2).slice(0, 800));
  } else {
    console.log("💰 processRatesDirectly: No rates provided, hotel.priceFrom =", hotel.priceFrom);
  }

  if (rates.length === 0) {
    // Use hotel.rooms if available
    if (hotel.rooms && hotel.rooms.length > 0) {
      return hotel.rooms.map((room, idx) => ({
        id: room.id || `room-${idx}`,
        name: room.name,
        type: room.name,
        price: room.price,
        currency: room.currency || hotel.currency || "USD",
        bedding: room.bedType || "Standard bedding",
        occupancy: `${room.maxOccupancy} guests`,
        size: room.squareFootage ? `${room.squareFootage} ft²` : "Standard size",
        amenities: room.amenities || [],
        cancellation: room.cancellationPolicy || "Standard cancellation",
        paymentType: "Pay at hotel",
        availability: room.available || 1,
        isFallbackPrice: false,
        category: getRoomCategory(room.name),
      }));
    }

    // Ultimate fallback
    return [
      {
        id: "default",
        name: "Standard Room",
        type: "Standard",
        price: hotel.priceFrom || 0,
        currency: hotel.currency || "USD",
        bedding: "Standard bedding",
        occupancy: "2 guests",
        size: "Standard size",
        amenities: hotel.amenities?.slice(0, 3).map((a) => a.name) || [],
        cancellation: "Standard cancellation",
        paymentType: "Pay at hotel",
        availability: 1,
        isFallbackPrice: true,
        category: "standard" as RoomCategory,
      },
    ];
  }

  // Process each rate directly
  const processedRooms: ProcessedRoom[] = [];

  rates.forEach((rate, index) => {
    try {
      const roomName = rate.room_name || `Room Option ${index + 1}`;
      const category = getRoomCategory(roomName);

      let price = 0;
      let currency = "USD";

      // Try payment_options first (most common)
      if (rate.payment_options?.payment_types?.length && rate.payment_options.payment_types.length > 0) {
        const paymentType = rate.payment_options.payment_types[0];
        price = parseFloat(paymentType.show_amount || paymentType.amount || "0");
        currency = paymentType.show_currency_code || paymentType.currency_code || "USD";
      }

      // Try daily_prices
      if (price <= 0 && rate.daily_prices) {
        const dailyPrices = Array.isArray(rate.daily_prices) ? rate.daily_prices : [rate.daily_prices];
        price = dailyPrices.reduce((sum, p) => sum + parseFloat(String(p) || "0"), 0);
        currency = rate.currency || "USD";
      }

      // Try direct price field
      if (price <= 0 && rate.price) {
        price = parseFloat(rate.price);
        currency = rate.currency || "USD";
      }

      // Try show_amount at rate level
      if (price <= 0 && (rate as any).show_amount) {
        price = parseFloat((rate as any).show_amount);
        currency = (rate as any).show_currency_code || rate.currency || "USD";
      }

      // Try rooms[0].price
      if (price <= 0 && rate.rooms?.[0]) {
        const room = rate.rooms[0];
        if ((room as any).price) {
          price = parseFloat((room as any).price);
        }
      }

      // Log when we still can't extract price
      if (price <= 0) {
        console.warn(`⚠️ Could not extract price from rate ${index}:`, JSON.stringify(rate, null, 2).slice(0, 400));
        return;
      }

      const meal = rate.meal || "nomeal";
      let occupancy = "2 guests";
      if (rate.rg_ext?.capacity) {
        occupancy = `${rate.rg_ext.capacity} guest${rate.rg_ext.capacity !== 1 ? "s" : ""}`;
      } else {
        occupancy = getOccupancyFromName(roomName);
      }

      const amenities = [
        ...(rate.amenities_data || []),
        ...(rate.amenities || []),
        ...(rate.room_amenities || []),
      ].slice(0, 4);

      let bedding = "Standard bedding";
      const lowerName = roomName.toLowerCase();
      if (lowerName.includes("twin")) bedding = "Twin beds";
      else if (lowerName.includes("double")) bedding = "Double bed";
      else if (lowerName.includes("single")) bedding = "Single bed";
      else if (lowerName.includes("king")) bedding = "King bed";
      else if (lowerName.includes("queen")) bedding = "Queen bed";

      processedRooms.push({
        id: rate.match_hash || rate.book_hash || `rate_${index}`,
        name: roomName,
        type: roomName,
        price: Math.round(price),
        currency: currency,
        bedding: bedding,
        occupancy: occupancy,
        size: rate.rooms?.[0]?.size || "Standard size",
        amenities: amenities.length > 0 ? amenities : ["Free WiFi", "Air conditioning"],
        cancellation: rate.cancellation_policy?.type || "Standard policy",
        paymentType: rate.payment_options?.payment_types?.[0]?.type || "Pay at hotel",
        availability: rate.allotment || 5,
        rgHash: rate.rg_hash,
        bookHash: rate.book_hash,
        matchHash: rate.match_hash,
        meal: meal,
        isFallbackPrice: false,
        category: category,
      });
    } catch (error) {
      console.error(`Error processing rate ${index}:`, error);
    }
  });

  return processedRooms.length > 0
    ? processedRooms
    : [
        {
          id: "fallback",
          name: "Standard Room",
          type: "Standard",
          price: hotel.priceFrom || 0,
          currency: hotel.currency || "USD",
          bedding: "Standard bedding",
          occupancy: "2 guests",
          size: "Standard size",
          amenities: hotel.amenities?.slice(0, 3).map((a) => a.name) || [],
          cancellation: "Standard cancellation",
          paymentType: "Pay at hotel",
          availability: 1,
          isFallbackPrice: true,
          category: "standard" as RoomCategory,
        },
      ];
};

export function RoomSelectionSection({
  hotel,
  isLoading = false,
  checkInTime,
  checkOutTime,
}: RoomSelectionSectionProps) {
  const { selectedRooms, addRoom, updateRoomQuantity, searchParams } = useBookingStore();
  const [displayedRooms, setDisplayedRooms] = useState(6);

  // Calculate number of nights from search params
  const nights = useMemo(() => {
    if (searchParams?.checkIn && searchParams?.checkOut) {
      const checkIn = new Date(searchParams.checkIn);
      const checkOut = new Date(searchParams.checkOut);
      return Math.max(1, differenceInDays(checkOut, checkIn));
    }
    return 1;
  }, [searchParams]);

  // Process and sort rooms by category using room_groups + rg_hash matching
  const sortedRooms = useMemo(() => {
    const rooms = processRoomsWithRoomGroups(hotel);
    return rooms.sort((a, b) => categorySortOrder[a.category] - categorySortOrder[b.category]);
  }, [hotel]);

  const roomsToDisplay = sortedRooms.slice(0, displayedRooms);
  const hasMoreRooms = sortedRooms.length > displayedRooms;

  const getSelectedQuantity = (roomId: string) => {
    const selected = selectedRooms.find((r) => r.roomId === roomId);
    return selected?.quantity || 0;
  };

  const handleIncrease = (room: ProcessedRoom) => {
    const currentQty = getSelectedQuantity(room.id);
    if (currentQty === 0) {
      ddRoom({
        roomId: room.id,
        roomName: room.name,
        quantity: 1,
        pricePerRoom: room.price,
        totalPrice: room.price,
        book_hash: room.bookHash, // For prebook
        match_hash: room.matchHash, // For reference
        currency: room.currency,
        bedType: room.bedding,
        amenities: room.amenities,
        cancellationPolicy: room.cancellation,
        meal: room.meal,
      });
    } else {
      updateRoomQuantity(room.id, currentQty + 1);
    }
  };

  const handleDecrease = (room: ProcessedRoom) => {
    const currentQty = getSelectedQuantity(room.id);
    if (currentQty > 0) {
      updateRoomQuantity(room.id, currentQty - 1);
    }
  };

  const handleLoadMore = () => {
    setDisplayedRooms((prev) => Math.min(prev + 6, sortedRooms.length));
  };

  if (isLoading) {
    return (
      <section className="py-8 bg-app-white-smoke">
        <div className="container">
          <h2 className="font-heading text-heading-standard text-foreground mb-6">Select Your Rooms</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 md:p-6 animate-pulse">
                <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
                  <div className="flex-1 space-y-3">
                    <div className="h-6 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                  <div className="h-10 w-32 bg-muted rounded" />
                </div>
              </Card>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4">Loading room availability...</p>
        </div>
      </section>
    );
  }

  if (sortedRooms.length === 0) {
    return (
      <section className="py-8 bg-app-white-smoke">
        <div className="container">
          <h2 className="font-heading text-heading-standard text-foreground mb-6">Available Rooms</h2>
          <p className="text-muted-foreground">No rooms available for the selected dates.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 bg-app-white-smoke">
      <div className="container">
        <div className="mb-6">
          <h2 className="font-heading text-heading-standard text-foreground mb-2">Choose Your Room</h2>
          <p className="text-muted-foreground">
            Select from {sortedRooms.length} available room type{sortedRooms.length !== 1 ? "s" : ""}
            {hasMoreRooms && (
              <span className="text-primary font-medium">
                {" "}
                (Showing {displayedRooms} of {sortedRooms.length})
              </span>
            )}
          </p>
        </div>

        <div className="space-y-4">
          {roomsToDisplay.map((room) => {
            const selectedQty = getSelectedQuantity(room.id);
            const isSelected = selectedQty > 0;

            return (
              <Card
                key={room.id}
                className={`p-4 md:p-6 transition-all ${
                  isSelected ? "border-primary ring-1 ring-primary" : "border-border"
                }`}
              >
                <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
                  {/* Room Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-heading text-heading-small text-foreground">{room.name}</h3>
                      {room.category !== "standard" && (
                        <Badge variant={categoryBadgeConfig[room.category].variant} className="flex items-center gap-1">
                          {categoryBadgeConfig[room.category].icon}
                          {categoryBadgeConfig[room.category].label}
                        </Badge>
                      )}
                      {room.meal && room.meal !== "nomeal" && (
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1 bg-green-100 text-green-700 border-green-200"
                        >
                          <Coffee className="w-3 h-3" />
                          {room.meal === "breakfast" ? "Breakfast included" : room.meal}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                      {room.size && room.size !== "Standard size" && (
                        <div className="flex items-center gap-1">
                          <Maximize className="h-4 w-4" />
                          <span>{room.size}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Bed className="h-4 w-4" />
                        <span>{room.bedding}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{room.occupancy}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {room.amenities.slice(0, 4).map((amenity: string | { id?: string; name?: string }, i) => {
                        const amenityName =
                          typeof amenity === "string"
                            ? amenity
                            : (amenity as { name?: string; id?: string })?.name ||
                              (amenity as { name?: string; id?: string })?.id ||
                              "";
                        return (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded"
                          >
                            {getAmenityIcon(amenity)}
                            {amenityName}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Price and Selection */}
                  <div className="flex flex-col items-end gap-3 min-w-[160px]">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">
                        {room.currency === "USD" ? "$" : room.currency}{" "}
                        {Math.round(room.price / nights).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">per night</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDecrease(room)}
                        disabled={selectedQty === 0}
                        className="h-8 w-8"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{selectedQty}</span>
                      <Button variant="outline" size="icon" onClick={() => handleIncrease(room)} className="h-8 w-8">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Upsells - show when room is selected */}
                {isSelected && (checkInTime || checkOutTime) && (
                  <RoomUpsells
                    roomId={room.id}
                    roomName={room.name}
                    currency={room.currency}
                    checkInTime={checkInTime}
                    checkOutTime={checkOutTime}
                  />
                )}
              </Card>
            );
          })}
        </div>

        {hasMoreRooms && (
          <div className="mt-6 text-center">
            <Button variant="outline" onClick={handleLoadMore}>
              Load More Rooms ({sortedRooms.length - displayedRooms} remaining)
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
