'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Train, User, LogOut, Loader2 } from 'lucide-react';
import { useBookingStore } from '../store';
import { getCurrentUser, logoutUser } from '@/modules/auth/api';

export function Navbar() {
  const router = useRouter();
  const { user, loginUser, logoutUser: clearUser } = useBookingStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    async function checkAuth() {
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
        setIsLoading(false);
      }
    }

    if (!user) {
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, [user, loginUser]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      clearUser();
      router.push('/');
      setShowUserMenu(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Train className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-white font-black text-lg">Sri Lanka Railways</span>
              <p className="text-xs text-slate-400 -mt-1">Online Booking</p>
            </div>
          </button>

          {/* User Section */}
          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="flex items-center gap-2 px-4 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                <span className="text-sm text-slate-400">Loading...</span>
              </div>
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 transition-all group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-bold text-white">{user.name}</p>
                    <p className="text-xs text-slate-400 -mt-0.5">{user.email}</p>
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 border-b border-slate-800">
                      <p className="text-sm font-bold text-white truncate">{user.name}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400 hidden sm:inline">Not signed in</span>
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </nav>
  );
}
