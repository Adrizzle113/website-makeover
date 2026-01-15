import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  SearchParams,
  Hotel,
  HotelDetails,
  RoomSelection,
  SearchFilters,
  SortOption,
  SearchType,
  UpsellsState,
} from "@/types/booking";
import { DEFAULT_FILTERS, DEFAULT_UPSELLS_STATE } from "@/types/booking";
import type { 
  OrderStatus, 
  PaymentType,
  PrebookedRoom,
  OrderFormData,
  MultiroomBookingStatus,
} from "@/types/etgBooking";

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

// Display batch size constant
const DISPLAY_BATCH_SIZE = 20;

interface BookingStore {
  // State
  searchParams: SearchParams | null;
  searchResults: Hotel[]; // Displayed hotels (enriched)
  rawSearchResults: Hotel[]; // All hotels from API (unenriched)
  enrichedHotels: Map<string, Hotel>; // Cache of enriched hotel data
  selectedHotel: HotelDetails | null;
  selectedRooms: RoomSelection[];
  selectedUpsells: SelectedUpsell[];
  isLoading: boolean;
  isLoadingMore: boolean;
  isEnriching: boolean;
  error: string | null;
  hasMoreResults: boolean;
  currentPage: number;
  totalResults: number;
  displayedCount: number;
  
  // Search Type State
  searchType: SearchType;
  
  // Filter & Sort State
  filters: SearchFilters;
  sortBy: SortOption;
  
  // Upsells Preferences (for API requests)
  upsellsPreferences: UpsellsState;

  // ETG Booking State (Single Room - Backward Compatible)
  bookingHash: string | null;      // book_hash from prebook
  partnerOrderId: string | null;   // Generated once per booking
  orderId: string | null;          // From order form response
  itemId: string | null;           // From order form response
  orderGroupId: string | null;
  orderStatus: OrderStatus;
  paymentType: PaymentType | null;
  residency: string;

  // Multiroom Booking State
  prebookedRooms: PrebookedRoom[];           // Results from multiroom prebook
  orderForms: OrderFormData[];               // Order forms for each room
  multiroomStatus: MultiroomBookingStatus | null;  // Tracking status of all rooms

  // Actions
  setSearchParams: (params: SearchParams) => void;
  setSearchResults: (results: Hotel[], hasMore?: boolean, total?: number) => void;
  setRawSearchResults: (results: Hotel[], total: number) => void;
  appendToDisplayed: (hotels: Hotel[]) => void;
  appendSearchResults: (results: Hotel[], hasMore?: boolean) => void;
  setEnriching: (loading: boolean) => void;
  getNextBatchToDisplay: () => Hotel[];
  setEnrichedHotels: (hotels: Hotel[]) => void;
  clearEnrichedHotels: () => void;
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
  
  // Search Type Actions
  setSearchType: (type: SearchType) => void;

  // Filter & Sort Actions
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  setSortBy: (sort: SortOption) => void;
  
  // Upsells Preferences Actions
  setUpsellsPreferences: (upsells: UpsellsState) => void;
  resetUpsellsPreferences: () => void;

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
  clearBookingAttemptState: () => void;
  generateAndSetPartnerOrderId: () => string;

  // Multiroom Booking Actions
  setPrebookedRooms: (rooms: PrebookedRoom[]) => void;
  addPrebookedRoom: (room: PrebookedRoom) => void;
  setOrderForms: (forms: OrderFormData[]) => void;
  addOrderForm: (form: OrderFormData) => void;
  setMultiroomStatus: (status: MultiroomBookingStatus | null) => void;
  updateRoomBookingStatus: (roomIndex: number, status: "processing" | "confirmed" | "failed", confirmationNumber?: string) => void;
  isMultiroomBooking: () => boolean;
  clearMultiroomState: () => void;

  // Computed
  getTotalPrice: () => number;
  getTotalRooms: () => number;
  getTotalUpsellsPrice: () => number;
  getActiveFilterCount: () => number;
}

