import crypto from 'crypto';

/**
 * Generate a secure random token for email verification
 * @param length Length of the token (default: 32 bytes = 64 hex characters)
 * @returns Hex-encoded random token
 */
export function generateVerificationToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a token for storage in database
 * @param token Plain token to hash
 * @returns SHA256 hash of the token
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a token expiration date
 * @param hoursFromNow Number of hours until expiration (default: 24)
 * @returns Date object representing expiration time
 */
export function getTokenExpiration(hoursFromNow: number = 24): Date {
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + hoursFromNow);
  return expiration;
}

/**
 * Check if a token has expired
 * @param expiresAt Expiration date
 * @returns true if token has expired, false otherwise
 */
export function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  return new Date() > expiresAt;
}
