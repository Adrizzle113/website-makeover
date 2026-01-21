import { useState, useMemo } from "react";
import { Plus, Minus, Bed, Check, X, Users, Maximize, Wifi, Bath, Wind, Tv, Crown, Home, Star, Coffee, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { HotelDetails, RateHawkRate, RateHawkRoomGroup } from "@/types/booking";
import { useBookingStore } from "@/stores/bookingStore";
import { RoomUpsells } from "./RoomUpsells";
import { PaymentTypeBadge, normalizePaymentType, getPaymentTypeLabel } from "./PaymentTypeBadge";
import { RateOptionsList, type RateOption } from "./RateOptionsList";
import { differenceInDays } from "date-fns";
import { formatDateTimeWithPreference } from "@/hooks/useTimezone";

// Room category types for sorting and badges
type RoomCategory = "standard" | "deluxe" | "suite" | "premium" | "family" | "apartment";

// Processed room structure - now includes all rate options
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
  allRates: RateOption[];
  selectedRateId: string;
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
  checkInTime?: string;
  checkOutTime?: string;
}

// Get amenity icon based on name
const getAmenityIcon = (amenity: string | { id?: string; name?: string }) => {
  const amenityName = typeof amenity === 'string' ? amenity : (amenity?.name || amenity?.id || '');
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

// Helper to get meal label
const getMealLabel = (meal: string): string => {
  const labels: Record<string, string> = {
    nomeal: "Room Only",
    breakfast: "Breakfast",
    "half-board": "Half Board",
    "full-board": "Full Board",
    "all-inclusive": "All Inclusive",
  };
  return labels[meal?.toLowerCase()] || meal || "Room Only";
};

// Helper to get cancellation display info
const getCancellationDisplay = (
  cancellation: string, 
  deadline?: string, 
  time?: string,
  timezone?: string,
  fee?: string
) => {
  // If cancellation says "free" but no deadline exists, treat as non-refundable
  // (deadline has likely passed or was never available)
  const hasValidDeadline = !!deadline;
  const isFreeCancellation = hasValidDeadline && (
    cancellation === "free_cancellation" || 
    cancellation?.toLowerCase().includes("free") || 
    cancellation?.toLowerCase().includes("refundable")
  );
  
  // Build time display with timezone
  const timeDisplay = time && timezone ? ` at ${time} (${timezone})` : "";
  
  let label: string;
  if (isFreeCancellation && deadline) {
    label = `Free cancellation until ${deadline}${timeDisplay}`;
  } else if (deadline && fee && fee !== "0") {
    label = `$${fee} fee until ${deadline}${timeDisplay}`;
  } else if (deadline) {
    label = `Free until ${deadline}${timeDisplay}`;
  } else {
    // No deadline = non-refundable (too close to check-in or no policy available)
    label = "Non-refundable";
  }
  
  return {
    isFreeCancellation,
    label,
    icon: isFreeCancellation ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />,
    className: isFreeCancellation ? "text-green-600" : "text-red-500",
  };
};

// Extract room_groups and rates from multiple possible locations in ratehawk_data
const extractRoomData = (hotel: HotelDetails): { roomGroups: RateHawkRoomGroup[]; rates: RateHawkRate[] } => {
  const data = hotel.ratehawk_data;
  if (!data) return { roomGroups: [], rates: [] };

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
      break;
    }
  }

  let rates: RateHawkRate[] = [];
  const rateLocations = [
    data.rates,
    data.enhancedData?.rates,
    data.data?.data?.hotels?.[0]?.rates,
    data.data?.rates,
  ];
  
  for (const location of rateLocations) {
    if (Array.isArray(location) && location.length > 0) {
      rates = location;
      break;
    }
  }

  return { roomGroups, rates };
};

// Helper to extract rg_hash from rate (may be nested)
const getRateRgHash = (rate: RateHawkRate): string | undefined => {
  if (rate.rg_hash) return rate.rg_hash;
  if (rate.rooms?.[0]?.rg_hash) return rate.rooms[0].rg_hash;
  if ((rate as any).rg_ext?.rg_hash) return (rate as any).rg_ext.rg_hash;
  return undefined;
};

