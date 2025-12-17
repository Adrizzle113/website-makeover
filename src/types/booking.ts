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
