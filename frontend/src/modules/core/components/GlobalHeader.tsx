'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Train, LogOut, ChevronDown, Loader2 } from 'lucide-react';
import { useBookingStore } from '@/modules/core/store';
import { releaseSeatAction } from '@/modules/seat-booking/actions';
import { getCurrentUser, logoutUser as logoutUserApi } from '@/modules/auth/api';

function getSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('booking_session_id');
}

export function GlobalHeader() {
  const { user, cart, logoutUser, loginUser } = useBookingStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const clearSession = useCallback(async () => {
    const sessionId = getSessionId();
    if (sessionId) {
      void Promise.allSettled(
        cart.map((item) =>
          releaseSeatAction({
            trainId: item.trainId,
            seatId: item.seatId,
            date: item.travelDate,
            sessionId,
          })
        )
      );
    }
    
    // Call backend logout to clear HTTP-only cookie
    try {
      await logoutUserApi();
    } catch (error) {
      console.error('Logout API error:', error);
    }
    
    logoutUser();
    setDropdownOpen(false);
  }, [cart, logoutUser]);

  // Check authentication status on mount
  useEffect(() => {
    async function checkAuth() {
      if (user) {
        setIsLoadingAuth(false);
        return;
      }

      try {
        const response = await getCurrentUser();
        if (response.success && response.user) {
          loginUser({
            name: response.user.fullName,
            email: response.user.email,
          });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoadingAuth(false);
      }
    }

    checkAuth();
  }, [user, loginUser]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [dropdownOpen]);

  useEffect(() => {
    if (!user) return;

    let timeoutId = window.setTimeout(clearSession, 15 * 60 * 1000);
    const resetTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(clearSession, 15 * 60 * 1000);
    };
    const events = ['pointerdown', 'keydown', 'scroll', 'visibilitychange'];
    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));

    return () => {
      window.clearTimeout(timeoutId);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [user, clearSession]);

  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl text-white px-4 sm:px-6 lg:px-12 py-3 flex items-center justify-between sticky top-0 z-50 shadow-lg shadow-black/40">
      {/* Far Left: System Branding */}
      <Link href="/" className="flex items-center gap-3 group cursor-pointer">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-indigo-600 border border-emerald-400/30 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-all">
          <Train className="w-5 h-5 text-white" />
        </div>
        <div className="hidden sm:block">
          <div className="flex items-center gap-1.5 text-xs font-black tracking-widest text-emerald-400 uppercase">
            <span>Sri Lanka Railway</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <span className="text-base font-extrabold text-white tracking-tight group-hover:text-slate-200 transition-colors">
            Express Reserve
          </span>
        </div>
      </Link>

      {/* Far Right: User menu */}
      <div className="flex items-center gap-4">
        {isLoadingAuth ? (
          <div className="flex items-center gap-2 px-4 py-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm hidden sm:inline">Loading...</span>
          </div>
        ) : user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2.5 bg-slate-900 hover:bg-slate-800/80 border border-slate-700/60 px-4 py-2 rounded-2xl transition-all cursor-pointer shadow-sm"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 font-black text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline text-sm font-bold text-slate-100">{user.name}</span>
              <ChevronDown className="hidden sm:block w-4 h-4 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700/80 rounded-2xl p-2 shadow-2xl z-50 animate-fadeIn">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-xs font-bold text-white truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={clearSession}
                  className="w-full text-left px-3 py-2 mt-1 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-500 hidden sm:block">
            Select seats to sign in
          </div>
        )}
      </div>
    </header>
  );
}
