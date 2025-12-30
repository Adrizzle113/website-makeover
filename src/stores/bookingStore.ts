import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  SearchParams,
  Hotel,
  HotelDetails,
  RoomSelection,
  SearchFilters,
  SortOption,
} from "@/types/booking";
import { DEFAULT_FILTERS } from "@/types/booking";
import type { OrderStatus, PaymentType } from "@/types/etgBooking";

// Upsell types
export interface Upsell {
  id: string;
  type: "early_checkin" | "late_checkout";
  name: string;
  description?: string;
  price: number;
  currency: string;
  newTime?: string; // e.g., "10:00 AM" for early check-in
}

export interface SelectedUpsell extends Upsell {
  roomId: string;
}

interface BookingStore {
  // State
  searchParams: SearchParams | null;
  searchResults: Hotel[];
  selectedHotel: HotelDetails | null;
  selectedRooms: RoomSelection[];
  selectedUpsells: SelectedUpsell[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMoreResults: boolean;
  currentPage: number;
  totalResults: number;
  
  // Filter & Sort State
  filters: SearchFilters;
  sortBy: SortOption;

  // ETG Booking State
  bookingHash: string | null;      // book_hash from prebook
  partnerOrderId: string | null;   // Generated once per booking
  orderId: string | null;          // From order form response
  itemId: string | null;           // From order form response
  orderGroupId: string | null;
  orderStatus: OrderStatus;
  paymentType: PaymentType | null;
  residency: string;

  // Actions
  setSearchParams: (params: SearchParams) => void;
  setSearchResults: (results: Hotel[], hasMore?: boolean, total?: number) => void;
  appendSearchResults: (results: Hotel[], hasMore?: boolean) => void;
  setSelectedHotel: (hotel: HotelDetails | null) => void;
  addRoom: (room: RoomSelection) => void;
  removeRoom: (roomId: string) => void;
  updateRoomQuantity: (roomId: string, quantity: number) => void;
  clearRoomSelection: () => void;
  setLoading: (loading: boolean) => void;
  setLoadingMore: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentPage: (page: number) => void;
  clearSearch: () => void;
  reset: () => void;
  
  // Upsell Actions
  addUpsell: (upsell: SelectedUpsell) => void;
  removeUpsell: (upsellId: string, roomId: string) => void;
  clearUpsells: () => void;
  getUpsellsForRoom: (roomId: string) => SelectedUpsell[];
  
  // Filter & Sort Actions
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  setSortBy: (sort: SortOption) => void;

  // ETG Booking Actions
  setBookingHash: (hash: string | null) => void;
  setPartnerOrderId: (id: string | null) => void;
  setOrderId: (id: string | null) => void;
  setItemId: (id: string | null) => void;
  setOrderGroupId: (id: string | null) => void;
  setOrderStatus: (status: OrderStatus) => void;
  setPaymentType: (type: PaymentType | null) => void;
  setResidency: (residency: string) => void;
  clearBookingState: () => void;
  generateAndSetPartnerOrderId: () => string;

  // Computed
  getTotalPrice: () => number;
  getTotalRooms: () => number;
  getTotalUpsellsPrice: () => number;
  getActiveFilterCount: () => number;
}

const initialState = {
  searchParams: null,
  searchResults: [],
  selectedHotel: null,
  selectedRooms: [],
  selectedUpsells: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  hasMoreResults: false,
  currentPage: 1,
  totalResults: 0,
  filters: DEFAULT_FILTERS,
  sortBy: "popularity" as SortOption,
  // ETG Booking State
  bookingHash: null as string | null,
  partnerOrderId: null as string | null,
  orderId: null as string | null,
  itemId: null as string | null,
  orderGroupId: null as string | null,
  orderStatus: "idle" as OrderStatus,
  paymentType: null as PaymentType | null,
  residency: "US",
};

export const useBookingStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setSearchParams: (params) => set({ searchParams: params, currentPage: 1 }),

      setSearchResults: (results, hasMore = false, total = 0) => {
        // Clear old selectedHotel from localStorage to free space
        try {
          localStorage.removeItem("selectedHotel");
        } catch (e) {
          console.warn("Failed to clear localStorage:", e);
        }
        set({ 
          searchResults: results, 
          hasMoreResults: hasMore,
          totalResults: total || results.length,
          currentPage: 1,
        });
      },

      appendSearchResults: (results, hasMore = false) => set((state) => ({
        searchResults: [...state.searchResults, ...results],
        hasMoreResults: hasMore,
        currentPage: state.currentPage + 1,
      })),

      setSelectedHotel: (hotel) => set({ selectedHotel: hotel }),

      addRoom: (room) =>
        set((state) => {
          const existingIndex = state.selectedRooms.findIndex(
            (r) => r.roomId === room.roomId
          );
          if (existingIndex >= 0) {
            const updatedRooms = [...state.selectedRooms];
            updatedRooms[existingIndex] = {
              ...updatedRooms[existingIndex],
              quantity: updatedRooms[existingIndex].quantity + room.quantity,
              totalPrice:
                (updatedRooms[existingIndex].quantity + room.quantity) *
                room.pricePerRoom,
            };
            return { selectedRooms: updatedRooms };
          }
          return { selectedRooms: [...state.selectedRooms, room] };
        }),

