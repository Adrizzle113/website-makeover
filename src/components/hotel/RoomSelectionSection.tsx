import { useState, useMemo } from "react";
import { Plus, Minus, Bed, Check, Users, Maximize, Wifi, Bath, Wind, Tv, Crown, Home, Star, Coffee, UtensilsCrossed } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { HotelDetails, RateHawkRate } from "@/types/booking";
import { useBookingStore } from "@/stores/bookingStore";

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
  meal?: string;
  isFallbackPrice?: boolean;
  category: RoomCategory;
}

// Get room category from name
const getRoomCategory = (name: string): RoomCategory => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("presidential") || lowerName.includes("royal") || lowerName.includes("grand") || lowerName.includes("luxury")) {
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
const categoryBadgeConfig: Record<RoomCategory, { label: string; variant: "default" | "secondary" | "outline"; icon: React.ReactNode }> = {
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
}

// Get amenity icon based on name
const getAmenityIcon = (amenity: string) => {
  const lowerAmenity = amenity.toLowerCase();
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


// Extract rates from multiple possible locations in ratehawk_data
const extractAllRates = (hotel: HotelDetails): { rates: RateHawkRate[]; source: string } => {
  const data = hotel.ratehawk_data;
  if (!data) return { rates: [], source: 'none' };

  // Try multiple locations for raw rates, prioritizing most complete data
  const possibleRateLocations = [
    { key: 'enhancedData.rates', value: data.enhancedData?.rates },
    { key: 'rates', value: data.rates },
    { key: 'data.data.hotels[0].rates', value: (data as any)?.data?.data?.hotels?.[0]?.rates },
    { key: 'av_resp[0].rates', value: (data as any)?.av_resp?.[0]?.rates },
    { key: 'data.rates', value: (data as any)?.data?.rates },
  ];

  for (const location of possibleRateLocations) {
    if (Array.isArray(location.value) && location.value.length > 0) {
      console.log(`📊 Found ${location.value.length} rates at ${location.key}`);
      return { rates: location.value, source: location.key };
    }
  }

  return { rates: [], source: 'none' };
};

// Process rooms directly from rates (like the working frontend)
const processRooms = (hotel: HotelDetails): ProcessedRoom[] => {
  console.log(`🔍 RoomSelectionSection - Processing rates directly:`, {
    hasRatehawkData: !!hotel.ratehawk_data,
    topLevelKeys: Object.keys(hotel.ratehawk_data || {}),
  });

  // Extract rates from all possible locations
  const { rates, source: rateSource } = extractAllRates(hotel);
  
  console.log(`🔍 Using rate source: ${rateSource}, found ${rates.length} rates`);

  if (rates.length === 0) {
    console.log("⚠️ No rates found, using fallback");
    return processRoomsFromRates(hotel, rates);
  }

  // Process each rate directly as a bookable option
  const processedRooms: ProcessedRoom[] = [];

  rates.forEach((rate: RateHawkRate, index: number) => {
    try {
      // Extract room name - this is the key field from the working frontend
      const roomName = rate.room_name || `Room Option ${index + 1}`;
      const category = getRoomCategory(roomName);

      // Extract price from payment_options (primary source)
      let price = 0;
      let currency = "USD";

      if (rate.payment_options?.payment_types?.length && rate.payment_options.payment_types.length > 0) {
        const paymentType = rate.payment_options.payment_types[0];
        price = parseFloat(paymentType.show_amount || paymentType.amount || "0");
        currency = paymentType.show_currency_code || paymentType.currency_code || "USD";
      } else if (rate.daily_prices) {
        // Handle daily_prices as array or string
        const dailyPrices = Array.isArray(rate.daily_prices) 
          ? rate.daily_prices 
          : [rate.daily_prices];
        price = dailyPrices.reduce((sum, p) => sum + parseFloat(p || "0"), 0);
        currency = rate.currency || "USD";
      } else if (rate.price) {
        price = parseFloat(rate.price);
        currency = rate.currency || "USD";
      }

      // Skip rates with no valid price
      if (price <= 0) {
        console.log(`⚠️ Skipping rate ${index}: no valid price`);
        return;
      }

      // Extract meal plan
      const meal = rate.meal || 'nomeal';
      const hasMealLabel = meal !== 'nomeal';

      // Extract occupancy from rg_ext or room name
      let occupancy = "2 guests";
      if (rate.rg_ext?.capacity) {
        occupancy = `${rate.rg_ext.capacity} guest${rate.rg_ext.capacity !== 1 ? 's' : ''}`;
      } else {
        occupancy = getOccupancyFromName(roomName);
      }

      // Extract amenities
      const amenities = [
        ...(rate.amenities_data || []),
        ...(rate.amenities || []),
        ...(rate.room_amenities || []),
        ...(rate.rooms?.[0]?.amenities_data || []),
      ].slice(0, 4);

      // Get room size
      const roomSize = rate.rooms?.[0]?.size || "Standard size";

      // Get cancellation policy
      const cancellationPolicy = rate.cancellation_policy?.type || rate.cancellationPolicy || "Standard policy";

      // Get payment type
      const paymentType = rate.payment_options?.payment_types?.[0]?.type || "Pay at hotel";

      // Create unique ID using book_hash (primary) or fallback to index
      const roomId = rate.book_hash || `rate_${index}`;

      // Determine bedding from room name
      let bedding = "Standard bedding";
      const lowerName = roomName.toLowerCase();
      if (lowerName.includes("twin")) bedding = "Twin beds";
      else if (lowerName.includes("double")) bedding = "Double bed";
      else if (lowerName.includes("single")) bedding = "Single bed";
      else if (lowerName.includes("king")) bedding = "King bed";
      else if (lowerName.includes("queen")) bedding = "Queen bed";

      processedRooms.push({
        id: roomId,
        name: roomName,
        type: roomName,
        price: Math.round(price),
        currency: currency,
        bedding: bedding,
        occupancy: occupancy,
        size: roomSize,
        amenities: amenities.length > 0 ? amenities : ["Free WiFi", "Air conditioning"],
        cancellation: cancellationPolicy,
        paymentType: paymentType,
        availability: rate.allotment || 5,
        rgHash: rate.rg_hash,
        bookHash: rate.book_hash,
        meal: meal,
        isFallbackPrice: false,
        category: category,
      });

      console.log(`✅ Processed rate ${index}: ${roomName} - ${currency} ${Math.round(price)} (${meal})`);
    } catch (error) {
      console.error(`Error processing rate ${index}:`, error);
    }
  });

  console.log(`✅ Processed ${processedRooms.length} rooms from ${rates.length} rates`);

  if (processedRooms.length === 0) {
    return processRoomsFromRates(hotel, rates);
  }

  return processedRooms;
};

// Fallback: process rooms from rates array
const processRoomsFromRates = (hotel: HotelDetails, rates: RateHawkRate[]): ProcessedRoom[] => {
  if (rates.length === 0) {
    // Use hotel.rooms if available (from mock data or pre-processed)
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

    return [{
      id: "default",
      name: "Standard Room",
      type: "Standard",
      price: hotel.priceFrom || 0,
      currency: hotel.currency || "USD",
      bedding: "Standard bedding",
      occupancy: "2 guests",
      size: "Standard size",
      amenities: hotel.amenities?.slice(0, 3).map(a => a.name) || [],
      cancellation: "Standard cancellation",
      paymentType: "Pay at hotel",
      availability: 1,
      isFallbackPrice: true,
      category: "standard" as RoomCategory,
    }];
  }

  // Process first rate as fallback
  const rate = rates[0];
  let price = 0;
  let currency = "USD";

  if (rate.payment_options?.payment_types?.length && rate.payment_options.payment_types.length > 0) {
    const paymentType = rate.payment_options.payment_types[0];
    price = parseFloat(paymentType.show_amount || paymentType.amount || "0");
    currency = paymentType.show_currency_code || paymentType.currency_code || "USD";
  }

  return [{
    id: "fallback",
    name: "Standard Room",
    type: "Standard",
    price: Math.round(price) || hotel.priceFrom || 0,
    currency: currency,
    bedding: "Standard bedding",
    occupancy: "2 guests",
    size: "Standard size",
    amenities: hotel.amenities?.slice(0, 3).map(a => a.name) || [],
    cancellation: "Standard cancellation",
    paymentType: "Pay at hotel",
    availability: 1,
    isFallbackPrice: true,
    category: "standard" as RoomCategory,
  }];
};

export function RoomSelectionSection({ hotel, isLoading = false }: RoomSelectionSectionProps) {
  const { selectedRooms, addRoom, updateRoomQuantity } = useBookingStore();
  const [displayedRooms, setDisplayedRooms] = useState(6);

  // Process and sort rooms by category
  const sortedRooms = useMemo(() => {
    const rooms = processRooms(hotel);
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
      addRoom({
        roomId: room.id,
        roomName: room.name,
        quantity: 1,
        pricePerRoom: room.price,
        totalPrice: room.price,
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
          <h2 className="font-heading text-heading-standard text-foreground mb-6">
            Select Your Rooms
          </h2>
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
          <h2 className="font-heading text-heading-standard text-foreground mb-6">
            Available Rooms
          </h2>
          <p className="text-muted-foreground">No rooms available for the selected dates.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 bg-app-white-smoke">
      <div className="container">
        <div className="mb-6">
          <h2 className="font-heading text-heading-standard text-foreground mb-2">
            Choose Your Room
          </h2>
          <p className="text-muted-foreground">
            Select from {sortedRooms.length} available room type{sortedRooms.length !== 1 ? "s" : ""}
            {hasMoreRooms && (
              <span className="text-primary font-medium">
                {" "}(Showing {displayedRooms} of {sortedRooms.length})
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
                      <h3 className="font-heading text-heading-small text-foreground">
                        {room.name}
                      </h3>
                      {room.category !== "standard" && (
                        <Badge variant={categoryBadgeConfig[room.category].variant} className="flex items-center gap-1">
                          {categoryBadgeConfig[room.category].icon}
                          {categoryBadgeConfig[room.category].label}
                        </Badge>
                      )}
                      {room.meal && room.meal !== 'nomeal' && (
                        <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-700 border-green-200">
                          <Coffee className="w-3 h-3" />
                          {room.meal === 'breakfast' ? 'Breakfast included' : room.meal}
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

                    {room.amenities && room.amenities.length > 0 && (
                      <ScrollArea className="w-full whitespace-nowrap mb-3">
                        <div className="flex gap-3 pb-2">
                          {room.amenities.map((amenity, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 text-xs text-primary shrink-0"
                            >
                              {getAmenityIcon(amenity)}
                              {amenity}
                            </span>
                          ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                    )}

                    {room.cancellation && (
                      <p className="text-xs text-green-600 mt-2">
                        {room.cancellation}
                      </p>
                    )}
                  </div>

                    {/* Price & Selection */}
                  <div className="flex items-center gap-6 lg:flex-col lg:items-end lg:gap-4">
                    <div className="text-right">
                      <p className="font-heading text-heading-standard text-primary">
                        {room.isFallbackPrice && <span className="text-sm font-normal text-muted-foreground">From </span>}
                        {room.currency} {room.price.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">per night</p>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDecrease(room)}
                        disabled={selectedQty === 0}
                        className="h-10 w-10"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold text-lg">
                        {selectedQty}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleIncrease(room)}
                        disabled={room.availability <= selectedQty}
                        className="h-10 w-10"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {hasMoreRooms && (
          <div className="mt-6 text-center">
            <Button variant="outline" onClick={handleLoadMore}>
              Show More Rooms ({sortedRooms.length - displayedRooms} remaining)
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
