import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  SearchParams,
  Hotel,
  HotelDetails,
  RoomSelection,
} from "@/types/booking";

interface BookingStore {
  // State
  searchParams: SearchParams | null;
  searchResults: Hotel[];
  selectedHotel: HotelDetails | null;
  selectedRooms: RoomSelection[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setSearchParams: (params: SearchParams) => void;
  setSearchResults: (results: Hotel[]) => void;
  setSelectedHotel: (hotel: HotelDetails | null) => void;
  addRoom: (room: RoomSelection) => void;
  removeRoom: (roomId: string) => void;
  updateRoomQuantity: (roomId: string, quantity: number) => void;
  clearRoomSelection: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearSearch: () => void;
  reset: () => void;

  // Computed
  getTotalPrice: () => number;
  getTotalRooms: () => number;
}

const initialState = {
  searchParams: null,
  searchResults: [],
  selectedHotel: null,
  selectedRooms: [],
  isLoading: false,
  error: null,
};

export const useBookingStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setSearchParams: (params) => set({ searchParams: params }),

      setSearchResults: (results) => set({ searchResults: results }),

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

      setError: (error) => set({ error }),

      clearSearch: () =>
        set({
          searchResults: [],
          selectedHotel: null,
          selectedRooms: [],
          error: null,
        }),

      reset: () => set(initialState),

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
    }),
    {
      name: "booking-storage",
      partialize: (state) => ({
        searchParams: state.searchParams,
        searchResults: state.searchResults,
      }),
    }
  )
);
