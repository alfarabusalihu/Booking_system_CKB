'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShoppingCart, AlertCircle, Clock, Ticket } from 'lucide-react';
import { useBookingStore } from '@/modules/core/store';
import { createPaymentIntent, getTicketData } from '../api';
import { EnhancedStripeCheckoutForm } from './EnhancedStripeCheckoutForm';
import { generateAndDownloadTicket } from '../utils/ticketGenerator';

interface EnhancedCheckoutPanelProps {
  reservationIds: string[];
  totalAmount: number;
  lockExpiry?: Date;
}

export function EnhancedCheckoutPanel({
  reservationIds,
  totalAmount,
  lockExpiry,
}: EnhancedCheckoutPanelProps) {
  const router = useRouter();
  const { user, cart, completeBooking, searchQuery } = useBookingStore();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(600); // 10 minutes in seconds

  // Countdown Timer
  useEffect(() => {
    if (!lockExpiry) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(lockExpiry).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));

      setTimeRemaining(remaining);

      if (remaining === 0) {
        setError('Your seat reservation has expired. Please start a new booking.');
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockExpiry]);

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize payment
  useEffect(() => {
    async function initializePayment() {
      if (!user || reservationIds.length === 0) {
        setError('Please authenticate and select seats before proceeding to checkout.');
        setIsLoadingPayment(false);
        return;
      }

      try {
        const response = await createPaymentIntent(reservationIds);

        if (response.success && response.clientSecret) {
          setClientSecret(response.clientSecret);
          setPaymentIntentId(response.paymentIntentId || null);
          setError(null);
        } else {
          setError(response.error || 'Failed to initialize payment. Please try again.');
        }
      } catch (err) {
        console.error('Payment initialization error:', err);
        setError('Network error. Please check your connection and try again.');
      } finally {
        setIsLoadingPayment(false);
      }
    }

    initializePayment();
  }, [reservationIds, user]);

  const handlePaymentSuccess = async () => {
    try {
      // Fetch confirmed ticket data from backend
      const ticketResponse = await getTicketData(reservationIds);

      if (ticketResponse.success && ticketResponse.reservations) {
        const reservations = ticketResponse.reservations;

        // Generate and download PDF ticket
        await generateAndDownloadTicket({
          bookingRef: reservations[0].bookingRef,
          passengerName: user?.name || 'Passenger',
          passengerEmail: user?.email || '',
          trainId: reservations[0].trainId,
          seats: reservations.map((r) => ({
            seatNo: r.seatNo,
            class: r.class,
          })),
          origin: searchQuery.origin || 'Origin',
          destination: searchQuery.destination || 'Destination',
          travelDate: reservations[0].travelDate,
          totalAmount: totalAmount,
        });

        // Clear cart and redirect home
        completeBooking();
        router.push('/?success=true');
      } else {
        throw new Error('Failed to fetch ticket data');
      }
    } catch (err) {
      console.error('Ticket generation error:', err);
      setError(
        'Payment successful but ticket generation failed. Please contact support with your booking reference.'
      );
    }
  };

  if (isLoadingPayment) {
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
          <p className="text-slate-400 text-sm mt-4">Initializing secure payment...</p>
        </div>
      </div>
    );
  }

  if (error && !clientSecret) {
    return (
      <div className="glass-panel p-8 space-y-6 animate-panelIn transition-card border-red-500/40">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-red-400">
              Payment Error
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white">Unable to Process Payment</h2>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
          <p className="text-red-300 text-sm">{error}</p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full h-12 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm transition-all"
        >
          Retry Payment
        </button>
      </div>
    );
  }

  const isExpiringSoon = timeRemaining < 120; // Less than 2 minutes
  const isExpired = timeRemaining === 0;

  return (
    <div className="glass-panel p-6 md:p-8 space-y-6 animate-panelIn transition-card border-emerald-500/40">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <ShoppingCart className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
            Secure Checkout
          </span>
          <h2 className="text-lg sm:text-xl font-black text-white">Complete Your Booking</h2>
        </div>
      </div>

      {/* Countdown Timer */}
      {lockExpiry && !isExpired && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
            isExpiringSoon
              ? 'bg-amber-500/10 border-amber-500/30 animate-pulse'
              : 'bg-slate-900/50 border-slate-800'
          }`}
        >
          <Clock
            className={`w-5 h-5 ${isExpiringSoon ? 'text-amber-400' : 'text-slate-400'}`}
          />
          <div className="flex-1">
            <p
              className={`text-xs font-bold uppercase tracking-wider ${
                isExpiringSoon ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              {isExpiringSoon ? 'Hurry! Time Running Out' : 'Seats Reserved For'}
            </p>
            <p
              className={`text-2xl font-black font-mono ${
                isExpiringSoon ? 'text-amber-300' : 'text-white'
              }`}
            >
              {formatTime(timeRemaining)}
            </p>
          </div>
          {isExpiringSoon && (
            <div className="text-xs text-amber-300 font-bold">
              Complete payment now!
            </div>
          )}
        </div>
      )}

      {/* Booking Summary */}
      <div className="space-y-3">
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Ticket className="w-4 h-4" />
            <span>Booking Summary</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-sm">Selected Seats</span>
            <span className="text-white font-black text-lg">{cart.length}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {cart.slice(0, 6).map((seat, idx) => (
              <div
                key={idx}
                className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg"
              >
                <span className="text-indigo-300 font-bold text-xs">{seat.seatNo || `Seat ${idx + 1}`}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Reservations</span>
              <span className="text-slate-300 font-mono text-xs">{reservationIds.length} active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stripe Checkout Form */}
      {clientSecret && !isExpired && (
        <EnhancedStripeCheckoutForm
          clientSecret={clientSecret}
          totalAmountLkr={totalAmount}
          seatCount={cart.length}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
