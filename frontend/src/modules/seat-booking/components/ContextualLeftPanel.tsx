'use client';

import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Clock,
  Ticket,
  CreditCard,
  QrCode,
  Building2,
  LogIn,
  UserPlus,
  Armchair,
  CheckCircle2,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useBookingStore } from '@/modules/core/store';
import { PDFTicketModal } from '@/modules/checkout/components/PDFTicketModal';

interface ContextualLeftPanelProps {
  pendingSeatNos?: string[];
  showAuthOverride?: boolean;
  onClearPendingSeat?: () => void;
  onAuthComplete?: () => void | Promise<void>;
  from: string;
  to: string;
  date: string;
  trainId: string;
  scheduleId?: string;
}

export function ContextualLeftPanel({
  pendingSeatNos = [],
  showAuthOverride = false,
  onClearPendingSeat,
  onAuthComplete,
  from,
  to,
  date,
  trainId,
  scheduleId,
}: ContextualLeftPanelProps) {
  const { cart, user, loginUser } = useBookingStore();
  const activeCart = cart.filter((item) => item.trainId === trainId && (!scheduleId || item.scheduleId === scheduleId));

  // Auth form state
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authTouched, setAuthTouched] = useState<Record<'name' | 'email' | 'password', boolean>>({
    name: false,
    email: false,
    password: false,
  });

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'qr' | 'netbank'>('card');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [issuedBookingData, setIssuedBookingData] = useState<{
    bookingId: string;
    from: string;
    to: string;
    date: string;
    passengerName: string;
    passengerEmail: string;
    seats: typeof activeCart;
    totalPaid: number;
  } | null>(null);

  // 10-minute hold timer
  const [holdTime, setHoldTime] = useState<number>(600);

  useEffect(() => {
    if (activeCart.length === 0) {
      const timeout = window.setTimeout(() => setHoldTime(600), 0);
      return () => window.clearTimeout(timeout);
    }

    const timer = setInterval(() => {
      setHoldTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [activeCart.length]);

  const minutes = Math.floor(holdTime / 60);
  const seconds = holdTime % 60;
  const formattedHoldTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalAmount = activeCart.reduce((sum, item) => sum + (item.price ?? 0), 0);
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
    const visibleErrors = authTab === 'signup' ? authErrors : { ...authErrors, name: '' };
    if (Object.values(visibleErrors).some(Boolean)) {
      setAuthTouched({ name: true, email: true, password: true });
      return;
    }
    const displayName = name.trim() || (email ? email.split('@')[0] : 'Kasun Perera');
    loginUser({
      name: displayName || 'Kasun Perera',
      email: email || 'kasun@railways.lk',
    });
    if (onClearPendingSeat) onClearPendingSeat();
    if (onAuthComplete) await onAuthComplete();
  };

  const handleConfirmPayment = () => {
    setIsProcessingPayment(true);

    setTimeout(() => {
      setIsProcessingPayment(false);
      const bookingData = {
        bookingId: 'SLR-' + Math.floor(100000 + Math.random() * 900000),
        from,
        to,
        date,
        passengerName: user?.name || 'Kasun Perera',
        passengerEmail: user?.email || 'kasun@railways.lk',
        seats: [...activeCart],
        totalPaid: totalAmount,
      };

      setIssuedBookingData(bookingData);
      setShowTicketModal(true);
    }, 1200);
  };

  const handleCloseTicketModal = () => {
    setShowTicketModal(false);
  };

  // Determine current mode of Left Panel
  const isGuestMode = !user;
  const hasCart = activeCart.length > 0;
  const showAuthPanel = isGuestMode && (hasCart || pendingSeatNos.length > 0 || showAuthOverride);

  return (
    <>
      {/* Ticket Modal Overlay */}
      {issuedBookingData && (
        <PDFTicketModal
          isOpen={showTicketModal}
          onClose={handleCloseTicketModal}
          bookingData={issuedBookingData}
        />
      )}

      <div className="w-full h-full flex flex-col gap-6">

        {/* ── STATE A: Guest Auth Form ────────────────────────────────────────── */}
        {showAuthPanel && (
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
                  onClick={() => setAuthTab('login')}
                  className={`relative z-10 px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                    authTab === 'login' ? 'text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5 inline mr-1.5" />
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthTab('signup')}
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

            {/* Auth Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-4" noValidate>
              {authTab === 'signup' && (
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
                  />
                  {showAuthError('name') && <p className="field-error">{authErrors.name}</p>}
                </div>
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
                />
                {showAuthError('email') && <p className="field-error">{authErrors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="field-label text-slate-400">Password</label>
                <input
                  type="password"
                  value={password}
                  onBlur={() => markAuthTouched('password')}
                  onChange={(e) => {
                    markAuthTouched('password');
                    setPassword(e.target.value);
                  }}
                  placeholder="••••••••"
                  className="input-select-field text-sm"
                />
                {showAuthError('password') && <p className="field-error">{authErrors.password}</p>}
              </div>

              <button
                type="submit"
                className="w-full h-13 mt-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                {authTab === 'login' ? 'Sign In & Lock Selected Seats' : 'Create Account & Lock Seats'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* ── STATE B: Authenticated Checkout Sheet ───────────────────────────── */}
        {user && hasCart && (
          <div className="glass-panel p-6 md:p-8 space-y-6 animate-panelIn transition-card border-emerald-500/40">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                  Step 2 of 2
                </span>
                <h2 className="text-xl font-black text-white">Checkout & Payment</h2>
              </div>
              
              {/* 10m Hold Countdown Badge */}
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
                <Clock className="w-4 h-4 animate-pulse" />
                <span>Hold: {formattedHoldTime}</span>
              </div>
            </div>

            {/* Selected Seats Breakdown */}
            <div className="space-y-3">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-indigo-400" />
                <span>Reserved Seats Summary ({activeCart.length}/6 max)</span>
              </p>
              <div className="space-y-2">
                {activeCart.map((item) => (
                  <div
                    key={item.seatId}
                    className="flex items-center justify-between bg-slate-950/70 border border-slate-800 p-3 rounded-2xl text-xs font-semibold"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-white font-black">
                        {item.seatNo}
                      </span>
                      <div>
                        <p className="text-white font-bold">{item.class}</p>
                        <p className="text-slate-500 text-[10px]">10m Atomic Segment Lock Active</p>
                      </div>
                    </div>
                    <span className="text-emerald-400 font-black text-sm">
                      LKR {(item.price ?? 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Fare Card */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
              <div>
                <p className="text-slate-400 text-xs">Total Reservation Fare</p>
                <p className="text-xs text-slate-500">Includes all taxes & booking fee</p>
              </div>
              <p className="text-2xl font-black text-white">LKR {totalAmount.toLocaleString()}</p>
            </div>

            {/* Payment Methods */}
            <div className="space-y-2.5">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Select Payment Method</p>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mx-auto mb-1 text-indigo-400" />
                  <span className="text-[11px] block">Visa / Master</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('qr')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'qr'
                      ? 'bg-emerald-600/20 border-emerald-500 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                  <span className="text-[11px] block">LANKAPAY QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbank')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'netbank'
                      ? 'bg-amber-600/20 border-amber-500 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                  <span className="text-[11px] block">Online Bank</span>
                </button>
              </div>
            </div>

            {/* Confirm & Issue Ticket Button */}
            <button
              onClick={handleConfirmPayment}
              disabled={isProcessingPayment}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/30 cursor-pointer disabled:opacity-50"
            >
              {isProcessingPayment ? (
                <span>Processing Payment…</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Pay LKR {totalAmount.toLocaleString()} & Issue PDF Ticket</span>
                </>
              )}
            </button>

          </div>
        )}

        {/* ── STATE C: Idle Welcome & Rules Card (Shown when not checking out) ── */}
        {(!showAuthPanel && !(user && hasCart)) && (
          <div className="glass-panel p-6 md:p-8 space-y-5 animate-panelIn transition-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Interactive Seat Reservation Rules</h3>
                <p className="text-slate-400 text-xs">Sri Lanka Railways Bitmask Availability Protocol</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                  1
                </span>
                <p><strong>Guest-First View</strong>: Anyone can view real-time seat availability on the Train Coach on the RIGHT.</p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                  2
                </span>
                <p><strong>10-Minute Atomic Hold</strong>: Selecting a seat immediately locks it on PostgreSQL row level for 10 minutes.</p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                  3
                </span>
                <p><strong>Bitmask Segment Hold</strong>: Seats booked for intermediate stops (e.g. Colombo to Kandy) automatically remain free for subsequent legs (e.g. Kandy to Badulla).</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Maximum Limit</span>
              <span className="text-white font-black">6 Seats per passenger</span>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
