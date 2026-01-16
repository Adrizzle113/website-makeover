export interface SearchParams {
  destination: string;
  destinationId?: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  rooms: number;
  children?: number;
  childrenAges?: number[];
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  type: "city" | "region" | "hotel";
}

export interface HotelImage {
  url: string;
  alt?: string;
}

export interface HotelAmenity {
  id: string;
  name: string;
  icon?: string;
}

export interface RoomRate {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  currency: string;
  maxOccupancy: number;
  squareFootage?: number;
  bedType?: string;
  amenities?: string[];
  cancellationPolicy?: string;
  mealPlan?: string;
  available: number;
}

// RateHawk API data structures - Enhanced for room_groups matching
export interface RateHawkRoomGroup {
  rg_hash: string;
  name_struct?: {
    main_name?: string;
    bedding_type?: string;
  };
  room_group_id?: number;
  room_size?: string;
  images?: string[];
  image_count?: number;
  room_amenities?: string[];
}

export interface RateHawkRate {
  rg_hash?: string;
  book_hash?: string;
  match_hash?: string;
  room_name?: string;
  meal?: string;
  meal_data?: {
    has_breakfast?: boolean;
    [key: string]: unknown;
  };
  rg_ext?: {
    capacity?: number;
    bedrooms?: number;
    bathroom?: number;
    [key: string]: unknown;
  };
  payment_options?: {
    payment_types?: Array<{
      show_amount?: string;
      amount?: string;
      show_currency_code?: string;
      currency_code?: string;
      type?: string;
      cancellation_penalties?: {
        free_cancellation_before?: string;
        policies?: Array<{
          start_at?: string;
          end_at?: string;
          amount_charge?: string;
          amount_show?: string;
        }>;
      };
      tax_data?: {
        taxes: TaxItem[];
      };
    }>;
  };
  // Alternate cancellation locations (some API responses)
  cancellation_info?: {
    free_cancellation_before?: string;
    policies?: Array<{
      start_at?: string;
      end_at?: string;
      amount_charge?: string;
      amount_show?: string;
    }>;
  };
  cancellation_penalties?: {
    free_cancellation_before?: string;
    policies?: Array<{
      start_at?: string;
      end_at?: string;
      amount_charge?: string;
      amount_show?: string;
    }>;
  };
  daily_prices?: string[] | string;
  price?: string;
  currency?: string;
  amenities?: string[];
  amenities_data?: string[];
  room_amenities?: string[];
  allotment?: number;
  rooms?: Array<{
    amenities_data?: string[];
    size?: string;
    rg_hash?: string;
  }>;
  cancellation_policy?: {
    type?: string;
  };
  cancellationPolicy?: string;
  mealPlan?: string;
  paymentInfo?: {
    allowed_payment_types?: Array<{ type: string }>;
  };
}

export interface ProcessedRate {
  id: string;
  roomName: string;
  price: number;
  currency: string;
  rg_hash?: string;
  cancellationPolicy?: string;
  mealPlan?: string;
}

export interface RateHawkData {
  room_groups?: RateHawkRoomGroup[];
  rates?: RateHawkRate[];
  static_vm?: {
    images?: Array<{ tmpl: string }>;
    [key: string]: unknown;
  };
  enhancedData?: {
    room_groups?: RateHawkRoomGroup[];
    rates?: RateHawkRate[];
    processed_rates?: ProcessedRate[];
    booking_options?: Array<{
      rateKey: string;
      bookingUrl: string;
      rg_hash?: string;
    }>;
    metadata?: Record<string, unknown>;
  };
  // Support nested data structures from API
  data?: {
    data?: {
      hotels?: Array<{
        rates?: RateHawkRate[];
        room_groups?: RateHawkRoomGroup[];
        [key: string]: unknown;
      }>;
    };
    rates?: RateHawkRate[];
    room_groups?: RateHawkRoomGroup[];
  };
  [key: string]: unknown;
}

