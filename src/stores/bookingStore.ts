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

interface BookingStore {
  // State
  searchParams: SearchParams | null;
  searchResults: Hotel[];
  selectedHotel: HotelDetails | null;
  selectedRooms: RoomSelection[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMoreResults: boolean;
  currentPage: number;
  totalResults: number;
  
  // Filter & Sort State
  filters: SearchFilters;
  sortBy: SortOption;

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
  
  // Filter & Sort Actions
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  setSortBy: (sort: SortOption) => void;

  // Computed
  getTotalPrice: () => number;
  getTotalRooms: () => number;
  getActiveFilterCount: () => number;
}

const initialState = {
  searchParams: null,
  searchResults: [],
  selectedHotel: null,
  selectedRooms: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  hasMoreResults: false,
  currentPage: 1,
  totalResults: 0,
  filters: DEFAULT_FILTERS,
  sortBy: "popularity" as SortOption,
};

export const useBookingStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setSearchParams: (params) => set({ searchParams: params, currentPage: 1 }),

      setSearchResults: (results, hasMore = false, total = 0) => set({ 
        searchResults: results, 
        hasMoreResults: hasMore,
        totalResults: total || results.length,
        currentPage: 1,
      }),

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
        })),

      updateRoomQuantity: (roomId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              selectedRooms: state.selectedRooms.filter(
                (r) => r.roomId !== roomId
              ),
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

      clearRoomSelection: () => set({ selectedRooms: [] }),

      setLoading: (loading) => set({ isLoading: loading }),

      setLoadingMore: (loading) => set({ isLoadingMore: loading }),

      setError: (error) => set({ error }),

      setCurrentPage: (page) => set({ currentPage: page }),

      clearSearch: () =>
        set({
          searchResults: [],
          selectedHotel: null,
          selectedRooms: [],
          error: null,
          hasMoreResults: false,
          currentPage: 1,
          totalResults: 0,
        }),

      reset: () => set(initialState),
      
      // Filter & Sort Actions
      setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters },
      })),
      
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),
      
      setSortBy: (sort) => set({ sortBy: sort }),

      getTotalPrice: () => {
        const state = get();
        return state.selectedRooms.reduce(
          (total, room) => total + room.totalPrice,
          0
        );
      },

      getTotalRooms: () => {
        const state = get();
        return state.selectedRooms.reduce(
          (total, room) => total + room.quantity,
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
        searchResults: state.searchResults,
        selectedHotel: state.selectedHotel,
        filters: state.filters,
        sortBy: state.sortBy,
      }),
    }
  )
);
