/**
 * Checkout Module Types
 * Centralized type definitions for checkout and payment functionality
 */

import type { SeatBooking } from '@/modules/core/store';

export interface PaymentIntentResponse {
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  error?: string;
}

export interface TicketDataResponse {
  success: boolean;
  reservations?: Array<{
    id: string;
    bookingRef: string;
    trainId: string;
    scheduleId?: string;
    seatId: string;
    travelDate: string;
    priceLkr: number;
    seat: {
      seatNo: string;
      class: string;
    };
  }>;
  error?: string;
}

export interface TicketData {
  bookingId: string;
  from: string;
  to: string;
  date: string;
  time: string;
  trainName: string;
  passengerName: string;
  seatDetails: Array<{
    seatNo: string;
    class: string;
    price: number;
  }>;
  totalPrice: number;
  bookingRef: string;
  qrCodeData?: string;
}

export interface ReservationValidationResult {
  valid: string[];
  expired: string[];
  invalid: string[];
}

// Component Props
export interface CheckoutPanelProps {
  activeCart: SeatBooking[];
  from: string;
  to: string;
  date: string;
  onConfirmPayment: () => void;
  isProcessingPayment: boolean;
}

export interface EnhancedCheckoutPanelProps {
  reservationIds: string[];
  totalAmount: number;
}

export interface StripeCheckoutFormProps {
  clientSecret: string;
  totalAmountLkr: number;
  reservationIds: string[];
  onPaymentSuccess?: (paymentIntentId: string) => void;
  onPaymentError?: (error: string) => void;
}

export interface EnhancedStripeCheckoutFormProps {
  clientSecret: string;
  totalAmountLkr: number;
  reservationIds: string[];
  onPaymentSuccess?: (paymentIntentId: string) => void;
  onPaymentError?: (error: string) => void;
}

export interface SeatExpiryTimerProps {
  expiresAt: Date | string;
  onExpiry?: () => void;
}

export interface PDFTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingRef?: string;
  paymentIntentId?: string;
}

export interface PaymentSuccessAnimationProps {
  bookingRef?: string;
  onComplete?: () => void;
}