export interface Hotel {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  country: string;
  starRating: number;
  reviewScore?: number;
  reviewCount?: number;
  images: HotelImage[];
  mainImage: string;
  amenities: HotelAmenity[];
  priceFrom: number;
  currency: string;
  latitude?: number;
  longitude?: number;
  rooms?: RoomRate[];
  ratehawk_data?: RateHawkData;
}

export interface HotelDetails extends Hotel {
  fullDescription?: string;
  checkInTime?: string;
  checkOutTime?: string;
  policies?: string[];
  facilities?: string[];
  nearbyAttractions?: string[];
}

export interface RoomSelection {
  roomId: string;
  roomName: string;
  quantity: number;
  pricePerRoom: number;
  totalPrice: number;
  book_hash?: string;
  match_hash?: string;
  currency?: string;
  bedType?: string;
  amenities?: string[];
  cancellationPolicy?: string;
  meal?: string;
  // Cancellation metadata for sandbox validation
  cancellationType?: "free_cancellation" | "partial_refund" | "non_refundable";
  cancellationDeadline?: string; // ISO date string
  // ECLC data for upsells
  earlyCheckin?: {
    available?: boolean;
    time?: string;
    price?: { amount: string; currency: string };
  };
  lateCheckout?: {
    available?: boolean;
    time?: string;
    price?: { amount: string; currency: string };
  };
  // Non-included taxes (must be paid at property)
  taxes?: TaxItem[];
}

export interface BookingState {
  searchParams: SearchParams | null;
  searchResults: Hotel[];
  selectedHotel: HotelDetails | null;
  selectedRooms: RoomSelection[];
  totalPrice: number;
  isLoading: boolean;
  error: string | null;
}

// ETG/RateHawk Filter Types
export type MealPlan = "room-only" | "breakfast" | "half-board" | "full-board" | "all-inclusive";

export type PaymentType = "pay-now" | "pay-at-hotel" | "deposit";

export type RateType = "net" | "gross";

export type RoomType = "standard" | "deluxe" | "suite" | "studio" | "apartment";

export type BedType = "single" | "double" | "twin" | "king" | "queen";

export interface SearchFilters {
  // Price
  priceMin?: number;
  priceMax?: number;

  // Star Rating
  starRatings: number[];

  // Cancellation
  freeCancellationOnly: boolean;
  refundableOnly: boolean;

  // Meal Plans
  mealPlans: MealPlan[];

  // Amenities
  amenities: string[];

  // Payment Type
  paymentTypes: PaymentType[];

  // Rate Type
  rateType: RateType | null;
  showNetRates: boolean;
  showGrossRates: boolean;

  // Room Level
  roomTypes: RoomType[];
  bedTypes: BedType[];

  // Hotel Types (from RateHawk hotel_kinds)
  hotelKinds: string[];

  // Residency
  residency: string;

  // Additional filters
  earlyCheckIn: boolean;
  lateCheckOut: boolean;
}

export type SortOption =
  | "popularity"
  | "price-low"
  | "price-high"
  | "rating"
  | "distance"
  | "free-cancellation"
  | "cheapest-rate";

export const MEAL_PLAN_LABELS: Record<MealPlan, string> = {
  "room-only": "Room Only",
  breakfast: "Breakfast Included",
  "half-board": "Half Board",
  "full-board": "Full Board",
  "all-inclusive": "All Inclusive",
};

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  "pay-now": "Pay Now (Card)",
  "pay-at-hotel": "Pay at Property",
  deposit: "Deposit Required",
};

export const AMENITY_OPTIONS = [
  { id: "wifi", label: "Free Wi-Fi", icon: "Wifi" },
  { id: "breakfast", label: "Breakfast", icon: "Coffee" },
  { id: "parking", label: "Parking", icon: "Car" },
  { id: "pool", label: "Pool", icon: "Waves" },
  { id: "gym", label: "Gym", icon: "Dumbbell" },
  { id: "ac", label: "Air Conditioning", icon: "Wind" },
  { id: "pets", label: "Pet Friendly", icon: "PawPrint" },
  { id: "spa", label: "Spa", icon: "Sparkles" },
  { id: "shuttle", label: "Airport Shuttle", icon: "Bus" },
] as const;