// Extract price and currency from a rate
const extractPriceFromRate = (rate: RateHawkRate): { price: number; currency: string; paymentType: string } => {
  let price = 0;
  let currency = "USD";
  let paymentType = "hotel";

  if (rate.payment_options?.payment_types?.length && rate.payment_options.payment_types.length > 0) {
    const pt = rate.payment_options.payment_types[0];
    price = parseFloat(pt.show_amount || pt.amount || "0");
    currency = pt.show_currency_code || pt.currency_code || "USD";
    paymentType = pt.type || "hotel";
  } else if (rate.daily_prices) {
    const dailyPrices = Array.isArray(rate.daily_prices) ? rate.daily_prices : [rate.daily_prices];
    price = dailyPrices.reduce((sum, p) => sum + parseFloat(String(p) || "0"), 0);
    currency = rate.currency || "USD";
  } else if (rate.price) {
    price = parseFloat(rate.price);
    currency = rate.currency || "USD";
  }

  return { price, currency, paymentType };
};

// Format cancellation date from ISO string with timezone and clock format preferences
const formatCancellationDateWithTz = (isoDate: string): { 
  deadline: string; 
  time: string; 
  timezone: string;
  rawDate: string;
} | undefined => {
  if (!isoDate) return undefined;
  try {
    const formatted = formatDateTimeWithPreference(isoDate);
    if (!formatted) return undefined;
    return {
      deadline: formatted.date,
      time: formatted.time,
      timezone: formatted.tzLabel,
      rawDate: isoDate
    };
  } catch {
    return undefined;
  }
};

