import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface SeatBooking {
  trainId: string;
  travelDate: string;
  seatId: string;
}

interface BookingState {
  cart: SeatBooking[];
  addSeat: (seat: SeatBooking) => void;
  removeSeat: (seatId: string) => void;
  resetBooking: () => void;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      cart: [],
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
        set({ cart: [] });
        console.log('[BOOKING_STORE] Booking reset.');
      },
    }),
    {
      name: 'booking-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