export const DEFAULT_FILTERS: SearchFilters = {
  priceMin: undefined,
  priceMax: undefined,
  starRatings: [],
  freeCancellationOnly: false,
  refundableOnly: false,
  mealPlans: [],
  amenities: [],
  paymentTypes: [],
  rateType: null,
  showNetRates: true,
  showGrossRates: true,
  roomTypes: [],
  bedTypes: [],
  hotelKinds: [],
  residency: "US",
  earlyCheckIn: false,
  lateCheckOut: false,
};

// POI (Points of Interest) Types
export interface POIItem {
  name: string;
  distance: string;
  type?: string;
  subtype?: string;
}

export interface POIData {
  nearby: POIItem[];
  airports: POIItem[];
  subways: POIItem[];
  placesOfInterest: POIItem[];
}

export interface POIResponse {
  success: boolean;
  data: POIData;
  metadata?: {
    hotelId: string;
    poisFound: number;
    source: string;
    timestamp: string;
    duration: string;
  };
}

// Search Response type (matches API service)
export interface SearchResponse {
  hotels: Hotel[];
  totalResults: number;
  hasMore: boolean;
  nextPage: number;
  currentPage: number;
}

// New Search Types
export type SearchType = 'region' | 'poi' | 'geo' | 'ids';

export interface POISearchParams {
  poiName: string;
  checkin: Date;
  checkout: Date;
  guests: { adults: number; children: number[] }[];
  radius?: number; // default 5000m
  residency?: string;
  currency?: string;
}

export interface GeoSearchParams {
  latitude: number;
  longitude: number;
  checkin: Date;
  checkout: Date;
  guests: { adults: number; children: number[] }[];
  radius?: number; // default 5000m
  residency?: string;
  currency?: string;
}

export interface IdsSearchParams {
  hotelIds: string[];
  checkin: Date;
  checkout: Date;
  guests: { adults: number; children: number[] }[];
  residency?: string;
  currency?: string;
}

// Tax Types (RateHawk API Best Practices Section 3.5)
export interface TaxItem {
  name: string;
  included_by_supplier: boolean;
  amount: string;
  currency_code: string;
}

export interface TaxData {
  taxes: TaxItem[];
}

// API Upsells Request Types (for /api/ratehawk/hotel/details)
export interface UpsellsRequest {
  early_checkin?: { time?: string }; // time in "HH:MM" format
  late_checkout?: { time?: string };
  multiple_eclc?: boolean; // Request all available early/late checkout options
  only_eclc?: boolean; // Only show rates with early/late options
}

// Frontend Upsells State
export interface UpsellsState {
  earlyCheckin: {
    enabled: boolean;
    time: string | null; // "HH:MM" format or null for any time
  };
  lateCheckout: {
    enabled: boolean;
    time: string | null;
  };
  multipleEclc: boolean; // Request all available ECLC time options
  onlyEclc: boolean; // Filter: only show rates with these options
}

// Default upsells state
export const DEFAULT_UPSELLS_STATE: UpsellsState = {
  earlyCheckin: { enabled: false, time: null },
  lateCheckout: { enabled: false, time: null },
  multipleEclc: false,
  onlyEclc: false,
};

// Helper to transform frontend state to API format
// Always returns a valid request object (never undefined) to ensure ECLC data is fetched
export function formatUpsellsForAPI(state: UpsellsState): UpsellsRequest {
  const result: UpsellsRequest = {
    // Always request multiple ECLC options so we can show available add-ons
    multiple_eclc: true,
  };

  // Only include early_checkin if a time is actually specified
  // Sending empty object causes API 500: "early checkin must be in datetime format"
  if (state.earlyCheckin.enabled && state.earlyCheckin.time) {
    result.early_checkin = { time: state.earlyCheckin.time };
  }

  // Only include late_checkout if a time is actually specified
  if (state.lateCheckout.enabled && state.lateCheckout.time) {
    result.late_checkout = { time: state.lateCheckout.time };
  }

  if (state.onlyEclc) {
    result.only_eclc = true;
  }

  return result;
}