// Extract cancellation info from all possible locations in a rate
// CRITICAL: hasFreeCancellationBefore is true ONLY if the actual free_cancellation_before field exists
// RateHawk sandbox requires this field to be present for bookings to succeed
const extractCancellation = (rate: RateHawkRate): { 
  cancellation: string; 
  cancellationDeadline?: string;
  cancellationTime?: string;
  cancellationTimezone?: string;
  cancellationRawDate?: string;
  cancellationFee?: string;
  hasFreeCancellationBefore: boolean; // true ONLY if actual free_cancellation_before field exists
} => {
  // 🔍 DEBUG: Log input rate structure
  console.log('🔍 [extractCancellation] Input rate:', {
    hasPaymentOptions: !!rate.payment_options,
    paymentTypesCount: rate.payment_options?.payment_types?.length,
    firstPtType: rate.payment_options?.payment_types?.[0]?.type,
    hasCancellationPenalties: !!rate.payment_options?.payment_types?.[0]?.cancellation_penalties,
    cancellationPenaltiesKeys: Object.keys(rate.payment_options?.payment_types?.[0]?.cancellation_penalties || {}),
    hasCancellationInfo: !!rate.cancellation_info,
    hasRootCancellationPenalties: !!rate.cancellation_penalties,
  });

  // Helper: Extract free_cancellation_before from a penalty object (handles alternate field names)
  const getFreeCancellationDate = (obj: any): string | null => {
    if (!obj) return null;
    return obj.free_cancellation_before || 
           obj.free_cancellation_until || 
           obj.deadline || 
           obj.date_before || 
           obj.until || 
           null;
  };

  // Helper: Check cancellation_penalties which can be object OR array
  const extractFromCancellationPenalties = (cp: any): { 
    date: string | null; 
    policies?: any[];
  } => {
    if (!cp) return { date: null };
    
    // Case 1: cp has direct free_cancellation_before
    const directDate = getFreeCancellationDate(cp);
    if (directDate) return { date: directDate };
    
    // Case 2: cp is an array of penalty objects
    if (Array.isArray(cp)) {
      for (const penalty of cp) {
        const penaltyDate = getFreeCancellationDate(penalty);
        if (penaltyDate) return { date: penaltyDate };
      }
    }
    
    // Case 3: Check policies array
    if (cp.policies?.length) {
      return { date: null, policies: cp.policies };
    }
    
    return { date: null };
  };

  // Search all payment_types for cancellation data
  const paymentTypes = rate.payment_options?.payment_types || [];
  for (const pt of paymentTypes) {
    const result = extractFromCancellationPenalties(pt.cancellation_penalties);
    
    if (result.date) {
      const formatted = formatCancellationDateWithTz(result.date);
      if (formatted) {
        console.log('✅ [extractCancellation] Found free_cancellation_before in payment_type:', {
          source: 'payment_type.cancellation_penalties',
          rawDate: result.date,
          formattedRawDate: formatted.rawDate,
        });
        return { 
          cancellation: "free_cancellation", 
          cancellationDeadline: formatted.deadline,
          cancellationTime: formatted.time,
          cancellationTimezone: formatted.timezone,
          cancellationRawDate: formatted.rawDate,
          cancellationFee: "0",
          hasFreeCancellationBefore: true, // ACTUAL field found
        };
      }
    }
    
    // policies-only fallback - Use policy end_at as free_cancellation_before for deposit payments
    // RateHawk API accepts policy dates for refundable bookings even without explicit free_cancellation_before
    if (result.policies?.length) {
      const policy = result.policies[0];
      const policyDate = policy.end_at || policy.start_at || "";
      const formatted = formatCancellationDateWithTz(policyDate);
      const fee = policy.amount_show?.replace(/[^0-9.]/g, '') || undefined;
      if (formatted) {
        // IMPORTANT: Use policy end_at as the cancellation deadline for API calls
        // Even without explicit free_cancellation_before, we can still pass the date for deposit payment
        const isFreeBeforeDeadline = !fee || parseFloat(fee) === 0;
        
        console.log('📅 [extractCancellation] Using policy date as fallback:', {
          source: 'payment_type.cancellation_penalties.policies',
          policyDate,
          rawDate: formatted.rawDate,
          isFreeBeforeDeadline,
        });
        
        return { 
          cancellation: isFreeBeforeDeadline ? "free_cancellation" : "partial_refund", 
          cancellationDeadline: formatted.deadline,
          cancellationTime: formatted.time,
          cancellationTimezone: formatted.timezone,
          cancellationRawDate: formatted.rawDate,  // CRITICAL: This is the date we'll send to API
          cancellationFee: fee,
          // Mark as true if it's free before the deadline - the date is valid for deposit payment
          hasFreeCancellationBefore: isFreeBeforeDeadline,
        };
      }
    }
  }
  
  // Check alternate locations: rate.cancellation_info
  const infoDate = getFreeCancellationDate(rate.cancellation_info);
  if (infoDate) {
    const formatted = formatCancellationDateWithTz(infoDate);
    if (formatted) {
      return { 
        cancellation: "free_cancellation", 
        cancellationDeadline: formatted.deadline,
        cancellationTime: formatted.time,
        cancellationTimezone: formatted.timezone,
        cancellationRawDate: formatted.rawDate,
        cancellationFee: "0",
        hasFreeCancellationBefore: true, // ACTUAL field found
      };
    }
  }
  
  // Check alternate locations: rate.cancellation_penalties (root level) - handles array or object
  const rootResult = extractFromCancellationPenalties(rate.cancellation_penalties);
  if (rootResult.date) {
    const formatted = formatCancellationDateWithTz(rootResult.date);
    if (formatted) {
      return { 
        cancellation: "free_cancellation", 
        cancellationDeadline: formatted.deadline,
        cancellationTime: formatted.time,
        cancellationTimezone: formatted.timezone,
        cancellationRawDate: formatted.rawDate,
        cancellationFee: "0",
        hasFreeCancellationBefore: true, // ACTUAL field found
      };
    }
  }
  
  // policies-only fallback at root level - Use policy date for deposit payment if free before deadline
  if (rootResult.policies?.length) {
    const policy = rootResult.policies[0];
    const policyDate = policy.end_at || policy.start_at || "";
    const formatted = formatCancellationDateWithTz(policyDate);
    const fee = policy.amount_show?.replace(/[^0-9.]/g, '') || undefined;
    if (formatted) {
      const isFreeBeforeDeadline = !fee || parseFloat(fee) === 0;
      
      console.log('📅 [extractCancellation] Using root policy date as fallback:', {
        source: 'root.cancellation_penalties.policies',
        policyDate,
        rawDate: formatted.rawDate,
        isFreeBeforeDeadline,
      });
      
      return { 
        cancellation: isFreeBeforeDeadline ? "free_cancellation" : "partial_refund", 
        cancellationDeadline: formatted.deadline,
        cancellationTime: formatted.time,
        cancellationTimezone: formatted.timezone,
        cancellationRawDate: formatted.rawDate,  // CRITICAL: This is the date we'll send to API
        cancellationFee: fee,
        // Mark as true if it's free before the deadline - the date is valid for deposit payment
        hasFreeCancellationBefore: isFreeBeforeDeadline,
      };
    }
  }
  
  // Check rate.deposit (some rates have it here)
  const depositDate = getFreeCancellationDate(rate.deposit);
  if (depositDate) {
    const formatted = formatCancellationDateWithTz(depositDate);
    if (formatted) {
      return { 
        cancellation: "free_cancellation", 
        cancellationDeadline: formatted.deadline,
        cancellationTime: formatted.time,
        cancellationTimezone: formatted.timezone,
        cancellationRawDate: formatted.rawDate,
        cancellationFee: "0",
        hasFreeCancellationBefore: true, // ACTUAL field found
      };
    }
  }
  
  // Fallback to legacy fields - never has actual free_cancellation_before
  const legacyPolicy = rate.cancellation_policy?.type || rate.cancellationPolicy;
  if (legacyPolicy?.toLowerCase().includes("free") || legacyPolicy?.toLowerCase().includes("refundable")) {
    return { cancellation: "free_cancellation", hasFreeCancellationBefore: false };
  }
  
  return { cancellation: "non_refundable", hasFreeCancellationBefore: false };
};