      removeRoom: (roomId) =>
        set((state) => ({
          selectedRooms: state.selectedRooms.filter((r) => r.roomId !== roomId),
          // Also remove upsells for this room
          selectedUpsells: state.selectedUpsells.filter((u) => u.roomId !== roomId),
        })),

      updateRoomQuantity: (roomId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              selectedRooms: state.selectedRooms.filter(
                (r) => r.roomId !== roomId
              ),
              // Also remove upsells for this room
              selectedUpsells: state.selectedUpsells.filter((u) => u.roomId !== roomId),
            };
          }
          return {
            selectedRooms: state.selectedRooms.map((r) =>
              r.roomId === roomId
                ? { ...r, quantity, totalPrice: quantity * r.pricePerRoom }
                : r
            ),
          };
        }),

      clearRoomSelection: () => set({ selectedRooms: [], selectedUpsells: [] }),

      setLoading: (loading) => set({ isLoading: loading }),

      setLoadingMore: (loading) => set({ isLoadingMore: loading }),

      setError: (error) => set({ error }),

      setCurrentPage: (page) => set({ currentPage: page }),

      clearSearch: () =>
        set({
          searchParams: null,
          searchResults: [],
          selectedHotel: null,
          selectedRooms: [],
          selectedUpsells: [],
          error: null,
          hasMoreResults: false,
          currentPage: 1,
          totalResults: 0,
        }),

      reset: () => set(initialState),
      
      // Upsell Actions
      addUpsell: (upsell) =>
        set((state) => {
          // Check if already exists
          const exists = state.selectedUpsells.some(
            (u) => u.id === upsell.id && u.roomId === upsell.roomId
          );
          if (exists) return state;
          return { selectedUpsells: [...state.selectedUpsells, upsell] };
        }),

      removeUpsell: (upsellId, roomId) =>
        set((state) => ({
          selectedUpsells: state.selectedUpsells.filter(
            (u) => !(u.id === upsellId && u.roomId === roomId)
          ),
        })),

      clearUpsells: () => set({ selectedUpsells: [] }),

      getUpsellsForRoom: (roomId) => {
        return get().selectedUpsells.filter((u) => u.roomId === roomId);
      },
      
      // Filter & Sort Actions
      setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters },
      })),
      
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),
      
      setSortBy: (sort) => set({ sortBy: sort }),

      // ETG Booking Actions
      setBookingHash: (hash) => set({ bookingHash: hash }),
      
      setPartnerOrderId: (id) => set({ partnerOrderId: id }),
      
      setOrderId: (id) => set({ orderId: id }),
      
      setItemId: (id) => set({ itemId: id }),
      
      setOrderGroupId: (id) => set({ orderGroupId: id }),
      
      setOrderStatus: (status) => set({ orderStatus: status }),
      
      setPaymentType: (type) => set({ paymentType: type }),
      
      setResidency: (residency) => set({ residency }),
      
      clearBookingState: () => set({
        bookingHash: null,
        partnerOrderId: null,
        orderId: null,
        itemId: null,
        orderGroupId: null,
        orderStatus: "idle",
        paymentType: null,
      }),
      
      generateAndSetPartnerOrderId: () => {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        const id = `BK-${timestamp}-${random}`;
        set({ partnerOrderId: id });
        return id;
      },

      getTotalPrice: () => {
        const state = get();
        const roomsTotal = state.selectedRooms.reduce(
          (total, room) => total + room.totalPrice,
          0
        );
        const upsellsTotal = state.selectedUpsells.reduce(
          (total, upsell) => total + upsell.price,
          0
        );
        return roomsTotal + upsellsTotal;
      },

      getTotalRooms: () => {
        const state = get();
        return state.selectedRooms.reduce(
          (total, room) => total + room.quantity,
          0
        );
      },

      getTotalUpsellsPrice: () => {
        const state = get();
        return state.selectedUpsells.reduce(
          (total, upsell) => total + upsell.price,
          0
        );
      },
      
      getActiveFilterCount: () => {
        const { filters } = get();
        let count = 0;
        if (filters.priceMin !== undefined || filters.priceMax !== undefined) count++;
        if (filters.starRatings.length > 0) count++;
        if (filters.freeCancellationOnly) count++;
        if (filters.refundableOnly) count++;
        if (filters.mealPlans.length > 0) count++;
        if (filters.amenities.length > 0) count++;
        if (filters.paymentTypes.length > 0) count++;
        if (filters.rateType !== null) count++;
        if (filters.roomTypes.length > 0) count++;
        if (filters.bedTypes.length > 0) count++;
        return count;
      },
    }),
    {
      name: "booking-storage",
      partialize: (state) => ({
        searchParams: state.searchParams,
        // Exclude searchResults and selectedHotel - too large for localStorage
        filters: state.filters,
        sortBy: state.sortBy,
        residency: state.residency,
      }),
    }
  )
);
