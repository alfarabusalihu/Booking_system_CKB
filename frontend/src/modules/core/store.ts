import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface SeatBooking {
  trainId: string;
  scheduleId?: string;
  travelDate: string;
  seatId: string;
  seatNo?: string;
  class?: string;
  price?: number;
  reservationId?: string;
}

export interface Station {
  id: string;
  name: string;
  code: string;
}

export interface ScheduleOption {
  id: string;
  trainId: string;
  trainName: string;
  origin: string;
  destination: string;
  originName?: string;
  destinationName?: string;
  departureTime?: string;
  arrivalTime?: string;
  value: string;
  label: string;
}

export interface SearchQuery {
  origin: string;
  destination: string;
  date: string;
  time: string;
}

export interface User {
  name: string;
  email: string;
}

const freshSearchQuery = (): SearchQuery => ({
  origin: '',
  destination: '',
  date: new Date().toISOString().split('T')[0],
  time: '',
});

const logStore = (message: string, payload?: unknown) => {
  if (payload !== undefined) {
    console.log(`[BOOKING_STORE] ${message}`, payload);
    return;
  }
  console.log(`[BOOKING_STORE] ${message}`);
};

interface BookingState {
  cart: SeatBooking[];
  stations: Station[];
  schedules: ScheduleOption[];
  seatStats: {
    total: number;
    available: number;
    booked: number;
  };
  searchQuery: SearchQuery;
  user: User | null;
  addSeat: (seat: SeatBooking) => void;
  removeSeat: (seatId: string) => void;
  resetBooking: () => void;
  completeBooking: () => void;
  setSearchQuery: (query: Partial<SearchQuery>) => void;
  setStations: (stations: Station[]) => void;
  setSchedules: (schedules: ScheduleOption[]) => void;
  setSeatStats: (stats: { total: number; available: number; booked: number }) => void;
  loginUser: (user: User) => void;
  logoutUser: () => void;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      cart: [],
      stations: [],
      schedules: [],
      seatStats: {
        total: 0,
        available: 0,
        booked: 0,
      },
      searchQuery: freshSearchQuery(),
      user: null,
      addSeat: (seat) => {
        const { cart } = get();
        if (cart.length >= 6) {
          logStore('addSeat rejected — cart limit reached (6 seats max)');
          return;
        }
        logStore('addSeat', { seatId: seat.seatId, seatNo: seat.seatNo });
        set({ cart: [...cart, seat] });
      },
      removeSeat: (seatId) => {
        logStore('removeSeat', { seatId });
        set((state) => ({
          cart: state.cart.filter((s) => s.seatId !== seatId),
        }));
      },
      resetBooking: () => {
        logStore('resetBooking — clearing cart, search, and seat stats');
        set({
          cart: [],
          stations: [],
          schedules: [],
          seatStats: {
            total: 0,
            available: 0,
            booked: 0,
          },
          searchQuery: freshSearchQuery(),
        });
      },
      completeBooking: () => {
        logStore('completeBooking — full session wipe after ticket issuance');
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('booking_session_id');
          sessionStorage.removeItem('booking-storage');
        }
        set({
          cart: [],
          stations: [],
          schedules: [],
          seatStats: {
            total: 0,
            available: 0,
            booked: 0,
          },
          searchQuery: freshSearchQuery(),
          user: null,
        });
      },
      setSearchQuery: (query) => {
        logStore('setSearchQuery', query);
        set((state) => ({
          searchQuery: { ...state.searchQuery, ...query },
        }));
      },
      setStations: (fetchedStations) => {
        logStore('setStations', { count: fetchedStations.length });
        set({ stations: fetchedStations });
      },
      setSchedules: (fetchedSchedules) => {
        logStore('setSchedules', { count: fetchedSchedules.length });
        set({ schedules: fetchedSchedules });
      },
      setSeatStats: (stats) => {
        logStore('setSeatStats', stats);
        set({ seatStats: stats });
      },
      loginUser: (user) => {
        logStore('loginUser', { email: user.email });
        set({ user });
      },
      logoutUser: () => {
        logStore('logoutUser — clearing session and cart');
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('booking_session_id');
          sessionStorage.removeItem('booking-storage');
        }
        set({
          user: null,
          cart: [],
          seatStats: {
            total: 0,
            available: 0,
            booked: 0,
          },
          searchQuery: freshSearchQuery(),
        });
      },
    }),
    {
      name: 'booking-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        cart: state.cart,
        searchQuery: state.searchQuery,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          logStore('rehydrated from sessionStorage', {
            cartSize: state.cart.length,
            user: state.user?.email ?? null,
          });
        }
      },
    }
  )
);