// Convert a RateHawkRate to a RateOption
const rateToRateOption = (rate: RateHawkRate, index: number): RateOption | null => {
  const { price, currency, paymentType } = extractPriceFromRate(rate);
  
  if (price <= 0) return null;

  const meal = rate.meal || "nomeal";
  
  // Extract cancellation from all possible API locations (now includes time/timezone + hasFreeCancellationBefore)
  const { 
    cancellation, 
    cancellationDeadline, 
    cancellationTime,
    cancellationTimezone,
    cancellationRawDate,
    cancellationFee,
    hasFreeCancellationBefore,
  } = extractCancellation(rate);
  
  // Extract rate-specific amenities
  const roomAmenities = [
    ...(rate.amenities || []),
    ...(rate.room_amenities || []),
  ].filter(Boolean).slice(0, 3);

  // Determine room size from rate
  const roomSize = rate.rooms?.[0]?.size;

  // Detect if bed type is guaranteed from room name
  const roomName = rate.room_name?.toLowerCase() || "";
  const bedGuaranteed = !roomName.includes("bed type not guaranteed") && 
    !roomName.includes("run of house") && 
    !roomName.includes("room type assigned");

  // Extract ECLC data from rate if available
  const earlyCheckin = (rate as any).early_checkin;
  const lateCheckout = (rate as any).late_checkout;
  const serpFilters = (rate as any).serp_filters as string[] | undefined;

  // Check serp_filters for ECLC availability flags as fallback
  const hasEarlyCheckinFlag = serpFilters?.includes('has_early_checkin') ?? false;
  const hasLateCheckoutFlag = serpFilters?.includes('has_late_checkout') ?? false;

  // Build final ECLC objects - use explicit data if available, otherwise create from flags
  const finalEarlyCheckin = earlyCheckin 
    ? { available: earlyCheckin.available ?? true, time: earlyCheckin.time, price: earlyCheckin.price }
    : hasEarlyCheckinFlag 
      ? { available: true } 
      : undefined;

  const finalLateCheckout = lateCheckout 
    ? { available: lateCheckout.available ?? true, time: lateCheckout.time, price: lateCheckout.price }
    : hasLateCheckoutFlag 
      ? { available: true } 
      : undefined;

  // Debug logging for first rate to trace ECLC data
  if (index === 0) {
    console.log('[RoomSelection] Rate ECLC extraction:', {
      rateId: rate.match_hash || rate.book_hash,
      rawEarlyCheckin: earlyCheckin,
      rawLateCheckout: lateCheckout,
      serpFilters,
      hasEarlyCheckinFlag,
      hasLateCheckoutFlag,
      finalEarlyCheckin,
      finalLateCheckout,
    });
  }

  // Extract taxes from payment_options.payment_types[0].tax_data.taxes
  const taxes = rate.payment_options?.payment_types?.[0]?.tax_data?.taxes || [];

  return {
    id: rate.match_hash || rate.book_hash || `rate_${index}`,
    price: Math.round(price),
    currency,
    meal,
    mealLabel: getMealLabel(meal),
    paymentType,
    paymentLabel: getPaymentTypeLabel(paymentType),
    cancellation,
    cancellationDeadline,
    cancellationTime,
    cancellationTimezone,
    cancellationRawDate,
    roomAmenities: roomAmenities.length > 0 ? roomAmenities : undefined,
    allotment: rate.allotment,
    bookHash: rate.book_hash,
    matchHash: rate.match_hash,
    roomSize,
    bedGuaranteed,
    cancellationFee,
    // CRITICAL: Track if actual free_cancellation_before field exists (required for sandbox)
    hasFreeCancellationBefore,
    // ECLC data (with serp_filters fallback)
    earlyCheckin: finalEarlyCheckin,
    lateCheckout: finalLateCheckout,
    serpFilters,
    taxes,
  };
};

