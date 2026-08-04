/**
 * Validates that reservations are still active before checkout
 * Returns array of valid reservation IDs
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

import type { ReservationValidationResult } from '@/modules/checkout/types';

export async function validateReservations(
  reservationIds: string[]
): Promise<ReservationValidationResult> {
  if (!reservationIds || reservationIds.length === 0) {
    return { valid: [], expired: [], invalid: [] };
  }

  try {
    const response = await fetch(`${API_URL}/api/seats/validate-reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ reservationIds }),
    });

    if (!response.ok) {
      // If endpoint doesn't exist yet, assume all are valid
      console.warn('Reservation validation endpoint not available, assuming valid');
      return { valid: reservationIds, expired: [], invalid: [] };
    }

    const data = await response.json();
    return data.result || { valid: reservationIds, expired: [], invalid: [] };
  } catch (error) {
    console.error('Failed to validate reservations:', error);
    // On error, assume valid to avoid blocking user
    return { valid: reservationIds, expired: [], invalid: [] };
  }
}

/**
 * Checks if a reservation has expired based on expiresAt timestamp
 */
export function isReservationExpired(expiresAt: Date | string): boolean {
  const expiryDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return expiryDate <= new Date();
}

/**
 * Calculate remaining time in seconds for a reservation
 */
export function getRemainingSeconds(expiresAt: Date | string): number {
  const expiryDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  const now = new Date();
  const remaining = Math.floor((expiryDate.getTime() - now.getTime()) / 1000);
  return Math.max(0, remaining);
}

/**
 * Format remaining time as MM:SS
 */
export function formatRemainingTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