const initialState = {
  searchParams: null,
  searchResults: [],
  rawSearchResults: [],
  enrichedHotels: new Map<string, Hotel>(),
  selectedHotel: null,
  selectedRooms: [],
  selectedUpsells: [],
  isLoading: false,
  isLoadingMore: false,
  isEnriching: false,
  error: null,
  hasMoreResults: false,
  currentPage: 1,
  totalResults: 0,
  displayedCount: 0,
  searchType: "region" as SearchType,
  filters: DEFAULT_FILTERS,
  sortBy: "popularity" as SortOption,
  upsellsPreferences: DEFAULT_UPSELLS_STATE,
  // ETG Booking State (Single Room)
  bookingHash: null as string | null,
  partnerOrderId: null as string | null,
  orderId: null as string | null,
  itemId: null as string | null,
  orderGroupId: null as string | null,
  orderStatus: "idle" as OrderStatus,
  paymentType: null as PaymentType | null,
  residency: "US",
  // Multiroom Booking State
  prebookedRooms: [] as PrebookedRoom[],
  orderForms: [] as OrderFormData[],
  multiroomStatus: null as MultiroomBookingStatus | null,
};

export const useBookingStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      // Ensure filters always have all required fields by merging with defaults
      filters: { ...DEFAULT_FILTERS, ...initialState.filters },

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
          displayedCount: results.length,
        });
      },

      // Store raw results and prepare first batch for display
      setRawSearchResults: (results, total) => {
        try {
          localStorage.removeItem("selectedHotel");
        } catch (e) {
          console.warn("Failed to clear localStorage:", e);
        }
        const firstBatch = results.slice(0, DISPLAY_BATCH_SIZE);
        set({ 
          rawSearchResults: results,
          searchResults: firstBatch, // First batch, will be enriched
          totalResults: total || results.length,
          displayedCount: firstBatch.length,
          hasMoreResults: results.length > DISPLAY_BATCH_SIZE,
          currentPage: 1,
        });
        console.log(`📋 Displaying first ${firstBatch.length} of ${results.length} hotels`);
      },

      // Append enriched hotels to display
      appendToDisplayed: (hotels) => set((state) => {
        const newDisplayed = [...state.searchResults, ...hotels];
        const newCount = newDisplayed.length;
        return {
          searchResults: newDisplayed,
          displayedCount: newCount,
          hasMoreResults: newCount < state.rawSearchResults.length,
        };
      }),

      // Get next batch from raw results
      getNextBatchToDisplay: () => {
        const state = get();
        const start = state.displayedCount;
        const end = start + DISPLAY_BATCH_SIZE;
        return state.rawSearchResults.slice(start, end);
      },

      appendSearchResults: (results, hasMore = false) => set((state) => ({
        searchResults: [...state.searchResults, ...results],
        rawSearchResults: [...state.rawSearchResults, ...results],
        hasMoreResults: hasMore,
        currentPage: state.currentPage + 1,
        displayedCount: state.searchResults.length + results.length,
      })),

      setEnriching: (loading) => set({ isEnriching: loading }),

      setEnrichedHotels: (hotels) => set((state) => {
        const next = new Map(state.enrichedHotels);
        hotels.forEach(h => next.set(h.id, h));
        return { enrichedHotels: next };
      }),

      clearEnrichedHotels: () => set({ enrichedHotels: new Map() }),

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
          rawSearchResults: [],
          enrichedHotels: new Map(),
          selectedHotel: null,
          selectedRooms: [],
          selectedUpsells: [],
          error: null,
          hasMoreResults: false,
          currentPage: 1,
          totalResults: 0,
          displayedCount: 0,
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
      
      // Search Type Actions
      setSearchType: (type) => set({ searchType: type }),

      // Filter & Sort Actions
      setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters },
      })),
      
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),
      
      setSortBy: (sort) => set({ sortBy: sort }),
      
      // Upsells Preferences Actions
      setUpsellsPreferences: (upsells) => set({ upsellsPreferences: upsells }),
      
      resetUpsellsPreferences: () => set({ upsellsPreferences: DEFAULT_UPSELLS_STATE }),

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
        partnerOrderId: null,  // Force regeneration on next booking attempt
        orderId: null,
        itemId: null,
        orderGroupId: null,
        orderStatus: "idle",
        paymentType: null,
        // Also clear multiroom state
        prebookedRooms: [],
        orderForms: [],
        multiroomStatus: null,
      }),

      // Clear only transient booking attempt data (for navigation between hotels)
      // Keeps partnerOrderId as it will be regenerated when needed
      clearBookingAttemptState: () => set({
        bookingHash: null,
        orderId: null,
        itemId: null,
        orderGroupId: null,
        orderStatus: "idle",
        prebookedRooms: [],
        orderForms: [],
        multiroomStatus: null,
      }),
      
      generateAndSetPartnerOrderId: () => {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        const id = `BK-${timestamp}-${random}`;
        set({ partnerOrderId: id });
        return id;
      },

      // Multiroom Booking Actions
      setPrebookedRooms: (rooms) => set({ prebookedRooms: rooms }),
      
      addPrebookedRoom: (room) => set((state) => ({
        prebookedRooms: [...state.prebookedRooms, room],
      })),
      
      setOrderForms: (forms) => set({ orderForms: forms }),
      
      addOrderForm: (form) => set((state) => ({
        orderForms: [...state.orderForms, form],
      })),
      
      setMultiroomStatus: (status) => set({ multiroomStatus: status }),
      
      updateRoomBookingStatus: (roomIndex, status, confirmationNumber) => set((state) => {
        if (!state.multiroomStatus) return state;
        
        const updatedRooms = state.multiroomStatus.rooms.map((room) =>
          room.roomIndex === roomIndex
            ? { ...room, status, confirmation_number: confirmationNumber || room.confirmation_number }
            : room
        );
        
        const successful = updatedRooms.filter(r => r.status === "confirmed").length;
        const failed = updatedRooms.filter(r => r.status === "failed").length;
        
        return {
          multiroomStatus: {
            ...state.multiroomStatus,
            rooms: updatedRooms,
            successful_rooms: successful,
            failed_rooms: failed,
          },
        };
      }),
      
      isMultiroomBooking: () => {
        const state = get();
        // Multiroom if we have multiple rooms selected OR any room has quantity > 1
        const totalRooms = state.selectedRooms.reduce((sum, room) => sum + room.quantity, 0);
        return totalRooms > 1 || state.selectedRooms.length > 1;
      },
      
      clearMultiroomState: () => set({
        prebookedRooms: [],
        orderForms: [],
        multiroomStatus: null,
      }),

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
        const { filters, upsellsPreferences } = get();
        let count = 0;
        if (filters.priceMin !== undefined || filters.priceMax !== undefined) count++;
        if (filters.starRatings?.length > 0) count++;
        if (filters.freeCancellationOnly) count++;
        if (filters.refundableOnly) count++;
        if (filters.mealPlans?.length > 0) count++;
        if (filters.amenities?.length > 0) count++;
        if (filters.paymentTypes?.length > 0) count++;
        if (filters.rateType !== null) count++;
        if (filters.roomTypes?.length > 0) count++;
        if (filters.bedTypes?.length > 0) count++;
        if (filters.hotelKinds?.length > 0) count++;
        // Count upsells preferences
        if (upsellsPreferences.earlyCheckin.enabled || upsellsPreferences.lateCheckout.enabled) count++;
        return count;
      },
    }),
    {
      name: "booking-storage",
      version: 2, // Increment version to trigger migration
      partialize: (state) => ({
        searchParams: state.searchParams,
        searchType: state.searchType,
        // Exclude searchResults and selectedHotel - too large for localStorage
        filters: state.filters,
        sortBy: state.sortBy,
        residency: state.residency,
        upsellsPreferences: state.upsellsPreferences,
      }),
      // Migrate old persisted state to ensure all filter fields exist
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Partial<BookingStore>;
        if (version < 2) {
          // Merge old filters with DEFAULT_FILTERS to add any missing fields
          return {
            ...state,
            filters: { ...DEFAULT_FILTERS, ...(state.filters || {}) },
          };
        }
        return state;
      },
    }
  )
);
