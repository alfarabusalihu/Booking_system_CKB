const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

import type {
  RegisterInput,
  LoginInput,
  AuthResponse,
} from '@/modules/auth/types';

export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important for cookies
    body: JSON.stringify(input),
  });

  return response.json();
}

export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important for cookies
    body: JSON.stringify(input),
  });

  return response.json();
}

export async function getCurrentUser(): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    method: 'GET',
    credentials: 'include',
  });

  return response.json();
}

export async function logoutUser(): Promise<{ success: boolean }> {
  const response = await fetch(`${API_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  return response.json();
}
