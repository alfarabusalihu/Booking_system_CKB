/**
 * Authentication Module Types
 * Centralized type definitions for auth-related functionality
 */

export interface RegisterInput {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
  };
  error?: string;
}

export interface EmailAvailabilityResponse {
  success: boolean;
  available?: boolean;
  message?: string;
  error?: string;
}

export interface InlineAuthPanelProps {
  pendingSeatNos?: string[];
  onAuthComplete?: () => void | Promise<void>;
}

export interface EmailVerificationBannerProps {
  email: string;
  onDismiss?: () => void;
}
