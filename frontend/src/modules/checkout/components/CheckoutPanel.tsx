'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShoppingCart, AlertCircle } from 'lucide-react';
import { useBookingStore } from '@/modules/core/store';
import { MockPaymentForm } from './MockPaymentForm';
import { validateReservations } from '../utils/validateReservations';
import type { SeatBooking } from '@/modules/core/store';
import { TicketReceiptModal } from './TicketReceiptModal';

interface CheckoutPanelProps {
  activeCart: SeatBooking[];
}

export function CheckoutPanel({ activeCart }: CheckoutPanelProps) {
  const router = useRouter();
  const { user, completeBooking, removeSeat, searchQuery } = useBookingStore();
  
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);

  // Extract reservation IDs and calculate total amount from activeCart
  const reservationIds = useMemo(() => 
    activeCart?.map((item) => item.reservationId).filter((id): id is string => id !== undefined) || [],
    [activeCart]
  );
  
  const totalAmount = useMemo(() => 
    activeCart?.reduce((sum, item) => sum + (item.price ?? 0), 0) || 0,
    [activeCart]
  );

  useEffect(() => {
    async function validateBeforePayment() {
      if (!user || !activeCart || activeCart.length === 0) {
        setError('Please authenticate and select seats before proceeding to checkout.');
        setIsValidating(false);
        return;
      }

      // Validate reservations
      try {
        const validation = await validateReservations(reservationIds);
        
        // Remove expired/invalid reservations from cart
        if (validation.expired.length > 0 || validation.invalid.length > 0) {
          const toRemove = [...validation.expired, ...validation.invalid];
          
          // Find seat IDs for expired reservations
          const expiredSeats = activeCart.filter(item => 
            item.reservationId && toRemove.includes(item.reservationId)
          );
          
          // Remove from cart
          expiredSeats.forEach(seat => removeSeat(seat.seatId));
          
          setError(
            `${toRemove.length} seat(s) expired or are no longer available. Please select seats again.`
          );
          setIsValidating(false);
          return;
        }

        // Only proceed with valid reservations
        if (validation.valid.length === 0) {
          setError('No valid reservations found. Please select seats again.');
          setIsValidating(false);
          return;
        }

        setError(null);
      } catch (err) {
        console.error('Validation error:', err);
        setError('Network error. Please check your connection and try again.');
      } finally {
        setIsValidating(false);
      }
    }

    validateBeforePayment();
  }, [activeCart, user, reservationIds, removeSeat]);

  const handlePaymentSuccess = async (identificationNumber: string) => {
    try {
      if (!user || !activeCart || activeCart.length === 0) {
        setError('Invalid booking state. Please try again.');
        return;
      }

      // Generate a mock booking reference
      const bookingRef = `SLR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      
      // Get the first seat's travel date (all should be the same)
      const travelDate = activeCart[0].travelDate;
      const trainId = activeCart[0].trainId;
      
      // Prepare booking data for receipt modal
      const receiptData = {
        bookingRef,
        passengerName: user.name,
        passengerEmail: user.email,
        identificationNumber,
        trainId,
        seats: activeCart.map((seat) => ({
          seatNo: seat.seatNo || 'N/A',
          class: seat.class || 'Standard',
        })),
        origin: searchQuery.origin || 'Origin',
        destination: searchQuery.destination || 'Destination',
        departureTime: searchQuery.time || '', // From search query
        travelDate,
        totalAmount,
      };

      setBookingData(receiptData);
      setShowReceiptModal(true);
    } catch (err) {
      console.error('Ticket generation error:', err);
      setError('Payment successful but ticket generation failed. Please try selecting seats again.');
    }
  };

  const handleReceiptClose = () => {
    setShowReceiptModal(false);
    // Don't redirect - let user stay on seat view
    // Just clear the cart
    completeBooking();
  };

  // Show loading state while validating
  if (isValidating) {
    return (
      <div className="glass-panel p-8 space-y-6 animate-panelIn transition-card">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
              Secure Checkout
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white">Complete Your Booking</h2>
          </div>
        </div>

        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
          <p className="text-slate-400 text-sm mt-4">Validating your reservations...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="glass-panel p-8 space-y-6 animate-panelIn transition-card border-red-500/40">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-red-400">
              Checkout Error
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white">Unable to Process</h2>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
          <p className="text-red-300 text-sm">{error}</p>
        </div>

        <button
          onClick={() => router.push('/')}
          className="w-full h-12 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm transition-all"
        >
          Return to Home
        </button>
      </div>
    );
  }

  // Show payment form
  return (
    <>
      {/* Receipt Modal */}
      {showReceiptModal && bookingData && (
        <TicketReceiptModal
          isOpen={showReceiptModal}
          onClose={handleReceiptClose}
          bookingData={bookingData}
        />
      )}

      <div className="glass-panel p-6 md:p-8 space-y-6 animate-panelIn transition-card border-emerald-500/40">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <ShoppingCart className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
            Secure Checkout
          </span>
          <h2 className="text-lg sm:text-xl font-black text-white">Complete Your Booking</h2>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Selected Seats:</span>
          <span className="text-white font-bold">{activeCart?.length || 0} seat{activeCart?.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Journey:</span>
          <span className="text-white font-mono text-xs">
            {searchQuery.origin} → {searchQuery.destination}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Travel Date:</span>
          <span className="text-white font-mono text-xs">{searchQuery.date}</span>
        </div>
      </div>

      {/* Mock Payment Form */}
      <MockPaymentForm
        totalAmount={totalAmount}
        travelDate={searchQuery.date || activeCart[0]?.travelDate || ''}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={setError}
      />
    </div>
    </>
  );
}
