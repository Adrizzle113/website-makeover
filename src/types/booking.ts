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
export type MealPlan = 
  | "room-only" 
  | "breakfast" 
  | "half-board" 
  | "full-board" 
  | "all-inclusive";

export type PaymentType = 
  | "pay-now" 
  | "pay-at-hotel" 
  | "deposit";

export type RateType = "net" | "gross";

export type RoomType = 
  | "standard" 
  | "deluxe" 
  | "suite" 
  | "studio" 
  | "apartment";

export type BedType = 
  | "single" 
  | "double" 
  | "twin" 
  | "king" 
  | "queen";

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
  
  // Residency
  residency: string;
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
  "breakfast": "Breakfast Included",
  "half-board": "Half Board",
  "full-board": "Full Board",
  "all-inclusive": "All Inclusive",
};

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  "pay-now": "Pay Now (Card)",
  "pay-at-hotel": "Pay at Property",
  "deposit": "Deposit Required",
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
  residency: "US",
};
