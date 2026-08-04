const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface PaymentIntentResponse {
  success: boolean;
  clientSecret?: string;
  totalAmountLkr?: number;
  paymentIntentId?: string;
  error?: string;
}

export interface TicketDataResponse {
  success: boolean;
  reservations?: Array<{
    id: string;
    bookingRef: string;
    trainId: string;
    seatNo: string;
    class: string;
    travelDate: string;
    priceLkr: number;
  }>;
  error?: string;
}

export async function createPaymentIntent(
  reservationIds: string[]
): Promise<PaymentIntentResponse> {
  const response = await fetch(`${API_URL}/api/checkout/create-payment-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ reservationIds }),
  });

  return response.json();
}

export async function getTicketData(
  reservationIds: string[]
): Promise<TicketDataResponse> {
  const response = await fetch(`${API_URL}/api/checkout/ticket-data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ reservationIds }),
  });

  return response.json();
}