// Process rooms using room_groups + rg_hash matching, collecting ALL rates per room
const processRoomsWithRoomGroups = (hotel: HotelDetails): ProcessedRoom[] => {
  const { roomGroups, rates } = extractRoomData(hotel);

  if (roomGroups.length > 0 && rates.length > 0) {
    const processedRooms: ProcessedRoom[] = [];

    roomGroups.forEach((roomGroup, index) => {
      try {
        const nameStruct = roomGroup.name_struct || {};
        const mainName = nameStruct.main_name || `Room Type ${index + 1}`;
        const beddingType = nameStruct.bedding_type || "";
        const rgHash = roomGroup.rg_hash;
        const fullRoomName = beddingType ? `${mainName} - ${beddingType}` : mainName;

        // Find ALL matching rates for this room group
        const matchingRates = rates.filter((rate) => getRateRgHash(rate) === rgHash);

        if (matchingRates.length === 0) return;

        // Convert all matching rates to RateOption objects
        const allRates: RateOption[] = matchingRates
          .map((rate, idx) => rateToRateOption(rate, idx))
          .filter((r): r is RateOption => r !== null)
          .sort((a, b) => a.price - b.price);

        if (allRates.length === 0) return;

        // Best rate is the first (lowest price)
        const bestRate = allRates[0];
        const bestRateRaw = matchingRates.find(
          (r) => (r.match_hash || r.book_hash) === bestRate.id
        );

        // Determine occupancy from API data or fallback to room name parsing
        let occupancy = "2 guests";
        if (bestRateRaw?.rg_ext?.capacity) {
          occupancy = `${bestRateRaw.rg_ext.capacity} guest${bestRateRaw.rg_ext.capacity !== 1 ? "s" : ""}`;
        } else if ((bestRateRaw as any)?.rooms?.[0]?.max_occupancy) {
          const maxOcc = (bestRateRaw as any).rooms[0].max_occupancy;
          occupancy = `${maxOcc} guest${maxOcc !== 1 ? "s" : ""}`;
        } else {
          occupancy = getOccupancyFromName(mainName);
        }

        // Extract amenities from best rate
        let roomAmenities: string[] = [];
        if (bestRateRaw) {
          roomAmenities = [
            ...(bestRateRaw.amenities || []),
            ...(bestRateRaw.room_amenities || []),
            ...(bestRateRaw.rooms?.[0]?.amenities_data || []),
          ].slice(0, 4);
        }
        if (roomAmenities.length === 0) {
          roomAmenities = hotel.amenities?.slice(0, 3).map(a => a.name) || ["Free WiFi", "Air conditioning"];
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
        const roomSize = bestRateRaw?.rooms?.[0]?.size || "Standard size";

        processedRooms.push({
          id: roomGroup.room_group_id?.toString() || rgHash || `room_${index}`,
          name: fullRoomName,
          type: mainName,
          price: bestRate.price,
          currency: bestRate.currency,
          bedding: beddingDisplay,
          occupancy: occupancy,
          size: roomSize,
          amenities: roomAmenities,
          cancellation: bestRate.cancellation,
          paymentType: bestRate.paymentType,
          availability: bestRateRaw?.allotment || 5,
          rgHash: rgHash,
          bookHash: bestRate.bookHash,
          matchHash: bestRate.matchHash,
          meal: bestRate.meal,
          isFallbackPrice: false,
          category: category,
          allRates: allRates,
          selectedRateId: bestRate.id,
        });
      } catch (error) {
        console.error(`Error processing room group ${index}:`, error);
      }
    });

    if (processedRooms.length > 0) {
      return processedRooms;
    }
  }

  // Fallback: process rates directly if no room_groups or processing failed
  return processRatesDirectly(hotel, rates);
};

// Fallback: process rooms directly from rates array
const processRatesDirectly = (hotel: HotelDetails, rates: RateHawkRate[]): ProcessedRoom[] => {
  if (rates.length === 0) {
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
        paymentType: "hotel",
        availability: room.available || 1,
        isFallbackPrice: false,
        category: getRoomCategory(room.name),
        allRates: [{
          id: room.id || `room-${idx}`,
          price: room.price,
          currency: room.currency || hotel.currency || "USD",
          meal: room.mealPlan || "nomeal",
          mealLabel: getMealLabel(room.mealPlan || "nomeal"),
          paymentType: "hotel",
          paymentLabel: "Pay at Hotel",
          cancellation: room.cancellationPolicy || "Standard cancellation",
        }],
        selectedRateId: room.id || `room-${idx}`,
      }));
    }

    // Ultimate fallback
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
      paymentType: "hotel",
      availability: 1,
      isFallbackPrice: true,
      category: "standard" as RoomCategory,
      allRates: [{
        id: "default",
        price: hotel.priceFrom || 0,
        currency: hotel.currency || "USD",
        meal: "nomeal",
        mealLabel: "Room Only",
        paymentType: "hotel",
        paymentLabel: "Pay at Hotel",
        cancellation: "Standard cancellation",
      }],
      selectedRateId: "default",
    }];
  }

  // Group rates by room name to collect all options
  const ratesByRoom = new Map<string, RateHawkRate[]>();
  
  rates.forEach((rate) => {
    const roomName = rate.room_name || "Standard Room";
    const existing = ratesByRoom.get(roomName) || [];
    existing.push(rate);
    ratesByRoom.set(roomName, existing);
  });

  const processedRooms: ProcessedRoom[] = [];

  ratesByRoom.forEach((roomRates, roomName) => {
    const allRates: RateOption[] = roomRates
      .map((rate, idx) => rateToRateOption(rate, idx))
      .filter((r): r is RateOption => r !== null)
      .sort((a, b) => a.price - b.price);

    if (allRates.length === 0) return;

    const bestRate = allRates[0];
    const bestRateRaw = roomRates[0];
    const category = getRoomCategory(roomName);

    let occupancy = "2 guests";
    if (bestRateRaw.rg_ext?.capacity) {
      occupancy = `${bestRateRaw.rg_ext.capacity} guest${bestRateRaw.rg_ext.capacity !== 1 ? "s" : ""}`;
    } else {
      occupancy = getOccupancyFromName(roomName);
    }

    const amenities = [
      ...(bestRateRaw.amenities_data || []),
      ...(bestRateRaw.amenities || []),
      ...(bestRateRaw.room_amenities || []),
    ].slice(0, 4);

    let bedding = "Standard bedding";
    const lowerName = roomName.toLowerCase();
    if (lowerName.includes("twin")) bedding = "Twin beds";
    else if (lowerName.includes("double")) bedding = "Double bed";
    else if (lowerName.includes("single")) bedding = "Single bed";
    else if (lowerName.includes("king")) bedding = "King bed";
    else if (lowerName.includes("queen")) bedding = "Queen bed";

    processedRooms.push({
      id: bestRateRaw.match_hash || bestRateRaw.book_hash || `room_${processedRooms.length}`,
      name: roomName,
      type: roomName,
      price: bestRate.price,
      currency: bestRate.currency,
      bedding: bedding,
      occupancy: occupancy,
      size: bestRateRaw.rooms?.[0]?.size || "Standard size",
      amenities: amenities.length > 0 ? amenities : ["Free WiFi", "Air conditioning"],
      cancellation: bestRate.cancellation,
      paymentType: bestRate.paymentType,
      availability: bestRateRaw.allotment || 5,
      rgHash: bestRateRaw.rg_hash,
      bookHash: bestRate.bookHash,
      matchHash: bestRate.matchHash,
      meal: bestRate.meal,
      isFallbackPrice: false,
      category: category,
      allRates: allRates,
      selectedRateId: bestRate.id,
    });
  });

  return processedRooms.length > 0 ? processedRooms : [{
    id: "fallback",
    name: "Standard Room",
    type: "Standard",
    price: hotel.priceFrom || 0,
    currency: hotel.currency || "USD",
    bedding: "Standard bedding",
    occupancy: "2 guests",
    size: "Standard size",
    amenities: hotel.amenities?.slice(0, 3).map(a => a.name) || [],
    cancellation: "Standard cancellation",
    paymentType: "hotel",
    availability: 1,
    isFallbackPrice: true,
    category: "standard" as RoomCategory,
    allRates: [{
      id: "fallback",
      price: hotel.priceFrom || 0,
      currency: hotel.currency || "USD",
      meal: "nomeal",
      mealLabel: "Room Only",
      paymentType: "hotel",
      paymentLabel: "Pay at Hotel",
      cancellation: "Standard cancellation",
    }],
    selectedRateId: "fallback",
  }];
};

