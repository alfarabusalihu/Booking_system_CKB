import { create } from 'zustand';

export interface SeatBooking {
  trainId: string;
  scheduleId?: string;
  travelDate: string;
  seatId: string;
  seatNo?: string;
  class?: string;
  price?: number;
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
  setSearchQuery: (query: Partial<SearchQuery>) => void;
  setStations: (stations: Station[]) => void;
  setSchedules: (schedules: ScheduleOption[]) => void;
  setSeatStats: (stats: { total: number; available: number; booked: number }) => void;
  loginUser: (user: User) => void;
  logoutUser: () => void;
}

export const useBookingStore = create<BookingState>()(
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
          return;
        }
        set({ cart: [...cart, seat] });
      },
      removeSeat: (seatId) => {
        set((state) => ({
          cart: state.cart.filter((s) => s.seatId !== seatId),
        }));
      },
      resetBooking: () => {
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
      setSearchQuery: (query) => {
        set((state) => ({
          searchQuery: { ...state.searchQuery, ...query },
        }));
      },
      setStations: (fetchedStations) => {
        set({
          stations: fetchedStations,
        });
      },
      setSchedules: (fetchedSchedules) => {
        set({
          schedules: fetchedSchedules,
        });
      },
      setSeatStats: (stats) => {
        set({ seatStats: stats });
      },
      loginUser: (user) => {
        set({ user });
      },
      logoutUser: () => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('booking-storage');
          sessionStorage.removeItem('booking_session_id');
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
    })
);
