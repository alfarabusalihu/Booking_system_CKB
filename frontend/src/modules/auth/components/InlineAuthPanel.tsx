'use client';

import { useState } from 'react';
import {
  ShieldCheck,
  LogIn,
  UserPlus,
  Armchair,
  ChevronRight,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { useBookingStore } from '@/modules/core/store';
import { registerUser, loginUser } from '@/modules/auth/api';
import type { InlineAuthPanelProps } from '@/modules/auth/types';

export function InlineAuthPanel({ pendingSeatNos = [], onAuthComplete }: InlineAuthPanelProps) {
  const { loginUser: setUser } = useBookingStore();

  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [authTouched, setAuthTouched] = useState<Record<'name' | 'email' | 'password', boolean>>({
    name: false,
    email: false,
    password: false,
  });

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const authErrors = {
    name: authTab === 'signup' && name.trim().length < 2 ? 'Enter at least 2 characters for the passenger name.' : '',
    email: !email.trim() ? 'Email address is required.' : !emailIsValid ? 'Enter a valid email address.' : '',
    password: !password ? 'Password is required.' : password.length < 6 ? 'Password must be at least 6 characters.' : '',
  };

  const markAuthTouched = (field: keyof typeof authTouched) => {
    setAuthTouched((prev) => ({ ...prev, [field]: true }));
  };
  const showAuthError = (field: keyof typeof authTouched) => authTouched[field] && authErrors[field];

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    
    const visibleErrors = authTab === 'signup' ? authErrors : { ...authErrors, name: '' };
    if (Object.values(visibleErrors).some(Boolean)) {
      setAuthTouched({ name: true, email: true, password: true });
      return;
    }

    setIsSubmitting(true);

    try {
      let response;
      
      if (authTab === 'signup') {
        response = await registerUser({
          fullName: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          password,
        });
      } else {
        response = await loginUser({
          email: email.trim(),
          password,
        });
      }

      if (response.success && response.user) {
        // Update Zustand store
        setUser({
          name: response.user.fullName,
          email: response.user.email,
        });
        
        if (onAuthComplete) await onAuthComplete();
      } else {
        setServerError(response.error || 'Authentication failed. Please try again.');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setServerError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel p-6 md:p-8 space-y-6 animate-panelIn transition-card border-indigo-500/40">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-400">
              Authentication Required
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white">Log in to Hold & Book Seats</h2>
          </div>
        </div>

        <div className="relative grid grid-cols-2 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0 self-start overflow-hidden">
          <span
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md transition-transform duration-300 ease-out ${
              authTab === 'login'
                ? 'translate-x-0 bg-indigo-600'
                : 'translate-x-[calc(100%+4px)] bg-emerald-600'
            }`}
          />
          <button
            type="button"
            onClick={() => {
              setAuthTab('login');
              setServerError('');
            }}
            className={`relative z-10 px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
              authTab === 'login' ? 'text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 inline mr-1.5" />
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthTab('signup');
              setServerError('');
            }}
            className={`relative z-10 px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
              authTab === 'signup' ? 'text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 inline mr-1.5" />
            Sign Up
          </button>
        </div>
      </div>

      {pendingSeatNos.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-2.5">
          <Armchair className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Sign in below to hold{' '}
            <strong className="text-white font-mono">{pendingSeatNos.join(', ')}</strong> for 10 minutes.
          </span>
        </div>
      )}

      {serverError && (
        <div className={`p-3.5 rounded-2xl border text-xs font-bold flex items-start gap-2.5 ${
          serverError.includes('already exists')
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
            : 'bg-red-500/10 border-red-500/20 text-red-300'
        }`}>
          <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
            serverError.includes('already exists') ? 'text-amber-400' : 'text-red-400'
          }`} />
          <div className="flex-1">
            <span>{serverError}</span>
            {serverError.includes('already exists') && (
              <button
                type="button"
                onClick={() => {
                  setAuthTab('login');
                  setServerError('');
                }}
                className="block mt-1.5 text-amber-400 hover:text-amber-300 underline font-normal"
              >
                Log in with this email instead
              </button>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleAuthSubmit} className="space-y-4" noValidate>
        {authTab === 'signup' && (
          <>
            <div className="space-y-1.5 animate-panelIn">
              <label className="field-label text-slate-400">Full Name</label>
              <input
                type="text"
                value={name}
                onBlur={() => markAuthTouched('name')}
                onChange={(e) => {
                  markAuthTouched('name');
                  setName(e.target.value);
                }}
                placeholder="Kasun Perera"
                className="input-select-field text-sm"
                disabled={isSubmitting}
              />
              {showAuthError('name') && <p className="field-error">{authErrors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="field-label text-slate-400">Phone Number (Optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+94 71 234 5678"
                className="input-select-field text-sm"
                disabled={isSubmitting}
              />
            </div>
          </>
        )}

        <div className="space-y-1.5">
          <label className="field-label text-slate-400">Email Address</label>
          <input
            type="email"
            value={email}
            onBlur={() => markAuthTouched('email')}
            onChange={(e) => {
              markAuthTouched('email');
              setEmail(e.target.value);
            }}
            placeholder="kasun@railways.lk"
            className="input-select-field text-sm"
            disabled={isSubmitting}
          />
          {showAuthError('email') && <p className="field-error">{authErrors.email}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="field-label text-slate-400">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onBlur={() => markAuthTouched('password')}
              onChange={(e) => {
                markAuthTouched('password');
                setPassword(e.target.value);
              }}
              placeholder="••••••••"
              className="input-select-field text-sm pr-10"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors focus:outline-none"
              tabIndex={-1}
              disabled={isSubmitting}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {showAuthError('password') && <p className="field-error">{authErrors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-13 mt-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>Processing...</>
          ) : (
            <>
              {authTab === 'login' ? 'Sign In & Lock Selected Seats' : 'Create Account & Lock Seats'}
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