interface RoomSelectionSectionExtendedProps extends RoomSelectionSectionProps {
  onRefreshRates?: () => void;
}

export function RoomSelectionSection({ 
  hotel, 
  isLoading = false,
  checkInTime,
  checkOutTime,
  onRefreshRates,
}: RoomSelectionSectionExtendedProps) {
  const { selectedRooms, addRoom, updateRoomQuantity, searchParams, upsellsPreferences, resetUpsellsPreferences } = useBookingStore();
  const [displayedRooms, setDisplayedRooms] = useState(6);
  const [selectedRates, setSelectedRates] = useState<Record<string, string>>({});

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

  // Get the currently selected rate for a room
  const getActiveRate = (room: ProcessedRoom): RateOption => {
    const selectedRateId = selectedRates[room.id] || room.selectedRateId;
    return room.allRates.find(r => r.id === selectedRateId) || room.allRates[0];
  };

  const handleRateSelect = (roomId: string, rateId: string) => {
    setSelectedRates(prev => ({ ...prev, [roomId]: rateId }));
    
    // Update the selected room if already selected
    const currentQty = getSelectedQuantity(roomId);
    if (currentQty > 0) {
      const room = sortedRooms.find(r => r.id === roomId);
      const newRate = room?.allRates.find(r => r.id === rateId);
      if (room && newRate) {
        // Determine cancellation type from the new rate
        let cancellationType: "free_cancellation" | "partial_refund" | "non_refundable" = "non_refundable";
        if (newRate.cancellation === "free_cancellation" || newRate.cancellation?.toLowerCase().includes("free")) {
          cancellationType = "free_cancellation";
        } else if (newRate.cancellation?.toLowerCase().includes("partial")) {
          cancellationType = "partial_refund";
        }

        console.log('[Room Selection] Rate changed:', {
          roomId: room.id,
          rateId: newRate.id?.substring(0, 20),
          cancellationType,
          cancellationDeadline: newRate.cancellationRawDate,
          hasFreeCancellationBefore: newRate.hasFreeCancellationBefore,
        });

        // Remove old selection and add with new rate
        updateRoomQuantity(roomId, 0);
        addRoom({
          roomId: room.id,
          roomName: room.name,
          quantity: currentQty,
          pricePerRoom: newRate.price,
          totalPrice: newRate.price * currentQty,
          currency: newRate.currency,
          match_hash: newRate.matchHash,
          book_hash: newRate.bookHash,
          earlyCheckin: newRate.earlyCheckin,
          lateCheckout: newRate.lateCheckout,
          taxes: newRate.taxes,
          // ✅ Include all cancellation metadata when switching rates
          cancellationType,
          cancellationDeadline: newRate.cancellationRawDate,
          cancellationPolicy: newRate.cancellation,
          hasFreeCancellationBefore: newRate.hasFreeCancellationBefore || false,
        });
      }
    }
  };

  const handleIncrease = (room: ProcessedRoom) => {
    const activeRate = getActiveRate(room);
    const currentQty = getSelectedQuantity(room.id);
    if (currentQty === 0) {
      // Determine cancellation type from the rate
      let cancellationType: "free_cancellation" | "partial_refund" | "non_refundable" = "non_refundable";
      if (activeRate.cancellation === "free_cancellation" || activeRate.cancellation?.toLowerCase().includes("free")) {
        cancellationType = "free_cancellation";
      } else if (activeRate.cancellation?.toLowerCase().includes("partial")) {
        cancellationType = "partial_refund";
      }

      console.log('🏨 [handleIncrease] Active rate full data:', {
        roomId: room.id,
        rateId: activeRate.id?.substring(0, 30),
        cancellation: activeRate.cancellation,
        cancellationRawDate: activeRate.cancellationRawDate,
        cancellationDeadline: activeRate.cancellationDeadline,
        hasFreeCancellationBefore: activeRate.hasFreeCancellationBefore,
        cancellationType,
        price: activeRate.price,
        bookHash: activeRate.bookHash?.substring(0, 30),
      });

      addRoom({
        roomId: room.id,
        roomName: room.name,
        quantity: 1,
        pricePerRoom: activeRate.price,
        totalPrice: activeRate.price,
        currency: activeRate.currency,
        match_hash: activeRate.matchHash,
        book_hash: activeRate.bookHash,
        earlyCheckin: activeRate.earlyCheckin,
        lateCheckout: activeRate.lateCheckout,
        taxes: activeRate.taxes,
        // Include cancellation metadata for sandbox validation
        cancellationType,
        cancellationDeadline: activeRate.cancellationRawDate,
        cancellationPolicy: activeRate.cancellation,
        // CRITICAL: RateHawk sandbox requires actual free_cancellation_before field
        hasFreeCancellationBefore: activeRate.hasFreeCancellationBefore || false,
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

  // Check if upsells filters are active
  const hasActiveUpsellFilters = 
    upsellsPreferences.earlyCheckin.enabled || 
    upsellsPreferences.lateCheckout.enabled || 
    upsellsPreferences.multipleEclc ||
    upsellsPreferences.onlyEclc;

  if (sortedRooms.length === 0) {
    return (
      <section className="py-8 bg-app-white-smoke">
        <div className="container">
          <div className="text-center max-w-md mx-auto">
            <h2 className="font-heading text-heading-standard text-foreground mb-4">
              No Rooms Available
            </h2>
            {hasActiveUpsellFilters ? (
              <>
                <p className="text-muted-foreground mb-4">
                  No rates found with your selected early check-in or late checkout preferences. 
                  Try adjusting your options.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    resetUpsellsPreferences();
                    onRefreshRates?.();
                  }}
                >
                  Clear Preferences & Show All Rates
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">
                No rooms available for the selected dates.
              </p>
            )}
          </div>
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
            {sortedRooms.length} room type{sortedRooms.length !== 1 ? "s" : ""} available
            {hasActiveUpsellFilters && (
              <span className="ml-2 text-primary">
                (filtered by check-in/checkout preferences)
              </span>
            )}
            {hasMoreRooms && (
              <span className="text-muted-foreground">
                {" "}• Showing {displayedRooms} of {sortedRooms.length}
              </span>
            )}
          </p>
        </div>

        <div className="space-y-4">
          {roomsToDisplay.map((room) => {
            const selectedQty = getSelectedQuantity(room.id);
            const isSelected = selectedQty > 0;
            const activeRate = getActiveRate(room);
            const activeRateId = selectedRates[room.id] || room.selectedRateId;

            return (
              <Card
                key={room.id}
                className={`p-4 md:p-6 transition-all ${
                  isSelected ? "border-primary ring-1 ring-primary" : "border-border"
                }`}
              >
                <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
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
                        const amenityName = typeof amenity === 'string' ? amenity : ((amenity as { name?: string; id?: string })?.name || (amenity as { name?: string; id?: string })?.id || '');
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

                    {/* Cancellation Policy */}
                    {activeRate.cancellation && (
                      <div className={`flex items-center gap-1 text-sm mt-2 ${getCancellationDisplay(activeRate.cancellation, activeRate.cancellationDeadline, activeRate.cancellationFee).className}`}>
                        {getCancellationDisplay(activeRate.cancellation, activeRate.cancellationDeadline, activeRate.cancellationFee).icon}
                        <span>{getCancellationDisplay(activeRate.cancellation, activeRate.cancellationDeadline, activeRate.cancellationFee).label}</span>
                      </div>
                    )}
                  </div>

                  {/* Price, Badges, and Selection */}
                  <div className="flex flex-col items-end gap-2 min-w-[180px]">
                    {/* Payment type and meal badges */}
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <PaymentTypeBadge paymentType={activeRate.paymentType} />
                      {activeRate.meal && activeRate.meal !== "nomeal" && (
                        <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-700 border-green-200">
                          <Coffee className="w-3 h-3" />
                          {activeRate.mealLabel}
                        </Badge>
                      )}
                    </div>

                    {/* Price and Quantity on same row */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-foreground">
                          {activeRate.currency === "USD" ? "$" : activeRate.currency} {Math.round(activeRate.price / nights).toLocaleString()}
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
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleIncrease(room)}
                          className="h-8 w-8"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rate Options Expandable Section */}
                {room.allRates.length > 1 && (
                  <RateOptionsList
                    rates={room.allRates}
                    selectedRateId={activeRateId}
                    onSelectRate={(rateId) => handleRateSelect(room.id, rateId)}
                    nights={nights}
                  />
                )}

                {/* Upsells - show when room is selected and API has ECLC data */}
                {isSelected && (activeRate.earlyCheckin?.available || activeRate.lateCheckout?.available) && (
                  <RoomUpsells
                    roomId={room.id}
                    roomName={room.name}
                    currency={activeRate.currency}
                    checkInTime={checkInTime}
                    checkOutTime={checkOutTime}
                    earlyCheckin={activeRate.earlyCheckin}
                    lateCheckout={activeRate.lateCheckout}
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
