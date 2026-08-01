import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface SeatBooking {
  trainId: string;
  travelDate: string;
  seatId: string;
}

export interface Station {
  id: string;
  name: string;
  code: string;
}

export interface ScheduleOption {
  id: string;
  value: string;
  label: string;
}

export interface SearchQuery {
  origin: string;
  destination: string;
  date: string;
  time: string;
}

interface BookingState {
  cart: SeatBooking[];
  stations: Station[];
  schedules: ScheduleOption[];
  searchQuery: SearchQuery;
  addSeat: (seat: SeatBooking) => void;
  removeSeat: (seatId: string) => void;
  resetBooking: () => void;
  setSearchQuery: (query: Partial<SearchQuery>) => void;
  setStations: (stations: Station[]) => void;
  setSchedules: (schedules: ScheduleOption[]) => void;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      cart: [],
      stations: [],
      schedules: [],
      searchQuery: {
        origin: '',
        destination: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
      },
      addSeat: (seat) => {
        const { cart } = get();
        if (cart.length >= 6) {
          console.warn('[BOOKING_STORE] Cannot add more than 6 seats per session.');
          return;
        }
        set({ cart: [...cart, seat] });
        console.log('[BOOKING_STORE] Seat added:', seat);
      },
      removeSeat: (seatId) => {
        set((state) => ({
          cart: state.cart.filter((s) => s.seatId !== seatId),
        }));
        console.log('[BOOKING_STORE] Seat removed:', seatId);
      },
      resetBooking: () => {
        set({
          cart: [],
          stations: [],
          schedules: [],
          searchQuery: {
            origin: '',
            destination: '',
            date: new Date().toISOString().split('T')[0],
            time: '',
          },
        });
        console.log('[BOOKING_STORE] Booking, stations, schedules & search query reset.');
      },
      setSearchQuery: (query) => {
        set((state) => ({
          searchQuery: { ...state.searchQuery, ...query },
        }));
        console.log('[SEARCH_STORE] Search query updated:', get().searchQuery);
      },
      setStations: (fetchedStations) => {
        const currentQuery = get().searchQuery;
        const initialOrigin = currentQuery.origin || (fetchedStations[0]?.code ?? '');
        const initialDestination = currentQuery.destination || (fetchedStations[1]?.code ?? fetchedStations[0]?.code ?? '');

        set({
          stations: fetchedStations,
          searchQuery: {
            ...currentQuery,
            origin: initialOrigin,
            destination: initialDestination,
          },
        });
        console.log('[SEARCH_STORE] Stations synced from backend:', fetchedStations.length, { initialOrigin, initialDestination });
      },
      setSchedules: (fetchedSchedules) => {
        const currentQuery = get().searchQuery;
        const initialTime = currentQuery.time || (fetchedSchedules[0]?.value ?? '');

        set({
          schedules: fetchedSchedules,
          searchQuery: {
            ...currentQuery,
            time: initialTime,
          },
        });
        console.log('[SEARCH_STORE] Schedules synced from backend:', fetchedSchedules.length, { initialTime });
      },
    }),
    {
      name: 'booking-storage',
      storage: createJSONStorage(() => sessionStorage),
      // Only persist the cart — search fields always start fresh every session
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);
